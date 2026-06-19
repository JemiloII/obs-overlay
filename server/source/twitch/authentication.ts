const twitchOauthValidateUrl = "https://id.twitch.tv/oauth2/validate";
const twitchOauthTokenUrl = "https://id.twitch.tv/oauth2/token";

export type ValidatedTokenInformation = {
  loginName: string;
  userId: string;
  scopes: string[];
  expiresInSeconds: number;
  clientId: string;
};

export type TwitchAuthenticationCredentials = {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
};

type ValidateResponseBody = {
  client_id: string;
  login: string;
  scopes: string[];
  user_id: string;
  expires_in: number;
};

type RefreshResponseBody = {
  access_token: string;
  refresh_token: string;
  scope?: string[];
  expires_in: number;
  token_type: string;
};

// Refresh the access token this many seconds BEFORE it actually expires, so
// in-flight API calls never see a 401 from clock skew or queue delay.
const refreshSafetyMarginSeconds = 600;
// Floor for the next refresh delay — if expires_in is suspiciously short we
// still wait at least this long before retrying.
const minimumRefreshDelaySeconds = 60;
// Backoff used when an unattended proactive refresh fails (network blip,
// transient 5xx) — try again after this delay.
const refreshFailureRetryDelaySeconds = 300;

export class TwitchAuthenticationManager {
  private currentAccessToken: string;
  private currentRefreshToken: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  // Single-flight: if a refresh is in flight, other callers await this promise
  // instead of triggering a parallel refresh that would invalidate the first.
  private inflightRefreshPromise: Promise<void> | null = null;

  constructor(credentials: TwitchAuthenticationCredentials) {
    this.clientId = credentials.clientId;
    this.clientSecret = credentials.clientSecret;
    this.currentAccessToken = credentials.accessToken;
    this.currentRefreshToken = credentials.refreshToken;
  }

  getAccessToken(): string {
    return this.currentAccessToken;
  }

  getClientId(): string {
    return this.clientId;
  }

  async validateOrRefresh(): Promise<ValidatedTokenInformation> {
    const firstAttempt = await this.attemptValidate();
    if (firstAttempt) {
      return firstAttempt;
    }
    await this.refreshAccessToken();
    const secondAttempt = await this.attemptValidate();
    if (!secondAttempt) {
      throw new Error(
        "Access token validation failed even after refresh. " +
          "Check TWITCH_CLIENT_ID, TWITCH_SECRET_ID, and TWITCH_REFRESH_TOKEN.",
      );
    }
    return secondAttempt;
  }

  async refreshAccessToken(): Promise<void> {
    if (this.inflightRefreshPromise !== null) {
      return this.inflightRefreshPromise;
    }
    this.inflightRefreshPromise = this.performRefresh().finally(() => {
      this.inflightRefreshPromise = null;
    });
    return this.inflightRefreshPromise;
  }

  /**
   * Schedule a refresh slightly before the current access token expires so
   * the next chatter, badge fetch, or Helix call never sees a 401. The
   * scheduler re-arms itself with the new expires_in after each refresh.
   *
   * Call once at boot with the value returned from validateOrRefresh().
   */
  startProactiveRefresh(currentExpiresInSeconds: number): void {
    this.armRefreshTimer(currentExpiresInSeconds);
  }

  stopProactiveRefresh(): void {
    if (this.proactiveRefreshTimer !== null) {
      clearTimeout(this.proactiveRefreshTimer);
      this.proactiveRefreshTimer = null;
    }
  }

  private armRefreshTimer(secondsUntilExpiry: number): void {
    if (this.proactiveRefreshTimer !== null) {
      clearTimeout(this.proactiveRefreshTimer);
    }
    const refreshDelaySeconds = Math.max(
      minimumRefreshDelaySeconds,
      secondsUntilExpiry - refreshSafetyMarginSeconds,
    );
    console.log(
      `[auth] proactive token refresh scheduled in ${Math.round(refreshDelaySeconds / 60)} minutes`,
    );
    this.proactiveRefreshTimer = setTimeout(() => {
      void this.runProactiveRefresh();
    }, refreshDelaySeconds * 1000);
    // Don't let the timer hold the event loop open during shutdown.
    if (typeof this.proactiveRefreshTimer === "object" && this.proactiveRefreshTimer !== null) {
      (this.proactiveRefreshTimer as { unref?: () => void }).unref?.();
    }
  }

  private async runProactiveRefresh(): Promise<void> {
    try {
      console.log("[auth] performing proactive token refresh");
      await this.refreshAccessToken();
      const validated = await this.attemptValidate();
      if (!validated) {
        console.warn(
          "[auth] refresh completed but new token failed validate; retrying soon",
        );
        this.armRefreshTimer(refreshFailureRetryDelaySeconds);
        return;
      }
      console.log(
        `[auth] token refreshed, valid for ~${Math.round(validated.expiresInSeconds / 60)} minutes`,
      );
      this.armRefreshTimer(validated.expiresInSeconds);
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : String(refreshError);
      console.error(`[auth] proactive refresh failed: ${message}`);
      this.armRefreshTimer(refreshFailureRetryDelaySeconds);
    }
  }

  private async performRefresh(): Promise<void> {
    const requestBody = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.currentRefreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    const response = await fetch(twitchOauthTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: requestBody.toString(),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Token refresh failed (${response.status}): ${errorBody}`,
      );
    }
    const parsed = (await response.json()) as RefreshResponseBody;
    // Keep refreshed tokens in memory only. Writing them back to .env trips
    // the dev file-watcher (Vite/tsx) and restarts the server mid-session,
    // dropping overlay connections. The refresh token is stable, so on any
    // restart the boot-time validateOrRefresh re-derives a fresh access token.
    this.currentAccessToken = parsed.access_token;
    this.currentRefreshToken = parsed.refresh_token;
  }

  private async attemptValidate(): Promise<ValidatedTokenInformation | null> {
    const response = await fetch(twitchOauthValidateUrl, {
      headers: { Authorization: `OAuth ${this.currentAccessToken}` },
    });
    if (response.status === 401) {
      return null;
    }
    if (!response.ok) {
      throw new Error(
        `Unexpected response from token validate endpoint: ${response.status}`,
      );
    }
    const parsed = (await response.json()) as ValidateResponseBody;
    return {
      loginName: parsed.login,
      userId: parsed.user_id,
      scopes: parsed.scopes,
      expiresInSeconds: parsed.expires_in,
      clientId: parsed.client_id,
    };
  }
}

export function ensureRequiredScopes(
  scopes: string[] | null | undefined,
  requiredScopes: string[],
): void {
  const grantedScopes = Array.isArray(scopes) ? scopes : [];
  const missing = requiredScopes.filter((scope) => !grantedScopes.includes(scope));
  if (missing.length > 0) {
    throw new Error(
      `Twitch access token is missing required scopes: ${missing.join(", ")}. ` +
        "Re-authorize via https://id.twitch.tv/oauth2/authorize to include them.",
    );
  }
}
