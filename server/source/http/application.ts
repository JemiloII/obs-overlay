import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import type { ServerToClientMessage } from "@twitch-overlay/types";
import type { StatsStore } from "../stats/statsStore.ts";
import type { WebSocketBroadcaster } from "./webSocketBroadcaster.ts";

export type ApplicationDependencies = {
  webSocketBroadcaster: WebSocketBroadcaster;
  statsStore: StatsStore;
};

function isKnownServerToClientMessage(
  candidate: unknown,
): candidate is ServerToClientMessage {
  if (typeof candidate !== "object" || candidate === null) {
    return false;
  }
  const kind = (candidate as { kind?: unknown }).kind;
  return (
    kind === "chatMessage" ||
    kind === "alertEvent" ||
    kind === "statsSnapshot" ||
    kind === "connectionReady"
  );
}

export function createApplication(dependencies: ApplicationDependencies) {
  const application = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
    app: application,
  });

  // Permissive CORS for localhost dev. The /debug endpoint is the only thing
  // accepting cross-origin writes; everything else is GET/health or WS upgrade.
  application.use("*", async (context, next) => {
    context.header("Access-Control-Allow-Origin", "*");
    context.header(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS",
    );
    context.header(
      "Access-Control-Allow-Headers",
      "Content-Type",
    );
    if (context.req.method === "OPTIONS") {
      return context.body(null, 204);
    }
    await next();
  });

  application.get("/health", (context) =>
    context.json({
      status: "ok",
      connectedOverlayClients:
        dependencies.webSocketBroadcaster.getConnectedClientCount(),
    }),
  );

  // Dev-only: lets the debug panel fan a sample message out to every
  // connected overlay (OBS + dev tabs) instead of only the originating tab.
  application.post("/debug/broadcast", async (context) => {
    let payload: unknown;
    try {
      payload = await context.req.json();
    } catch (parseError) {
      return context.json(
        { error: "Invalid JSON body", detail: String(parseError) },
        400,
      );
    }
    if (!isKnownServerToClientMessage(payload)) {
      return context.json(
        {
          error:
            "Body must be a ServerToClientMessage with kind 'chatMessage' or 'alertEvent'",
        },
        400,
      );
    }
    dependencies.webSocketBroadcaster.broadcast(payload);
    return context.json({
      broadcasted: true,
      kind: payload.kind,
      receiverCount: dependencies.webSocketBroadcaster.getConnectedClientCount(),
    });
  });

  application.get(
    "/ws",
    upgradeWebSocket(() => ({
      onOpen(_event, ws) {
        dependencies.webSocketBroadcaster.registerClient(ws);
        ws.send(JSON.stringify({ kind: "connectionReady" }));
        // Send the current stats snapshot so newly-connected clients
        // (a fresh OBS browser source, a reconnect) have full state
        // without waiting for the next event.
        ws.send(
          JSON.stringify({
            kind: "statsSnapshot",
            data: dependencies.statsStore.buildSnapshot(),
          }),
        );
      },
      onClose(_event, ws) {
        dependencies.webSocketBroadcaster.unregisterClient(ws);
      },
      onError(_event, ws) {
        dependencies.webSocketBroadcaster.unregisterClient(ws);
      },
    })),
  );

  return { application, injectWebSocket };
}
