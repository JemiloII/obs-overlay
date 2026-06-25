import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: resolve(import.meta.dirname, "..", "..", ".env") });

function required(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable "${key}".`);
  }
  return value;
}

export type ApplicationConfiguration = ReturnType<typeof loadConfiguration>;

export function loadConfiguration() {
  return {
    twitchClientId: required("TWITCH_CLIENT_ID"),
    twitchClientSecret: required("TWITCH_SECRET_ID"),
    twitchAccessToken: required("TWITCH_ACCESS_TOKEN"),
    twitchRefreshToken: required("TWITCH_REFRESH_TOKEN"),
    serverPort: Number(process.env.SERVER_PORT) || 8787,
    // Optional app-to-app TTS pipe (voisona-bot /speak). Both must be set to enable.
    voisonaSpeakUrl: process.env.VOISONA_SPEAK_URL?.trim() || null,
    voisonaApiKey: process.env.VOISONA_API_KEY?.trim() || null,
  };
}
