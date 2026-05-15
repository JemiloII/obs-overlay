import { useAlertQueueStore } from "../../stores/alertQueueStore.js";
import { useConnectionStore } from "../../stores/connectionStore.js";
import type { OverlayAlertEvent } from "@twitch-overlay/types";
import { broadcastDebugMessage } from "../../utilities/broadcastDebugMessage.js";
import styles from "./AlertDebugPanel.module.scss";

let sampleAlertCounter = 0;
function newSampleAlertId(): string {
  sampleAlertCounter += 1;
  return `sample-alert-${sampleAlertCounter}-${Date.now()}`;
}

export function AlertDebugPanel() {
  const connectionStatus = useConnectionStore((state) => state.status);
  const pendingCount = useAlertQueueStore((state) => state.pendingAlerts.length);

  function inject(alert: OverlayAlertEvent): void {
    void broadcastDebugMessage({ kind: "alertEvent", data: alert });
  }

  return (
    <div className={styles.debugPanel}>
      <div className={styles.statusRow}>
        <span
          className={`${styles.statusIndicator} ${styles[`status_${connectionStatus}`]}`}
          aria-label={connectionStatus}
        />
        <span className={styles.statusLabel}>
          WebSocket: {connectionStatus} · queued: {pendingCount}
        </span>
      </div>
      <div className={styles.buttonRow}>
        <button
          type="button"
          onClick={() =>
            inject({
              alertId: newSampleAlertId(),
              kind: "subscription",
              userDisplayName: "SampleViewer",
              tier: "tier1",
              isResubscription: false,
              cumulativeMonths: null,
              message: null,
              receivedAt: Date.now(),
            })
          }
        >
          Sub T1
        </button>
        <button
          type="button"
          onClick={() =>
            inject({
              alertId: newSampleAlertId(),
              kind: "subscription",
              userDisplayName: "SampleViewer",
              tier: "tier2",
              isResubscription: true,
              cumulativeMonths: 12,
              message: "Love the stream!",
              receivedAt: Date.now(),
            })
          }
        >
          Resub T2
        </button>
        <button
          type="button"
          onClick={() =>
            inject({
              alertId: newSampleAlertId(),
              kind: "subscription",
              userDisplayName: "SampleViewer",
              tier: "tier3",
              isResubscription: true,
              cumulativeMonths: 24,
              message: null,
              receivedAt: Date.now(),
            })
          }
        >
          Resub T3
        </button>
        <button
          type="button"
          onClick={() =>
            inject({
              alertId: newSampleAlertId(),
              kind: "subscriptionGift",
              gifterDisplayName: "GenerousViewer",
              isAnonymous: false,
              tier: "tier1",
              giftCount: 5,
              cumulativeTotal: 25,
              receivedAt: Date.now(),
            })
          }
        >
          Gift x5
        </button>
        <button
          type="button"
          onClick={() =>
            inject({
              alertId: newSampleAlertId(),
              kind: "follow",
              userDisplayName: "NewFollower",
              receivedAt: Date.now(),
            })
          }
        >
          Follow
        </button>
        <button
          type="button"
          onClick={() =>
            inject({
              alertId: newSampleAlertId(),
              kind: "cheer",
              userDisplayName: "CheerViewer",
              isAnonymous: false,
              bits: 500,
              message: "Take my bits!",
              receivedAt: Date.now(),
            })
          }
        >
          Cheer 500
        </button>
        <button
          type="button"
          onClick={() =>
            inject({
              alertId: newSampleAlertId(),
              kind: "raid",
              fromBroadcasterDisplayName: "FellowStreamer",
              viewerCount: 42,
              receivedAt: Date.now(),
            })
          }
        >
          Raid 42
        </button>
        <button
          type="button"
          onClick={() =>
            inject({
              alertId: newSampleAlertId(),
              kind: "channelPointsRedemption",
              userDisplayName: "RedeemerViewer",
              rewardId: "sample-reward",
              rewardTitle: "Highlight My Message",
              rewardCost: 100,
              userInput: "look at me!",
              receivedAt: Date.now(),
            })
          }
        >
          Redeem
        </button>
      </div>
    </div>
  );
}
