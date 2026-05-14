import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import type { WebSocketBroadcaster } from "./webSocketBroadcaster.js";

export type ApplicationDependencies = {
  webSocketBroadcaster: WebSocketBroadcaster;
};

export function createApplication(dependencies: ApplicationDependencies) {
  const application = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
    app: application,
  });

  application.get("/health", (context) =>
    context.json({
      status: "ok",
      connectedOverlayClients:
        dependencies.webSocketBroadcaster.getConnectedClientCount(),
    }),
  );

  application.get(
    "/ws",
    upgradeWebSocket(() => ({
      onOpen(_event, ws) {
        dependencies.webSocketBroadcaster.registerClient(ws);
        ws.send(JSON.stringify({ kind: "connectionReady" }));
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
