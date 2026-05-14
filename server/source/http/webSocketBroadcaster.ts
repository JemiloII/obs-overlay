import type { WSContext } from "hono/ws";
import type { ServerToClientMessage } from "@twitch-overlay/types";

export class WebSocketBroadcaster {
  private readonly connectedClients = new Set<WSContext>();

  registerClient(client: WSContext): void {
    this.connectedClients.add(client);
  }

  unregisterClient(client: WSContext): void {
    this.connectedClients.delete(client);
  }

  broadcast(message: ServerToClientMessage): void {
    const payload = JSON.stringify(message);
    for (const client of this.connectedClients) {
      try {
        client.send(payload);
      } catch (sendError) {
        console.error("[websocket] failed to send to client:", sendError);
      }
    }
  }

  getConnectedClientCount(): number {
    return this.connectedClients.size;
  }
}
