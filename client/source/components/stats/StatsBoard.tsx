import { useStatsStore } from "../../stores/statsStore.js";
import type {
  OverlayCheerAlert,
  OverlaySubscriptionAlert,
  OverlaySubscriptionGiftAlert,
} from "@twitch-overlay/types";
import { GoalCard } from "./GoalCard.js";
import { LatestEventCard } from "./LatestEventCard.js";
import styles from "./StatsBoard.module.scss";

const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1_000;

function isWithinPast24Hours(timestampMilliseconds: number): boolean {
  return Date.now() - timestampMilliseconds < twentyFourHoursInMilliseconds;
}

function describeSubscriptionPrimary(alert: OverlaySubscriptionAlert): string {
  return alert.userDisplayName;
}

function describeSubscriptionSecondary(
  alert: OverlaySubscriptionAlert,
): string {
  const tierLabel =
    alert.tier === "prime"
      ? "Prime"
      : alert.tier === "tier1"
        ? "Tier 1"
        : alert.tier === "tier2"
          ? "Tier 2"
          : "Tier 3";
  if (alert.isResubscription && alert.cumulativeMonths !== null) {
    return `Resub · ${tierLabel} · ${alert.cumulativeMonths} months`;
  }
  return tierLabel;
}

function describeGiftPrimary(alert: OverlaySubscriptionGiftAlert): string {
  if (alert.isAnonymous || alert.gifterDisplayName === null) {
    return "Anonymous Gifter";
  }
  return alert.gifterDisplayName;
}

function describeGiftSecondary(alert: OverlaySubscriptionGiftAlert): string {
  return `${alert.giftCount} sub${alert.giftCount === 1 ? "" : "s"}`;
}

function describeCheerPrimary(alert: OverlayCheerAlert): string {
  if (alert.isAnonymous || alert.userDisplayName === null) {
    return "Anonymous";
  }
  return alert.userDisplayName;
}

function describeCheerSecondary(alert: OverlayCheerAlert): string {
  return `${alert.bits.toLocaleString()} bits`;
}

export function StatsBoard() {
  const snapshot = useStatsStore((state) => state.snapshot);

  if (snapshot === null) {
    return (
      <div className={styles.statsBoardEmpty}>
        <span>Connecting to stats…</span>
      </div>
    );
  }

  const recentCheer =
    snapshot.latestCheer && isWithinPast24Hours(snapshot.latestCheer.receivedAt)
      ? snapshot.latestCheer
      : null;
  const recentGift =
    snapshot.latestGift && isWithinPast24Hours(snapshot.latestGift.receivedAt)
      ? snapshot.latestGift
      : null;

  return (
    <div className={styles.statsBoard}>
      {snapshot.goals.length > 0 ? (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Goals</h2>
          <div className={styles.cardStack}>
            {snapshot.goals.map((goal) => (
              <GoalCard key={goal.goalId} goal={goal} />
            ))}
          </div>
        </section>
      ) : null}

      {snapshot.latestSubscription !== null || snapshot.latestFollow !== null ? (
        <section className={styles.section}>
          <div className={styles.cardStack}>
            {snapshot.latestSubscription !== null ? (
              <LatestEventCard
                label="Latest subscriber"
                primaryText={describeSubscriptionPrimary(snapshot.latestSubscription)}
                secondaryText={describeSubscriptionSecondary(snapshot.latestSubscription)}
                receivedAtMilliseconds={snapshot.latestSubscription.receivedAt}
              />
            ) : null}
            {snapshot.latestFollow !== null ? (
              <LatestEventCard
                label="Latest follower"
                primaryText={snapshot.latestFollow.userDisplayName}
                receivedAtMilliseconds={snapshot.latestFollow.receivedAt}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {recentCheer !== null || recentGift !== null ? (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Past 24 hours</h2>
          <div className={styles.cardStack}>
            {recentCheer !== null ? (
              <LatestEventCard
                label="Latest cheer"
                primaryText={describeCheerPrimary(recentCheer)}
                secondaryText={describeCheerSecondary(recentCheer)}
                receivedAtMilliseconds={recentCheer.receivedAt}
              />
            ) : null}
            {recentGift !== null ? (
              <LatestEventCard
                label="Latest gift sub"
                primaryText={describeGiftPrimary(recentGift)}
                secondaryText={describeGiftSecondary(recentGift)}
                receivedAtMilliseconds={recentGift.receivedAt}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
