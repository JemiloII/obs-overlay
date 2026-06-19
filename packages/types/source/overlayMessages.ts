export type OverlayPlatform = "twitch";

export type OverlayMessageType =
  | "text"
  | "channelPointsHighlighted"
  | "channelPointsSubOnly"
  | "userIntroduction"
  | "powerUpsMessageEffect"
  | "powerUpsGigantifiedEmote";

export type OverlayBadge = {
  setId: string;
  badgeId: string;
  imageUrlSmall: string;
  imageUrlMedium: string;
  imageUrlLarge: string;
  title: string;
};

export type OverlayChatter = {
  userId: string;
  loginName: string;
  displayName: string;
  color: string;
  profileImageUrl: string;
};

export type OverlayTextFragment = {
  type: "text";
  text: string;
};

export type OverlayEmoteFragment = {
  type: "emote";
  text: string;
  emoteId: string;
  imageUrlSmall: string;
  imageUrlMedium: string;
  imageUrlLarge: string;
  animated: boolean;
};

export type OverlayCheermoteFragment = {
  type: "cheermote";
  text: string;
  prefix: string;
  bits: number;
  tier: number;
};

export type OverlayMentionFragment = {
  type: "mention";
  text: string;
  userId: string;
  loginName: string;
  displayName: string;
};

export type OverlayMessageFragment =
  | OverlayTextFragment
  | OverlayEmoteFragment
  | OverlayCheermoteFragment
  | OverlayMentionFragment;

export type OverlayReply = {
  parentMessageId: string;
  parentMessageBody: string;
  parentUserDisplayName: string;
};

export type OverlayMessageEffectId =
  | "cosmic-abyss"
  | "rainbow-eclipse"
  | "simmer"
  | (string & {});

export type OverlayChatMessage = {
  messageId: string;
  platform: OverlayPlatform;
  chatter: OverlayChatter;
  badges: OverlayBadge[];
  fragments: OverlayMessageFragment[];
  messageType: OverlayMessageType;
  messageEffectId: OverlayMessageEffectId | null;
  reply: OverlayReply | null;
  receivedAt: number;
};

// ============================================================================
// Alerts protocol
// ============================================================================

export type OverlayAlertKind =
  | "subscription"
  | "subscriptionGift"
  | "follow"
  | "cheer"
  | "raid"
  | "channelPointsRedemption";

export type OverlaySubscriptionTier = "tier1" | "tier2" | "tier3" | "prime";

export type OverlaySubscriptionAlert = {
  alertId: string;
  kind: "subscription";
  userDisplayName: string;
  tier: OverlaySubscriptionTier;
  isResubscription: boolean;
  cumulativeMonths: number | null;
  message: string | null;
  receivedAt: number;
};

export type OverlaySubscriptionGiftAlert = {
  alertId: string;
  kind: "subscriptionGift";
  gifterDisplayName: string | null;
  isAnonymous: boolean;
  tier: OverlaySubscriptionTier;
  giftCount: number;
  cumulativeTotal: number | null;
  receivedAt: number;
};

export type OverlayFollowAlert = {
  alertId: string;
  kind: "follow";
  userDisplayName: string;
  receivedAt: number;
};

export type OverlayCheerAlert = {
  alertId: string;
  kind: "cheer";
  userDisplayName: string | null;
  isAnonymous: boolean;
  bits: number;
  message: string;
  receivedAt: number;
};

export type OverlayRaidAlert = {
  alertId: string;
  kind: "raid";
  fromBroadcasterDisplayName: string;
  viewerCount: number;
  receivedAt: number;
};

export type OverlayChannelPointsRedemptionAlert = {
  alertId: string;
  kind: "channelPointsRedemption";
  userDisplayName: string;
  rewardId: string;
  rewardTitle: string;
  rewardCost: number;
  userInput: string;
  receivedAt: number;
};

export type OverlayAlertEvent =
  | OverlaySubscriptionAlert
  | OverlaySubscriptionGiftAlert
  | OverlayFollowAlert
  | OverlayCheerAlert
  | OverlayRaidAlert
  | OverlayChannelPointsRedemptionAlert;

// ============================================================================
// Stats overlay protocol
// ============================================================================

export type OverlayGoalKind =
  | "follower"
  | "subscription"
  | "subscriptionCount"
  | "newSubscription"
  | "newSubscriptionCount";

export type OverlayGoal = {
  goalId: string;
  kind: OverlayGoalKind;
  description: string;
  currentAmount: number;
  targetAmount: number;
};

export type OverlayStatsSnapshot = {
  goals: OverlayGoal[];
  latestSubscription: OverlaySubscriptionAlert | null;
  latestFollow: OverlayFollowAlert | null;
  latestCheer: OverlayCheerAlert | null;
  latestGift: OverlaySubscriptionGiftAlert | null;
  generatedAt: number;
};

export type ServerToClientMessage =
  | { kind: "chatMessage"; data: OverlayChatMessage }
  | { kind: "alertEvent"; data: OverlayAlertEvent }
  | { kind: "statsSnapshot"; data: OverlayStatsSnapshot }
  | { kind: "connectionReady" };
