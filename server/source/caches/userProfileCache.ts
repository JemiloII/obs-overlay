import type { HelixClient } from "../twitch/helixClient.js";

type CachedUserProfile = {
  userId: string;
  loginName: string;
  displayName: string;
  profileImageUrl: string;
  expiresAt: number;
};

const fiveMinutesInMilliseconds = 5 * 60 * 1000;

export class UserProfileCache {
  private readonly profilesByUserId = new Map<string, CachedUserProfile>();

  constructor(
    private readonly helixClient: HelixClient,
    private readonly entryLifetimeMilliseconds: number = fiveMinutesInMilliseconds,
  ) {}

  async getUserProfile(userId: string): Promise<CachedUserProfile> {
    const existing = this.profilesByUserId.get(userId);
    const now = Date.now();
    if (existing && existing.expiresAt > now) {
      return existing;
    }
    const fetched = await this.helixClient.getUsersByIds([userId]);
    const firstUser = fetched[0];
    if (!firstUser) {
      throw new Error(`No Twitch user found for id "${userId}".`);
    }
    const cached: CachedUserProfile = {
      userId: firstUser.id,
      loginName: firstUser.login,
      displayName: firstUser.display_name,
      profileImageUrl: firstUser.profile_image_url,
      expiresAt: now + this.entryLifetimeMilliseconds,
    };
    this.profilesByUserId.set(userId, cached);
    return cached;
  }
}
