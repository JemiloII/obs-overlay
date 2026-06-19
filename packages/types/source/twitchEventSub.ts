export type TwitchEventSubSessionMessageType =
  | "session_welcome"
  | "session_keepalive"
  | "session_reconnect"
  | "notification"
  | "revocation";

export type TwitchEventSubMetadata = {
  message_id: string;
  message_type: TwitchEventSubSessionMessageType;
  message_timestamp: string;
  subscription_type?: string;
  subscription_version?: string;
};

export type TwitchEventSubSession = {
  id: string;
  status: "connected" | "reconnecting";
  connected_at: string;
  keepalive_timeout_seconds: number | null;
  reconnect_url: string | null;
};

export type TwitchEventSubWelcomePayload = {
  session: TwitchEventSubSession;
};

export type TwitchEventSubReconnectPayload = {
  session: TwitchEventSubSession;
};

export type TwitchEventSubMessageType =
  | "text"
  | "channel_points_highlighted"
  | "channel_points_sub_only"
  | "user_intro"
  | "power_ups_message_effect"
  | "power_ups_gigantified_emote";

export type TwitchEmoteFragmentFormat = "static" | "animated";

export type TwitchTextFragment = {
  type: "text";
  text: string;
  cheermote: null;
  emote: null;
  mention: null;
};

export type TwitchEmoteFragment = {
  type: "emote";
  text: string;
  cheermote: null;
  emote: {
    id: string;
    emote_set_id: string;
    owner_id: string;
    format: TwitchEmoteFragmentFormat[];
  };
  mention: null;
};

export type TwitchCheermoteFragment = {
  type: "cheermote";
  text: string;
  cheermote: {
    prefix: string;
    bits: number;
    tier: number;
  };
  emote: null;
  mention: null;
};

export type TwitchMentionFragment = {
  type: "mention";
  text: string;
  cheermote: null;
  emote: null;
  mention: {
    user_id: string;
    user_login: string;
    user_name: string;
  };
};

export type TwitchMessageFragment =
  | TwitchTextFragment
  | TwitchEmoteFragment
  | TwitchCheermoteFragment
  | TwitchMentionFragment;

export type TwitchBadge = {
  set_id: string;
  id: string;
  info: string;
};

export type TwitchReply = {
  parent_message_id: string;
  parent_message_body: string;
  parent_user_id: string;
  parent_user_name: string;
  parent_user_login: string;
  thread_message_id: string;
  thread_user_id: string;
  thread_user_name: string;
  thread_user_login: string;
};

export type TwitchCheer = {
  bits: number;
};

export type TwitchChannelChatMessageEvent = {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  chatter_user_id: string;
  chatter_user_login: string;
  chatter_user_name: string;
  message_id: string;
  message: {
    text: string;
    fragments: TwitchMessageFragment[];
  };
  color: string;
  badges: TwitchBadge[];
  message_type: TwitchEventSubMessageType;
  cheer: TwitchCheer | null;
  reply: TwitchReply | null;
  channel_points_custom_reward_id: string | null;
  // Undocumented but live in production: identifies the Power-Up animation
  // (e.g. "cosmic-abyss", "rainbow-eclipse", "simmer"). Present on
  // power_ups_message_effect and power_ups_gigantified_emote messages.
  channel_points_animation_id: string | null;
  source_broadcaster_user_id: string | null;
  source_broadcaster_user_login: string | null;
  source_broadcaster_user_name: string | null;
  source_message_id: string | null;
  source_badges: TwitchBadge[] | null;
  is_source_only: boolean | null;
};

export type TwitchBitsUseType = "cheer" | "power_up";

export type TwitchPowerUpMessageEffectType =
  | "cosmic-abyss"
  | "rainbow-eclipse"
  | "simmer"
  | (string & {});

export type TwitchBitsUsePowerUp = {
  type:
    | "message_effect"
    | "celebration"
    | "gigantify_an_emote"
    | (string & {});
  message_effect_id?: TwitchPowerUpMessageEffectType | null;
  emote?: {
    id: string;
    name: string;
  } | null;
};

export type TwitchChannelBitsUseEvent = {
  user_id: string;
  user_login: string;
  user_name: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  bits: number;
  type: TwitchBitsUseType;
  power_up: TwitchBitsUsePowerUp | null;
  custom_power_up: unknown | null;
  message: {
    text: string;
    fragments: TwitchMessageFragment[];
  } | null;
};

