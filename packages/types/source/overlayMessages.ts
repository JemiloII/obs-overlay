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

export type ServerToClientMessage =
  | { kind: "chatMessage"; data: OverlayChatMessage }
  | { kind: "connectionReady" };
