import type { OverlayGoal, OverlayGoalKind } from "@twitch-overlay/types";
import styles from "./GoalCard.module.scss";

export type GoalCardProperties = {
  goal: OverlayGoal;
};

function describeKind(kind: OverlayGoalKind): string {
  switch (kind) {
    case "follower":
      return "Followers";
    case "subscription":
      return "Sub Points";
    case "subscriptionCount":
      return "Subscribers";
    case "newSubscription":
      return "New Sub Points";
    case "newSubscriptionCount":
      return "New Subscribers";
  }
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 100) {
    return 100;
  }
  return value;
}

export function GoalCard({ goal }: GoalCardProperties) {
  const rawPercentage = goal.targetAmount > 0
    ? (goal.currentAmount / goal.targetAmount) * 100
    : 0;
  const visiblePercentage = clampPercentage(rawPercentage);
  const formattedPercentage = Math.floor(visiblePercentage);

  return (
    <div className={styles.goalCard}>
      <div className={styles.goalHeader}>
        <span className={styles.goalKind}>{describeKind(goal.kind)}</span>
        <span className={styles.goalPercentage}>{formattedPercentage}%</span>
      </div>
      {goal.description.length > 0 ? (
        <div className={styles.goalDescription}>{goal.description}</div>
      ) : null}
      <div className={styles.goalProgressTrack}>
        <div
          className={styles.goalProgressFill}
          style={{ width: `${visiblePercentage}%` }}
        />
      </div>
      <div className={styles.goalAmount}>
        <span className={styles.goalAmountCurrent}>
          {goal.currentAmount.toLocaleString()}
        </span>
        <span className={styles.goalAmountSeparator}>/</span>
        <span className={styles.goalAmountTarget}>
          {goal.targetAmount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
