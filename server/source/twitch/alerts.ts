import { randomUUID } from "node:crypto";
import type { HelixChannelFollower, HelixGoal } from "@twurple/api";
import type {
  EventSubChannelCheerEvent,
  EventSubChannelFollowEvent,
  EventSubChannelGoalBeginEvent,
  EventSubChannelGoalEndEvent,
  EventSubChannelGoalProgressEvent,
  EventSubChannelRaidEvent,
  EventSubChannelSubscriptionEvent,
  EventSubChannelSubscriptionGiftEvent,
  EventSubChannelSubscriptionMessageEvent,
} from "@twurple/eventsub-base";
import type {
  OverlayCheerAlert,
  OverlayFollowAlert,
  OverlayGoal,
  OverlayGoalKind,
  OverlayRaidAlert,
  OverlaySubscriptionAlert,
  OverlaySubscriptionGiftAlert,
  OverlaySubscriptionTier,
} from "@twitch-overlay/types";

const tier = (value: string): OverlaySubscriptionTier =>
  value === "3000" ? "tier3" : value === "2000" ? "tier2" : value === "Prime" ? "prime" : "tier1";

// EventSub goals use "follow"; Helix goals use "follower". Both map to "follower".
const goalKind = (type: string): OverlayGoalKind => {
  switch (type) {
    case "subscription": return "subscription";
    case "subscription_count": return "subscriptionCount";
    case "new_subscription": return "newSubscription";
    case "new_subscription_count": return "newSubscriptionCount";
    default: return "follower";
  }
};

export const subscriptionAlert = (e: EventSubChannelSubscriptionEvent): OverlaySubscriptionAlert => ({
  alertId: randomUUID(),
  kind: "subscription",
  userDisplayName: e.userDisplayName,
  tier: tier(e.tier),
  isResubscription: false,
  cumulativeMonths: null,
  message: null,
  receivedAt: Date.now(),
});

export const resubAlert = (e: EventSubChannelSubscriptionMessageEvent): OverlaySubscriptionAlert => ({
  alertId: randomUUID(),
  kind: "subscription",
  userDisplayName: e.userDisplayName,
  tier: tier(e.tier),
  isResubscription: true,
  cumulativeMonths: e.cumulativeMonths,
  message: e.messageText,
  receivedAt: Date.now(),
});

export const giftAlert = (e: EventSubChannelSubscriptionGiftEvent): OverlaySubscriptionGiftAlert => ({
  alertId: randomUUID(),
  kind: "subscriptionGift",
  gifterDisplayName: e.gifterDisplayName,
  isAnonymous: e.isAnonymous,
  tier: tier(e.tier),
  giftCount: e.amount,
  cumulativeTotal: e.cumulativeAmount,
  receivedAt: Date.now(),
});

export const followAlert = (e: EventSubChannelFollowEvent): OverlayFollowAlert => ({
  alertId: randomUUID(),
  kind: "follow",
  userDisplayName: e.userDisplayName,
  receivedAt: e.followDate.getTime(),
});

// Helix backfill of the "latest follower" slot at boot (real follow timestamp).
export const followerAlert = (f: HelixChannelFollower): OverlayFollowAlert => ({
  alertId: randomUUID(),
  kind: "follow",
  userDisplayName: f.userDisplayName,
  receivedAt: f.followDate.getTime(),
});

export const cheerAlert = (e: EventSubChannelCheerEvent): OverlayCheerAlert => ({
  alertId: randomUUID(),
  kind: "cheer",
  userDisplayName: e.userDisplayName,
  isAnonymous: e.isAnonymous,
  bits: e.bits,
  message: e.message,
  receivedAt: Date.now(),
});

export const raidAlert = (e: EventSubChannelRaidEvent): OverlayRaidAlert => ({
  alertId: randomUUID(),
  kind: "raid",
  fromBroadcasterDisplayName: e.raidingBroadcasterDisplayName,
  viewerCount: e.viewers,
  receivedAt: Date.now(),
});

type AnyGoal =
  | EventSubChannelGoalBeginEvent
  | EventSubChannelGoalProgressEvent
  | EventSubChannelGoalEndEvent
  | HelixGoal;

export const goal = (g: AnyGoal): OverlayGoal => ({
  goalId: g.id,
  kind: goalKind(g.type),
  description: g.description,
  currentAmount: g.currentAmount,
  targetAmount: g.targetAmount,
});
