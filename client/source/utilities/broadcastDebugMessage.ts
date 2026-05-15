import type { ServerToClientMessage } from "@twitch-overlay/types";

const defaultServerHttpUrl = "http://localhost:8787";

function getServerHttpUrl(): string {
  const directOverride = import.meta.env.VITE_SERVER_HTTP_URL;
  if (typeof directOverride === "string" && directOverride.length > 0) {
    return directOverride;
  }
  const webSocketUrl = import.meta.env.VITE_SERVER_WEBSOCKET_URL;
  if (typeof webSocketUrl === "string" && webSocketUrl.length > 0) {
    // Derive HTTP origin from the WS URL the client already uses.
    try {
      const parsed = new URL(webSocketUrl);
      const httpProtocol = parsed.protocol === "wss:" ? "https:" : "http:";
      return `${httpProtocol}//${parsed.host}`;
    } catch {
      // Fall through to default.
    }
  }
  return defaultServerHttpUrl;
}

/**
 * POSTs a ServerToClientMessage to the server's /debug/broadcast endpoint.
 * The server then fans it out over the WebSocket to every connected client
 * (OBS browser source + any open dev tabs), so a single click in the debug
 * panel triggers the alert in every consumer simultaneously.
 */
export async function broadcastDebugMessage(
  message: ServerToClientMessage,
): Promise<void> {
  const endpoint = `${getServerHttpUrl()}/debug/broadcast`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!response.ok) {
      console.error(
        `[debug] broadcast failed (${response.status}): ${await response.text()}`,
      );
    }
  } catch (networkError) {
    console.error("[debug] broadcast network error:", networkError);
  }
}
