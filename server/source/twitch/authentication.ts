import { persistRefreshedTokens } from "../configuration.js";

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

export class TwitchAuthenticationManager {
  private currentAccessToken: string;
  private currentRefreshToken: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

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
    this.currentAccessToken = parsed.access_token;
    this.currentRefreshToken = parsed.refresh_token;
    persistRefreshedTokens({
      accessToken: parsed.access_token,
      refreshToken: parsed.refresh_token,
    });
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
