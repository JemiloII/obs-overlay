import type { HelixClient } from "../twitch/helixClient.js";

export type BadgeImageUrls = {
  setId: string;
  badgeId: string;
  imageUrlSmall: string;
  imageUrlMedium: string;
  imageUrlLarge: string;
  title: string;
};

function buildBadgeKey(setId: string, badgeId: string): string {
  return `${setId}:${badgeId}`;
}

export class BadgeCache {
  private readonly badgesByKey = new Map<string, BadgeImageUrls>();
  private initialized = false;

  constructor(private readonly helixClient: HelixClient) {}

  async initialize(broadcasterUserId: string): Promise<void> {
    const [globalBadges, channelBadges] = await Promise.all([
      this.helixClient.getGlobalChatBadges(),
      this.helixClient.getChannelChatBadges(broadcasterUserId),
    ]);
    for (const badgeSet of globalBadges) {
      this.indexBadgeSet(badgeSet);
    }
    // Channel-specific badges override global ones (e.g., custom subscriber badges).
    for (const badgeSet of channelBadges) {
      this.indexBadgeSet(badgeSet);
    }
    this.initialized = true;
  }

  resolve(setId: string, badgeId: string): BadgeImageUrls | null {
    if (!this.initialized) {
      return null;
    }
    return this.badgesByKey.get(buildBadgeKey(setId, badgeId)) ?? null;
  }

  private indexBadgeSet(badgeSet: { set_id: string; versions: Array<{ id: string; image_url_1x: string; image_url_2x: string; image_url_4x: string; title: string }> }): void {
    for (const version of badgeSet.versions) {
      const entry: BadgeImageUrls = {
        setId: badgeSet.set_id,
        badgeId: version.id,
        imageUrlSmall: version.image_url_1x,
        imageUrlMedium: version.image_url_2x,
        imageUrlLarge: version.image_url_4x,
        title: version.title,
      };
      this.badgesByKey.set(buildBadgeKey(badgeSet.set_id, version.id), entry);
    }
  }
}
