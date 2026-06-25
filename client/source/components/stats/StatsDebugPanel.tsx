import { useConnectionStore } from "../../stores/connectionStore.js";
import { broadcastDebugMessage } from "../../utilities/broadcastDebugMessage.js";
import type { OverlayStatsSnapshot } from "@twitch-overlay/types";
import styles from "../debugPanel/DebugPanel.module.scss";

const oneMinute = 60 * 1_000;
const oneHour = 60 * oneMinute;

function broadcastSnapshot(snapshot: OverlayStatsSnapshot): void {
  void broadcastDebugMessage({ kind: "statsSnapshot", data: snapshot });
}

function buildSampleGoals(): OverlayStatsSnapshot["goals"] {
  return [
    {
      goalId: "sample-follower-goal",
      kind: "follower",
      description: "Follower goal",
      currentAmount: 142,
      targetAmount: 500,
    },
    {
      goalId: "sample-sub-goal",
      kind: "subscriptionCount",
      description: "Sub goal",
      currentAmount: 18,
      targetAmount: 50,
    },
  ];
}

function buildSampleSnapshot(): OverlayStatsSnapshot {
  const now = Date.now();
  return {
    goals: buildSampleGoals(),
    latestSubscription: {
      alertId: "sample-sub",
      kind: "subscription",
      userDisplayName: "CoolViewer",
      tier: "tier2",
      isResubscription: true,
      cumulativeMonths: 12,
      message: null,
      receivedAt: now - 2 * oneMinute,
    },
    latestFollow: {
      alertId: "sample-follow",
      kind: "follow",
      userDisplayName: "NewFollower",
      receivedAt: now - 10 * oneMinute,
    },
    latestCheer: {
      alertId: "sample-cheer",
      kind: "cheer",
      userDisplayName: "CheerViewer",
      isAnonymous: false,
      bits: 1_000,
      message: "",
      receivedAt: now - oneHour,
    },
    latestGift: {
      alertId: "sample-gift",
      kind: "subscriptionGift",
      gifterDisplayName: "GenerousViewer",
      isAnonymous: false,
      tier: "tier1",
      giftCount: 5,
      cumulativeTotal: null,
      receivedAt: now - 2 * oneHour,
    },
    generatedAt: now,
  };
}

function buildEmptySnapshot(): OverlayStatsSnapshot {
  return {
    goals: [],
    latestSubscription: null,
    latestFollow: null,
    latestCheer: null,
    latestGift: null,
    generatedAt: Date.now(),
  };
}

export function StatsDebugPanel() {
  const connectionStatus = useConnectionStore((state) => state.status);

  function injectFullSample(): void {
    broadcastSnapshot(buildSampleSnapshot());
  }

  function injectGoalsOnly(): void {
    broadcastSnapshot({ ...buildEmptySnapshot(), goals: buildSampleGoals() });
  }

  function clearStats(): void {
    broadcastSnapshot(buildEmptySnapshot());
  }

  return (
    <div className={styles.debugPanel}>
      <div className={styles.statusRow}>
        <span
          className={`${styles.statusIndicator} ${styles[`status_${connectionStatus}`]}`}
          aria-label={connectionStatus}
        />
        <span className={styles.statusLabel}>WebSocket: {connectionStatus}</span>
      </div>
      <div className={styles.buttonRow}>
        <button type="button" onClick={injectFullSample}>
          Sample (full)
        </button>
        <button type="button" onClick={injectGoalsOnly}>
          Goals only
        </button>
        <button type="button" onClick={clearStats}>
          Clear
        </button>
      </div>
    </div>
  );
}
