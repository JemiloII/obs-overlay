import type { TwitchAuthenticationManager } from "./authentication.js";

const helixBaseUrl = "https://api.twitch.tv/helix";

export type HelixUser = {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
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

  async createEventSubscription(
    subscription: EventSubscriptionRequest,
  ): Promise<EventSubscriptionResponse> {
    const response = await fetch(`${helixBaseUrl}/eventsub/subscriptions`, {
      method: "POST",
      headers: this.buildAuthorizationHeaders({ contentTypeJson: true }),
      body: JSON.stringify(subscription),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to create EventSub subscription (${response.status}): ${errorBody}`,
      );
    }
    return (await response.json()) as EventSubscriptionResponse;
  }

  private async requestList<TItem>(pathWithQuery: string): Promise<TItem[]> {
    const response = await fetch(`${helixBaseUrl}${pathWithQuery}`, {
      headers: this.buildAuthorizationHeaders({ contentTypeJson: false }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Helix GET ${pathWithQuery} failed (${response.status}): ${errorBody}`,
      );
    }
    const envelope = (await response.json()) as HelixListEnvelope<TItem>;
    return envelope.data;
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
