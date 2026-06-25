import type {
  OverlayCheerAlert,
  OverlayFollowAlert,
  OverlayGoal,
  OverlayStatsSnapshot,
  OverlaySubscriptionAlert,
  OverlaySubscriptionGiftAlert,
} from "@twitch-overlay/types";

/**
 * In-memory holder for everything the /stats overlay renders. The server
 * mutates this on EventSub events and serializes a full OverlayStatsSnapshot
 * to clients (chosen over a diff-based protocol because the snapshot is
 * small — ~1 KB — and the simplicity is worth it).
 *
 * No persistence: a server restart wipes the "latest X" slots. Twitch
 * creator goals re-seed at boot via Helix /goals; everything else fills
 * back in as new events arrive. SQLite-backed history is a Phase 2 concern.
 */
export class StatsStore {
  private readonly goalsByGoalId = new Map<string, OverlayGoal>();
  private latestSubscription: OverlaySubscriptionAlert | null = null;
  private latestFollow: OverlayFollowAlert | null = null;
  private latestCheer: OverlayCheerAlert | null = null;
  private latestGift: OverlaySubscriptionGiftAlert | null = null;

  upsertGoal(goal: OverlayGoal): void {
    this.goalsByGoalId.set(goal.goalId, goal);
  }

  removeGoal(goalId: string): void {
    this.goalsByGoalId.delete(goalId);
  }

  setLatestSubscription(alert: OverlaySubscriptionAlert): void {
    this.latestSubscription = alert;
  }

  setLatestFollow(alert: OverlayFollowAlert): void {
    this.latestFollow = alert;
  }

  setLatestCheer(alert: OverlayCheerAlert): void {
    this.latestCheer = alert;
  }

  setLatestGift(alert: OverlaySubscriptionGiftAlert): void {
    this.latestGift = alert;
  }

  buildSnapshot(): OverlayStatsSnapshot {
    return {
      goals: Array.from(this.goalsByGoalId.values()),
      latestSubscription: this.latestSubscription,
      latestFollow: this.latestFollow,
      latestCheer: this.latestCheer,
      latestGift: this.latestGift,
      generatedAt: Date.now(),
    };
  }
}