// ============================================================================
// Alert-related EventSub events
// ============================================================================

export type TwitchSubscriptionTier = "1000" | "2000" | "3000" | "Prime";

export type TwitchChannelSubscribeEvent = {
  user_id: string;
  user_login: string;
  user_name: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  tier: TwitchSubscriptionTier;
  is_gift: boolean;
};

export type TwitchChannelSubscriptionMessageEvent = {
  user_id: string;
  user_login: string;
  user_name: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  tier: TwitchSubscriptionTier;
  message: {
    text: string;
    emotes: Array<{
      begin: number;
      end: number;
      id: string;
    }> | null;
  };
  cumulative_months: number;
  streak_months: number | null;
  duration_months: number;
};

export type TwitchChannelSubscriptionGiftEvent = {
  user_id: string | null;
  user_login: string | null;
  user_name: string | null;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  total: number;
  tier: TwitchSubscriptionTier;
  cumulative_total: number | null;
  is_anonymous: boolean;
};

export type TwitchChannelFollowEvent = {
  user_id: string;
  user_login: string;
  user_name: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  followed_at: string;
};

export type TwitchChannelCheerEvent = {
  is_anonymous: boolean;
  user_id: string | null;
  user_login: string | null;
  user_name: string | null;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  message: string;
  bits: number;
};

export type TwitchChannelRaidEvent = {
  from_broadcaster_user_id: string;
  from_broadcaster_user_login: string;
  from_broadcaster_user_name: string;
  to_broadcaster_user_id: string;
  to_broadcaster_user_login: string;
  to_broadcaster_user_name: string;
  viewers: number;
};

export type TwitchChannelGoalType =
  | "follower"
  | "subscription"
  | "subscription_count"
  | "new_subscription"
  | "new_subscription_count";

export type TwitchChannelGoalEvent = {
  id: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  type: TwitchChannelGoalType;
  description: string;
  is_achieved?: boolean;
  current_amount: number;
  target_amount: number;
  started_at: string;
  ended_at?: string | null;
};

export type TwitchChannelPointsRedemptionEvent = {
  id: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  user_id: string;
  user_login: string;
  user_name: string;
  user_input: string;
  status: "unfulfilled" | "fulfilled" | "canceled" | "unknown";
  reward: {
    id: string;
    title: string;
    cost: number;
    prompt: string;
  };
  redeemed_at: string;
};

export type TwitchEventSubSubscriptionDescriptor = {
  id: string;
  status: string;
  type: string;
  version: string;
  cost: number;
  condition: Record<string, string>;
  transport: {
    method: "websocket";
    session_id: string;
  };
  created_at: string;
};

export type TwitchEventSubNotificationPayload<TEvent> = {
  subscription: TwitchEventSubSubscriptionDescriptor;
  event: TEvent;
};

export type TwitchEvent =
  | TwitchChannelChatMessageEvent
  | TwitchChannelBitsUseEvent
  | TwitchChannelSubscribeEvent
  | TwitchChannelSubscriptionMessageEvent
  | TwitchChannelSubscriptionGiftEvent
  | TwitchChannelFollowEvent
  | TwitchChannelCheerEvent
  | TwitchChannelRaidEvent
  | TwitchChannelPointsRedemptionEvent
  | TwitchChannelGoalEvent;

export type TwitchEventSubEnvelope =
  | {
      metadata: TwitchEventSubMetadata & { message_type: "session_welcome" };
      payload: TwitchEventSubWelcomePayload;
    }
  | {
      metadata: TwitchEventSubMetadata & { message_type: "session_keepalive" };
      payload: Record<string, never>;
    }
  | {
      metadata: TwitchEventSubMetadata & { message_type: "session_reconnect" };
      payload: TwitchEventSubReconnectPayload;
    }
  | {
      metadata: TwitchEventSubMetadata & { message_type: "notification" };
      payload: TwitchEventSubNotificationPayload<TwitchEvent>;
    }
  | {
      metadata: TwitchEventSubMetadata & { message_type: "revocation" };
      payload: { subscription: TwitchEventSubSubscriptionDescriptor };
    };
