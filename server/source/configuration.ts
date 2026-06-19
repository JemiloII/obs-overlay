import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

const repositoryRoot = resolve(import.meta.dirname, "..", "..");
const environmentFilePath = resolve(repositoryRoot, ".env");

loadDotenv({ path: environmentFilePath });

type RequiredEnvironmentKey =
  | "TWITCH_CLIENT_ID"
  | "TWITCH_SECRET_ID"
  | "TWITCH_ACCESS_TOKEN"
  | "TWITCH_REFRESH_TOKEN";

function readRequiredEnvironmentValue(key: RequiredEnvironmentKey): string {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable "${key}". Add it to ${environmentFilePath}.`,
    );
  }
  return value.trim();
}

export type ApplicationConfiguration = {
  twitchClientId: string;
  twitchClientSecret: string;
  twitchAccessToken: string;
  twitchRefreshToken: string;
  serverPort: number;
};

export function loadConfiguration(): ApplicationConfiguration {
  const portValue = process.env.SERVER_PORT?.trim();
  const parsedPort = portValue ? Number.parseInt(portValue, 10) : 8787;
  if (!Number.isFinite(parsedPort) || parsedPort <= 0) {
    throw new Error(`Invalid SERVER_PORT "${portValue}".`);
  }
  return {
    twitchClientId: readRequiredEnvironmentValue("TWITCH_CLIENT_ID"),
    twitchClientSecret: readRequiredEnvironmentValue("TWITCH_SECRET_ID"),
    twitchAccessToken: readRequiredEnvironmentValue("TWITCH_ACCESS_TOKEN"),
    twitchRefreshToken: readRequiredEnvironmentValue("TWITCH_REFRESH_TOKEN"),
    serverPort: parsedPort,
  };
}
