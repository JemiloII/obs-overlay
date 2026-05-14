import { serve } from "@hono/node-server";
import { loadConfiguration } from "./configuration.js";
import {
  TwitchAuthenticationManager,
  ensureRequiredScopes,
} from "./twitch/authentication.js";
import { HelixClient } from "./twitch/helixClient.js";
import { UserProfileCache } from "./caches/userProfileCache.js";
import { BadgeCache } from "./caches/badgeCache.js";
import { MessageTransformer } from "./twitch/messageTransformer.js";
import { TwitchEventSubscriptionClient } from "./twitch/eventSubscriptionClient.js";
import { createApplication } from "./http/application.js";
import { WebSocketBroadcaster } from "./http/webSocketBroadcaster.js";

async function main(): Promise<void> {
  const configuration = loadConfiguration();
  const authentication = new TwitchAuthenticationManager({
    clientId: configuration.twitchClientId,
    clientSecret: configuration.twitchClientSecret,
    accessToken: configuration.twitchAccessToken,
    refreshToken: configuration.twitchRefreshToken,
  });

  console.log("[boot] validating Twitch access token...");
  const tokenInformation = await authentication.validateOrRefresh();
  ensureRequiredScopes(tokenInformation.scopes, ["user:read:chat"]);
  console.log(
    `[boot] authenticated as ${tokenInformation.loginName} (user_id=${tokenInformation.userId})`,
  );

  const helixClient = new HelixClient(authentication);
  const userProfileCache = new UserProfileCache(helixClient);
  const badgeCache = new BadgeCache(helixClient);

  console.log("[boot] caching global + channel badges...");
  await badgeCache.initialize(tokenInformation.userId);

  const messageTransformer = new MessageTransformer(userProfileCache, badgeCache);
  const webSocketBroadcaster = new WebSocketBroadcaster();
  const { application, injectWebSocket } = createApplication({
    webSocketBroadcaster,
  });

  const eventSubscriptionClient = new TwitchEventSubscriptionClient({
    broadcasterUserId: tokenInformation.userId,
    authenticatedUserId: tokenInformation.userId,
    helixClient,
  });

  eventSubscriptionClient.on("chatMessage", async (event) => {
    try {
      const overlayMessage = await messageTransformer.transform(event);
      webSocketBroadcaster.broadcast({
        kind: "chatMessage",
        data: overlayMessage,
      });
    } catch (transformError) {
      console.error("[chat] failed to transform/broadcast message:", transformError);
    }
  });

  eventSubscriptionClient.on("bitsUse", (event) => {
    // Retained for Phase 2 (channel-points / bits-gated customizations).
    // Quiet for now; flip to console.log if you need to inspect raw payloads.
    void event;
  });

  eventSubscriptionClient.on("fatalError", (error) => {
    console.error("[eventsub] fatal error:", error.message);
    process.exitCode = 1;
  });

  eventSubscriptionClient.start();

  const httpServer = serve({
    fetch: application.fetch,
    port: configuration.serverPort,
  });
  injectWebSocket(httpServer);

  console.log(
    `[boot] HTTP + WebSocket server listening on http://localhost:${configuration.serverPort}`,
  );

  function gracefulShutdown(): void {
    console.log("[shutdown] stopping...");
    eventSubscriptionClient.stop();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2_000).unref();
  }

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

main().catch((error: unknown) => {
  console.error("[boot] failed to start server:", error);
  process.exit(1);
});
