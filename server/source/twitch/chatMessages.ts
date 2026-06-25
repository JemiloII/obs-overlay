import { getRawData } from "@twurple/common";
import type { ApiClient, HelixChatBadgeSet } from "@twurple/api";
import type { EventSubChannelChatMessageEvent } from "@twurple/eventsub-base";
import type {
  OverlayBadge,
  OverlayChatMessage,
  OverlayMessageFragment,
  OverlayMessageType,
} from "@twitch-overlay/types";

const emoteCdn = "https://static-cdn.jtvnw.net/emoticons/v2";
const profileTtlMs = 5 * 60 * 1000;

type MessagePart = EventSubChannelChatMessageEvent["messageParts"][number];

function messageType(type: string): OverlayMessageType {
  switch (type) {
    case "channel_points_highlighted": return "channelPointsHighlighted";
    case "channel_points_sub_only": return "channelPointsSubOnly";
    case "user_intro": return "userIntroduction";
    case "power_ups_message_effect": return "powerUpsMessageEffect";
    case "power_ups_gigantified_emote": return "powerUpsGigantifiedEmote";
    default: return "text";
  }
}

function fragment(part: MessagePart): OverlayMessageFragment {
  switch (part.type) {
    case "text":
      return { type: "text", text: part.text };
    case "emote": {
      const animated = part.emote.format.includes("animated");
      const segment = animated ? "animated" : "static";
      const url = (size: string) => `${emoteCdn}/${part.emote.id}/${segment}/dark/${size}`;
      return {
        type: "emote",
        text: part.text,
        emoteId: part.emote.id,
        imageUrlSmall: url("1.0"),
        imageUrlMedium: url("2.0"),
        imageUrlLarge: url("3.0"),
        animated,
      };
    }
    case "cheermote":
      return {
        type: "cheermote",
        text: part.text,
        prefix: part.cheermote.prefix,
        bits: part.cheermote.bits,
        tier: part.cheermote.tier,
      };
    case "mention":
      return {
        type: "mention",
        text: part.text,
        userId: part.mention.user_id,
        loginName: part.mention.user_login,
        displayName: part.mention.user_name,
      };
  }
}

/**
 * Turns a Twurple chat-message event into the overlay wire format, enriching
 * each message with badge images (indexed once at boot) and the chatter's
 * profile picture (short-lived cache so we don't hit Helix per line).
 * ponytail: two Maps, no cache framework.
 */
export class ChatMessageBuilder {
  private readonly badges = new Map<string, OverlayBadge>();
  private readonly profileImageUrls = new Map<string, { url: string; expiresAt: number }>();

  constructor(private readonly api: ApiClient) {}

  async loadBadges(broadcasterId: string): Promise<void> {
    const [global, channel] = await Promise.all([
      this.api.chat.getGlobalBadges(),
      this.api.chat.getChannelBadges(broadcasterId),
    ]);
    // Channel badges override global (custom sub badges, etc.).
    for (const set of [...global, ...channel]) {
      this.indexBadgeSet(set);
    }
  }

  private indexBadgeSet(set: HelixChatBadgeSet): void {
    for (const version of set.versions) {
      this.badges.set(`${set.id}:${version.id}`, {
        setId: set.id,
        badgeId: version.id,
        imageUrlSmall: version.getImageUrl(1),
        imageUrlMedium: version.getImageUrl(2),
        imageUrlLarge: version.getImageUrl(4),
        title: version.title,
      });
    }
  }

  private async profileImageUrl(userId: string): Promise<string> {
    const cached = this.profileImageUrls.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }
    const user = await this.api.users.getUserById(userId);
    const url = user?.profilePictureUrl ?? "";
    this.profileImageUrls.set(userId, { url, expiresAt: Date.now() + profileTtlMs });
    return url;
  }

  async build(event: EventSubChannelChatMessageEvent): Promise<OverlayChatMessage> {
    // channel_points_animation_id is live in production but Twurple doesn't type
    // it; read it off the raw payload to keep Power-Up effects working.
    const raw = getRawData(event) as { channel_points_animation_id?: string | null };
    const badges: OverlayBadge[] = [];
    for (const [setId, version] of Object.entries(event.badges)) {
      const badge = this.badges.get(`${setId}:${version}`);
      if (badge) {
        badges.push(badge);
      }
    }
    return {
      messageId: event.messageId,
      platform: "twitch",
      chatter: {
        userId: event.chatterId,
        loginName: event.chatterName,
        displayName: event.chatterDisplayName,
        color: event.color ?? "",
        profileImageUrl: await this.profileImageUrl(event.chatterId),
      },
      badges,
      fragments: event.messageParts.map(fragment),
      messageType: messageType(event.messageType),
      messageEffectId: raw.channel_points_animation_id ?? null,
      reply: event.parentMessageId
        ? {
            parentMessageId: event.parentMessageId,
            parentMessageBody: event.parentMessageText ?? "",
            parentUserDisplayName: event.parentMessageUserDisplayName ?? "",
          }
        : null,
      receivedAt: Date.now(),
    };
  }
}
