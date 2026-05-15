import { randomUUID } from "node:crypto";
import type {
  OverlayChannelPointsRedemptionAlert,
  OverlayCheerAlert,
  OverlayFollowAlert,
  OverlayRaidAlert,
  OverlaySubscriptionAlert,
  OverlaySubscriptionGiftAlert,
  OverlaySubscriptionTier,
  TwitchChannelCheerEvent,
  TwitchChannelFollowEvent,
  TwitchChannelPointsRedemptionEvent,
  TwitchChannelRaidEvent,
  TwitchChannelSubscribeEvent,
  TwitchChannelSubscriptionGiftEvent,
  TwitchChannelSubscriptionMessageEvent,
  TwitchSubscriptionTier,
} from "@twitch-overlay/types";

function translateSubscriptionTier(
  twitchTier: TwitchSubscriptionTier,
): OverlaySubscriptionTier {
  switch (twitchTier) {
    case "1000":
      return "tier1";
    case "2000":
      return "tier2";
    case "3000":
      return "tier3";
    case "Prime":
      return "prime";
  }
}

function newAlertId(): string {
  return randomUUID();
}

export function transformSubscribeEvent(
  event: TwitchChannelSubscribeEvent,
): OverlaySubscriptionAlert {
  return {
    alertId: newAlertId(),
    kind: "subscription",
    userDisplayName: event.user_name,
    tier: translateSubscriptionTier(event.tier),
    isResubscription: false,
    cumulativeMonths: null,
    message: null,
    receivedAt: Date.now(),
  };
}

export function transformSubscriptionMessageEvent(
  event: TwitchChannelSubscriptionMessageEvent,
): OverlaySubscriptionAlert {
  return {
    alertId: newAlertId(),
    kind: "subscription",
    userDisplayName: event.user_name,
    tier: translateSubscriptionTier(event.tier),
    isResubscription: true,
    cumulativeMonths: event.cumulative_months,
    message: event.message.text,
    receivedAt: Date.now(),
  };
}

export function transformSubscriptionGiftEvent(
  event: TwitchChannelSubscriptionGiftEvent,
): OverlaySubscriptionGiftAlert {
  return {
    alertId: newAlertId(),
    kind: "subscriptionGift",
    gifterDisplayName: event.user_name,
    isAnonymous: event.is_anonymous,
    tier: translateSubscriptionTier(event.tier),
    giftCount: event.total,
    cumulativeTotal: event.cumulative_total,
    receivedAt: Date.now(),
  };
}

export function transformFollowEvent(
  event: TwitchChannelFollowEvent,
): OverlayFollowAlert {
  return {
    alertId: newAlertId(),
    kind: "follow",
    userDisplayName: event.user_name,
    receivedAt: Date.now(),
  };
}

export function transformCheerEvent(
  event: TwitchChannelCheerEvent,
): OverlayCheerAlert {
  return {
    alertId: newAlertId(),
    kind: "cheer",
    userDisplayName: event.user_name,
    isAnonymous: event.is_anonymous,
    bits: event.bits,
    message: event.message,
    receivedAt: Date.now(),
  };
}

export function transformRaidEvent(
  event: TwitchChannelRaidEvent,
): OverlayRaidAlert {
  return {
    alertId: newAlertId(),
    kind: "raid",
    fromBroadcasterDisplayName: event.from_broadcaster_user_name,
    viewerCount: event.viewers,
    receivedAt: Date.now(),
  };
}

export function transformChannelPointsRedemptionEvent(
  event: TwitchChannelPointsRedemptionEvent,
): OverlayChannelPointsRedemptionAlert {
  return {
    alertId: newAlertId(),
    kind: "channelPointsRedemption",
    userDisplayName: event.user_name,
    rewardId: event.reward.id,
    rewardTitle: event.reward.title,
    rewardCost: event.reward.cost,
    userInput: event.user_input,
    receivedAt: Date.now(),
  };
}
