import type {
  OverlayGoal,
  OverlayGoalKind,
  TwitchChannelGoalEvent,
  TwitchChannelGoalType,
} from "@twitch-overlay/types";
import type { HelixCreatorGoal } from "./helixClient.js";

function translateGoalKind(twitchType: TwitchChannelGoalType): OverlayGoalKind {
  switch (twitchType) {
    case "follower":
      return "follower";
    case "subscription":
      return "subscription";
    case "subscription_count":
      return "subscriptionCount";
    case "new_subscription":
      return "newSubscription";
    case "new_subscription_count":
      return "newSubscriptionCount";
  }
}

export function transformHelixGoal(helixGoal: HelixCreatorGoal): OverlayGoal {
  return {
    goalId: helixGoal.id,
    kind: translateGoalKind(helixGoal.type),
    description: helixGoal.description,
    currentAmount: helixGoal.current_amount,
    targetAmount: helixGoal.target_amount,
  };
}

export function transformGoalEvent(event: TwitchChannelGoalEvent): OverlayGoal {
  return {
    goalId: event.id,
    kind: translateGoalKind(event.type),
    description: event.description,
    currentAmount: event.current_amount,
    targetAmount: event.target_amount,
  };
}
