import type {
  TwitchChannelGoalType,
} from "@twitch-overlay/types";
import type { TwitchAuthenticationManager } from "./authentication.js";

const helixBaseUrl = "https://api.twitch.tv/helix";

export type HelixCreatorGoal = {
  id: string;
  broadcaster_id: string;
  broadcaster_name: string;
  broadcaster_login: string;
  type: TwitchChannelGoalType;
  description: string;
  current_amount: number;
  target_amount: number;
  created_at: string;
};

export type HelixUser = {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
};

export type HelixChannelFollower = {
  user_id: string;
  user_login: string;
  user_name: string;
  followed_at: string;
};

export type HelixBadgeVersion = {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
  description: string;
  click_action: string | null;
  click_url: string | null;
};

export type HelixBadgeSet = {
  set_id: string;
  versions: HelixBadgeVersion[];
};

export type HelixListEnvelope<TItem> = {
  data: TItem[];
};

export type EventSubscriptionRequest = {
  type: string;
  version: string;
  condition: Record<string, string>;
  transport: {
    method: "websocket";
    session_id: string;
  };
};

export type EventSubscriptionResponse = {
  data: Array<{
    id: string;
    status: string;
    type: string;
    version: string;
    created_at: string;
    cost: number;
  }>;
};

export class HelixClient {
  constructor(private readonly authentication: TwitchAuthenticationManager) {}

  async getUsersByIds(userIds: string[]): Promise<HelixUser[]> {
    if (userIds.length === 0) {
      return [];
    }
    const searchParameters = new URLSearchParams();
    for (const userId of userIds) {
      searchParameters.append("id", userId);
    }
    return this.requestList<HelixUser>(`/users?${searchParameters.toString()}`);
  }

  async getGlobalChatBadges(): Promise<HelixBadgeSet[]> {
    return this.requestList<HelixBadgeSet>("/chat/badges/global");
  }

  async getChannelChatBadges(broadcasterUserId: string): Promise<HelixBadgeSet[]> {
    const searchParameters = new URLSearchParams({
      broadcaster_id: broadcasterUserId,
    });
    return this.requestList<HelixBadgeSet>(
      `/chat/badges?${searchParameters.toString()}`,
    );
  }

  async getCreatorGoals(broadcasterUserId: string): Promise<HelixCreatorGoal[]> {
    const searchParameters = new URLSearchParams({
      broadcaster_id: broadcasterUserId,
    });
    return this.requestList<HelixCreatorGoal>(
      `/goals?${searchParameters.toString()}`,
    );
  }

  /**
   * Most recent follower, or null if the channel has none. Helix returns
   * /channels/followers in descending order by followed_at, so first=1 is the
   * latest. Requires the moderator:read:followers scope; callers should treat
   * a thrown error as "scope missing, skip the backfill" rather than fatal.
   */
  async getLatestFollower(
    broadcasterUserId: string,
  ): Promise<HelixChannelFollower | null> {
    const searchParameters = new URLSearchParams({
      broadcaster_id: broadcasterUserId,
      first: "1",
    });
    const followers = await this.requestList<HelixChannelFollower>(
      `/channels/followers?${searchParameters.toString()}`,
    );
    return followers[0] ?? null;
  }

  async createEventSubscription(
    subscription: EventSubscriptionRequest,
  ): Promise<EventSubscriptionResponse> {
    return this.requestJson<EventSubscriptionResponse>({
      pathWithQuery: "/eventsub/subscriptions",
      method: "POST",
      body: JSON.stringify(subscription),
      contentTypeJson: true,
      errorContext: "create EventSub subscription",
    });
  }

  async sendChatMessage(
    broadcasterUserId: string, // user id of channel
    sendUserId: string, // bot user id
    message: string,
  ): Promise<EventSubscriptionResponse> {
    return this.requestJson<HelixListEnvelope<any>>({
      pathWithQuery: "/chat/messages",
      method: "POST",
      body: JSON.stringify({
        broadcaster_id: broadcasterUserId,
        sender_id: sendUserId,
        message,
      }),
      contentTypeJson: true,
      errorContext: "send chat message",
    });
  }

  private async requestList<TItem>(pathWithQuery: string): Promise<TItem[]> {
    const envelope = await this.requestJson<HelixListEnvelope<TItem>>({
      pathWithQuery,
      method: "GET",
      contentTypeJson: false,
      errorContext: `GET ${pathWithQuery}`,
    });
    return envelope.data;
  }

  /**
   * Wraps every Helix call so a 401 transparently refreshes the access token
   * and retries the request once. The proactive refresh scheduler in
   * TwitchAuthenticationManager should keep us ahead of expiry, but this is
   * the safety net for any race (skewed clocks, sleep/wake, etc.).
   */
  private async requestJson<TResponse>(options: {
    pathWithQuery: string;
    method: "GET" | "POST";
    body?: string;
    contentTypeJson: boolean;
    errorContext: string;
  }): Promise<TResponse> {
    const performRequest = async (): Promise<Response> =>
      fetch(`${helixBaseUrl}${options.pathWithQuery}`, {
        method: options.method,
        headers: this.buildAuthorizationHeaders({
          contentTypeJson: options.contentTypeJson,
        }),
        body: options.body,
      });

    let response = await performRequest();
    if (response.status === 401) {
      console.warn(
        `[helix] 401 on ${options.errorContext}, refreshing token and retrying once`,
      );
      try {
        await this.authentication.refreshAccessToken();
      } catch (refreshError) {
        const message =
          refreshError instanceof Error
            ? refreshError.message
            : String(refreshError);
        throw new Error(
          `Helix ${options.errorContext} failed (401) and refresh failed: ${message}`,
        );
      }
      response = await performRequest();
    }
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Helix ${options.errorContext} failed (${response.status}): ${errorBody}`,
      );
    }
    return (await response.json()) as TResponse;
  }

  private buildAuthorizationHeaders(options: { contentTypeJson: boolean }): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.authentication.getAccessToken()}`,
      "Client-Id": this.authentication.getClientId(),
    };
    if (options.contentTypeJson) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }
}
