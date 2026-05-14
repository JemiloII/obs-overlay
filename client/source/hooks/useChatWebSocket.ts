import { useEffect } from "react";
import type { ServerToClientMessage } from "@twitch-overlay/types";
import { useChatStore } from "../stores/chatStore.js";
import { useConnectionStore } from "../stores/connectionStore.js";

const initialReconnectDelayMilliseconds = 1_000;
const maximumReconnectDelayMilliseconds = 30_000;
const defaultServerWebSocketUrl = "ws://localhost:8787/ws";

function buildWebSocketUrl(): string {
  const overrideUrl = import.meta.env.VITE_SERVER_WEBSOCKET_URL;
  if (typeof overrideUrl === "string" && overrideUrl.length > 0) {
    return overrideUrl;
  }
  return defaultServerWebSocketUrl;
}

export function useChatWebSocket(): void {
  const appendMessage = useChatStore((state) => state.appendMessage);
  const setStatus = useConnectionStore((state) => state.setStatus);

  useEffect(() => {
    let currentSocket: WebSocket | null = null;
    let reconnectAttempts = 0;
    let pendingReconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;

    function connect(): void {
      if (isUnmounted) {
        return;
      }
      setStatus("connecting");
      const socket = new WebSocket(buildWebSocketUrl());
      currentSocket = socket;
      socket.addEventListener("open", () => {
        reconnectAttempts = 0;
        setStatus("connected");
      });
      socket.addEventListener("message", (messageEvent) => {
        try {
          const parsed = JSON.parse(messageEvent.data) as ServerToClientMessage;
          if (parsed.kind === "chatMessage") {
            appendMessage(parsed.data);
          }
        } catch (parseError) {
          console.error("Failed to parse chat message", parseError);
        }
      });
      socket.addEventListener("close", () => {
        currentSocket = null;
        setStatus("disconnected");
        scheduleReconnect();
      });
      socket.addEventListener("error", () => {
        socket.close();
      });
    }

    function scheduleReconnect(): void {
      if (isUnmounted) {
        return;
      }
      reconnectAttempts += 1;
      const delayMilliseconds = Math.min(
        maximumReconnectDelayMilliseconds,
        initialReconnectDelayMilliseconds * 2 ** (reconnectAttempts - 1),
      );
      pendingReconnectTimeoutId = setTimeout(connect, delayMilliseconds);
    }

    connect();

    return () => {
      isUnmounted = true;
      if (pendingReconnectTimeoutId !== null) {
        clearTimeout(pendingReconnectTimeoutId);
      }
      if (currentSocket) {
        currentSocket.close();
      }
    };
  }, [appendMessage, setStatus]);
}
