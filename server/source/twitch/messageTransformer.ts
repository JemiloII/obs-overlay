import type {
  OverlayBadge,
  OverlayChatMessage,
  OverlayMessageFragment,
  OverlayMessageType,
} from "@twitch-overlay/types";
import type {
  TwitchChannelChatMessageEvent,
  TwitchEventSubMessageType,
  TwitchMessageFragment,
} from "@twitch-overlay/types";
import type { BadgeCache } from "../caches/badgeCache.js";
import type { UserProfileCache } from "../caches/userProfileCache.js";

const twitchEmoteCdnBaseUrl = "https://static-cdn.jtvnw.net/emoticons/v2";

function selectEmoteAnimatedSegment(formats: Array<"static" | "animated">): "static" | "animated" {
  return formats.includes("animated") ? "animated" : "static";
}

function buildEmoteImageUrl(
  emoteId: string,
  formatSegment: "static" | "animated",
  size: "1.0" | "2.0" | "3.0",
): string {
  return `${twitchEmoteCdnBaseUrl}/${emoteId}/${formatSegment}/dark/${size}`;
}

function translateMessageType(
  twitchMessageType: TwitchEventSubMessageType,
): OverlayMessageType {
  switch (twitchMessageType) {
    case "text":
      return "text";
    case "channel_points_highlighted":
      return "channelPointsHighlighted";
    case "channel_points_sub_only":
      return "channelPointsSubOnly";
    case "user_intro":
      return "userIntroduction";
    case "power_ups_message_effect":
      return "powerUpsMessageEffect";
    case "power_ups_gigantified_emote":
      return "powerUpsGigantifiedEmote";
  }
}

function translateFragment(fragment: TwitchMessageFragment): OverlayMessageFragment {
  switch (fragment.type) {
    case "text":
      return { type: "text", text: fragment.text };
    case "emote": {
      const formatSegment = selectEmoteAnimatedSegment(fragment.emote.format);
      return {
        type: "emote",
        text: fragment.text,
        emoteId: fragment.emote.id,
        imageUrlSmall: buildEmoteImageUrl(fragment.emote.id, formatSegment, "1.0"),
        imageUrlMedium: buildEmoteImageUrl(fragment.emote.id, formatSegment, "2.0"),
        imageUrlLarge: buildEmoteImageUrl(fragment.emote.id, formatSegment, "3.0"),
        animated: formatSegment === "animated",
      };
    }
    case "cheermote":
      return {
        type: "cheermote",
        text: fragment.text,
        prefix: fragment.cheermote.prefix,
        bits: fragment.cheermote.bits,
        tier: fragment.cheermote.tier,
      };
    case "mention":
      return {
        type: "mention",
        text: fragment.text,
        userId: fragment.mention.user_id,
        loginName: fragment.mention.user_login,
        displayName: fragment.mention.user_name,
      };
  }
}

export class MessageTransformer {
  constructor(
    private readonly userProfileCache: UserProfileCache,
    private readonly badgeCache: BadgeCache,
  ) {}

  async transform(event: TwitchChannelChatMessageEvent): Promise<OverlayChatMessage> {
    const chatterProfile = await this.userProfileCache.getUserProfile(event.chatter_user_id);
    const badges: OverlayBadge[] = [];
    for (const badge of event.badges) {
      const resolved = this.badgeCache.resolve(badge.set_id, badge.id);
      if (resolved) {
        badges.push({
          setId: resolved.setId,
          badgeId: resolved.badgeId,
          imageUrlSmall: resolved.imageUrlSmall,
          imageUrlMedium: resolved.imageUrlMedium,
          imageUrlLarge: resolved.imageUrlLarge,
          title: resolved.title,
        });
      }
    }
    return {
      messageId: event.message_id,
      platform: "twitch",
      chatter: {
        userId: event.chatter_user_id,
        loginName: event.chatter_user_login,
        displayName: event.chatter_user_name,
        color: event.color,
        profileImageUrl: chatterProfile.profileImageUrl,
      },
      badges,
      fragments: event.message.fragments.map(translateFragment),
      messageType: translateMessageType(event.message_type),
      messageEffectId: event.channel_points_animation_id ?? null,
      reply: event.reply
        ? {
            parentMessageId: event.reply.parent_message_id,
            parentMessageBody: event.reply.parent_message_body,
            parentUserDisplayName: event.reply.parent_user_name,
          }
        : null,
      receivedAt: Date.now(),
    };
  }
}
