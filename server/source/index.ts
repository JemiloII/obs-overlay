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
import {
  buildFollowAlertFromHelixFollower,
  transformCheerEvent,
  transformFollowEvent,
  transformRaidEvent,
  transformSubscribeEvent,
  transformSubscriptionGiftEvent,
  transformSubscriptionMessageEvent,
} from "./twitch/alertTransformer.js";
import {
  transformGoalEvent,
  transformHelixGoal,
} from "./twitch/goalsTransformer.js";
import { StatsStore } from "./stats/statsStore.js";
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
  const botUserId = tokenInformation.userId;
  const broadcasterUserId = '23256990';
  ensureRequiredScopes(tokenInformation.scopes, ["user:read:chat"]);
  console.log(
    `[boot] authenticated as ${tokenInformation.loginName} (user_id=${botUserId}), token valid for ~${Math.round(tokenInformation.expiresInSeconds / 60)} minutes`,
  );
  // Keep the access token fresh forever: refresh ~10 minutes before each
  // expiry. Without this, long-running sessions silently break after the
  // initial ~4-hour token lifetime.
  authentication.startProactiveRefresh(tokenInformation.expiresInSeconds);

  const helixClient = new HelixClient(authentication);
  const userProfileCache = new UserProfileCache(helixClient);
  const badgeCache = new BadgeCache(helixClient);

  console.log("[boot] caching global + channel badges...");
  await badgeCache.initialize(botUserId);


  const messageTransformer = new MessageTransformer(userProfileCache, badgeCache);
  const statsStore = new StatsStore();
  const webSocketBroadcaster = new WebSocketBroadcaster();
  const { application, injectWebSocket } = createApplication({
    webSocketBroadcaster,
    statsStore,
  });

  // Seed creator goals from Helix. The channel:read:goals scope is optional —
  // missing scope just leaves the goals slot empty until/unless the scope
  // is added and the user restarts.
  try {
    const initialGoals = await helixClient.getCreatorGoals(botUserId);
    for (const goal of initialGoals) {
      statsStore.upsertGoal(transformHelixGoal(goal));
    }
    console.log(`[boot] seeded ${initialGoals.length} creator goal(s) from Helix`);
  } catch (goalSeedError) {
    const message =
      goalSeedError instanceof Error
        ? goalSeedError.message
        : String(goalSeedError);
    console.warn(
      `[boot] could not seed creator goals (channel:read:goals scope missing?): ${message}`,
    );
  }

  // Backfill the "latest follower" slot from Helix so the stats overlay isn't
  // empty between live follows (the in-memory store is wiped on restart).
  // Requires moderator:read:followers — missing scope just skips this.
  // Note: "latest subscriber/cheer/gift" have no time-ordered Helix history
  // endpoint, so those stay live-only and fill in as events arrive.
  try {
    const latestFollower = await helixClient.getLatestFollower(
      botUserId,
    );
    if (latestFollower) {
      statsStore.setLatestFollow(
        buildFollowAlertFromHelixFollower(latestFollower),
      );
      console.log(
        `[boot] seeded latest follower (${latestFollower.user_name}) from Helix`,
      );
    } else {
      console.log("[boot] no followers to seed");
    }
  } catch (followerSeedError) {
    const message =
      followerSeedError instanceof Error
        ? followerSeedError.message
        : String(followerSeedError);
    console.warn(
      `[boot] could not seed latest follower (moderator:read:followers scope missing?): ${message}`,
    );
  }

  function broadcastStatsSnapshot(): void {
    webSocketBroadcaster.broadcast({
      kind: "statsSnapshot",
      data: statsStore.buildSnapshot(),
    });
  }

  const eventSubscriptionClient = new TwitchEventSubscriptionClient({
    broadcasterUserId: botUserId,
    authenticatedUserId: botUserId,
    helixClient,
  });

  eventSubscriptionClient.on("chatMessage", async (event) => {
    try {
      // { say, args, isMod, api, broadcaster, botUserId, user }
      const overlayMessage = await messageTransformer.transform(event);
      console.log('event:', event);
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

  eventSubscriptionClient.on("subscribe", (event) => {
    // Skip gifted recipients here — channel.subscription.gift carries the
    // gift event we actually want to play an alert for.
    if (event.is_gift) {
      return;
    }
    const alert = transformSubscribeEvent(event);
    webSocketBroadcaster.broadcast({ kind: "alertEvent", data: alert });
    statsStore.setLatestSubscription(alert);
    broadcastStatsSnapshot();
  });

  eventSubscriptionClient.on("subscriptionMessage", (event) => {
    const alert = transformSubscriptionMessageEvent(event);
    webSocketBroadcaster.broadcast({ kind: "alertEvent", data: alert });
    statsStore.setLatestSubscription(alert);
    broadcastStatsSnapshot();
  });

  eventSubscriptionClient.on("subscriptionGift", (event) => {
    const alert = transformSubscriptionGiftEvent(event);
    webSocketBroadcaster.broadcast({ kind: "alertEvent", data: alert });
    statsStore.setLatestGift(alert);
    broadcastStatsSnapshot();
  });

  eventSubscriptionClient.on("follow", (event) => {
    const alert = transformFollowEvent(event);
    webSocketBroadcaster.broadcast({ kind: "alertEvent", data: alert });
    statsStore.setLatestFollow(alert);
    broadcastStatsSnapshot();
  });

  eventSubscriptionClient.on("cheer", (event) => {
    const alert = transformCheerEvent(event);
    webSocketBroadcaster.broadcast({ kind: "alertEvent", data: alert });
    statsStore.setLatestCheer(alert);
    broadcastStatsSnapshot();
  });

  eventSubscriptionClient.on("raid", async (event) => {
    webSocketBroadcaster.broadcast({
      kind: "alertEvent",
      data: transformRaidEvent(event),
    });

    await helixClient.sendChatMessage(broadcasterUserId, botUserId, `!shoutout @${event.from_broadcaster_user_name}`);
  });

  eventSubscriptionClient.on("goalBegin", (event) => {
    statsStore.upsertGoal(transformGoalEvent(event));
    broadcastStatsSnapshot();
  });

  eventSubscriptionClient.on("goalProgress", (event) => {
    statsStore.upsertGoal(transformGoalEvent(event));
    broadcastStatsSnapshot();
  });

  eventSubscriptionClient.on("goalEnd", (event) => {
    // Goals stay on screen briefly after ending so viewers see the
    // completion frame, then disappear on the next snapshot push. The
    // simplest implementation is "remove immediately" — Twitch fires
    // goal.end only once, so the goal is gone on the next refresh.
    statsStore.removeGoal(event.id);
    broadcastStatsSnapshot();
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
    authentication.stopProactiveRefresh();
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
