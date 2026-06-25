import { serve } from "@hono/node-server";
import { RefreshingAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { EventSubWsListener } from "@twurple/eventsub-ws";
import { loadConfiguration, type ApplicationConfiguration } from "./configuration.ts";
import { ChatMessageBuilder } from "./twitch/chatMessages.ts";
import * as alerts from "./twitch/alerts.ts";
import { StatsStore } from "./stats/statsStore.ts";
import { createApplication } from "./http/application.ts";
import { WebSocketBroadcaster } from "./http/webSocketBroadcaster.ts";

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

// Fire-and-forget POST to voisona-bot's /speak pipe. No-op unless configured.
function speak(config: ApplicationConfiguration, text: string): void {
  if (!config.voisonaSpeakUrl || !config.voisonaApiKey) {
    return;
  }
  fetch(config.voisonaSpeakUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": config.voisonaApiKey },
    body: JSON.stringify({ text }),
  }).catch((error) => console.error("[speak] pipe failed:", errorMessage(error)));
}

async function main(): Promise<void> {
  const config = loadConfiguration();

  const authProvider = new RefreshingAuthProvider({
    clientId: config.twitchClientId,
    clientSecret: config.twitchClientSecret,
  });
  // expiresIn: 0 forces a refresh on first use, so a stale access token in .env
  // still boots. Tokens stay in memory only — writing them back to .env restarts
  // the dev watcher, and the refresh token is stable across restarts.
  const userId = await authProvider.addUserForToken(
    {
      accessToken: config.twitchAccessToken,
      refreshToken: config.twitchRefreshToken,
      expiresIn: 0,
      obtainmentTimestamp: 0,
    },
    ["chat"],
  );
  console.log(`[boot] authenticated (user_id=${userId})`);

  const api = new ApiClient({ authProvider });

  const chatBuilder = new ChatMessageBuilder(api);
  console.log("[boot] caching global + channel badges...");
  await chatBuilder.loadBadges(userId);

  const stats = new StatsStore();
  const broadcaster = new WebSocketBroadcaster();
  const { application, injectWebSocket } = createApplication({
    webSocketBroadcaster: broadcaster,
    statsStore: stats,
  });

  const pushStats = (): void =>
    broadcaster.broadcast({ kind: "statsSnapshot", data: stats.buildSnapshot() });

  // Seed goals + latest follower from Helix so the stats overlay isn't empty on
  // restart. Both rely on optional scopes — a thrown error just skips the slot.
  try {
    for (const helixGoal of await api.goals.getGoals(userId)) {
      stats.upsertGoal(alerts.goal(helixGoal));
    }
  } catch (error) {
    console.warn(`[boot] could not seed goals (channel:read:goals?): ${errorMessage(error)}`);
  }
  try {
    const { data } = await api.channels.getChannelFollowers(userId, undefined, { limit: 1 });
    if (data[0]) {
      stats.setLatestFollow(alerts.followerAlert(data[0]));
      console.log(`[boot] seeded latest follower (${data[0].userDisplayName})`);
    }
  } catch (error) {
    console.warn(
      `[boot] could not seed latest follower (moderator:read:followers?): ${errorMessage(error)}`,
    );
  }

  const listener = new EventSubWsListener({ apiClient: api });

  listener.onChannelChatMessage(userId, userId, async (event) => {
    try {
      broadcaster.broadcast({ kind: "chatMessage", data: await chatBuilder.build(event) });
    } catch (error) {
      console.error("[chat] failed to transform/broadcast:", error);
    }
  });

  listener.onChannelSubscription(userId, (event) => {
    if (event.isGift) {
      return; // gifted recipients arrive via onChannelSubscriptionGift
    }
    const alert = alerts.subscriptionAlert(event);
    broadcaster.broadcast({ kind: "alertEvent", data: alert });
    stats.setLatestSubscription(alert);
    pushStats();
  });

  listener.onChannelSubscriptionMessage(userId, (event) => {
    const alert = alerts.resubAlert(event);
    broadcaster.broadcast({ kind: "alertEvent", data: alert });
    stats.setLatestSubscription(alert);
    pushStats();
  });

  listener.onChannelSubscriptionGift(userId, (event) => {
    const alert = alerts.giftAlert(event);
    broadcaster.broadcast({ kind: "alertEvent", data: alert });
    stats.setLatestGift(alert);
    pushStats();
    // Thank the gifter out loud via voisona-bot's TTS pipe.
    speak(
      config,
      event.gifterDisplayName
        ? `Thank you ${event.gifterDisplayName} for gifting ${event.amount} subs!`
        : `Thanks for the ${event.amount} gifted subs!`,
    );
  });

  listener.onChannelFollow(userId, userId, (event) => {
    const alert = alerts.followAlert(event);
    broadcaster.broadcast({ kind: "alertEvent", data: alert });
    stats.setLatestFollow(alert);
    pushStats();
  });

  listener.onChannelCheer(userId, (event) => {
    const alert = alerts.cheerAlert(event);
    broadcaster.broadcast({ kind: "alertEvent", data: alert });
    stats.setLatestCheer(alert);
    pushStats();
  });

  // voisona-bot already shouts out raiders; here we just play the overlay alert.
  listener.onChannelRaidTo(userId, (event) => {
    broadcaster.broadcast({ kind: "alertEvent", data: alerts.raidAlert(event) });
  });

  listener.onChannelGoalBegin(userId, (event) => {
    stats.upsertGoal(alerts.goal(event));
    pushStats();
  });
  listener.onChannelGoalProgress(userId, (event) => {
    stats.upsertGoal(alerts.goal(event));
    pushStats();
  });
  listener.onChannelGoalEnd(userId, (event) => {
    stats.removeGoal(event.id);
    pushStats();
  });

  listener.onSubscriptionCreateFailure((subscription, error) => {
    // One missing scope (e.g. channel:read:goals) shouldn't take the overlay
    // down — Twurple keeps the other subscriptions alive.
    console.warn(`[eventsub] subscription failed: ${subscription.id}: ${errorMessage(error)}`);
  });

  listener.start();

  const httpServer = serve({ fetch: application.fetch, port: config.serverPort });
  injectWebSocket(httpServer);
  console.log(`[boot] HTTP + WebSocket server on http://localhost:${config.serverPort}`);

  const shutdown = (): void => {
    console.log("[shutdown] stopping...");
    listener.stop();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2_000).unref();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error: unknown) => {
  console.error("[boot] failed to start server:", error);
  process.exit(1);
});
