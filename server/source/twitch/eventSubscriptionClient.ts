import { EventEmitter } from "node:events";
import WebSocket from "ws";
import type {
  TwitchChannelBitsUseEvent,
  TwitchChannelChatMessageEvent,
  TwitchEvent,
  TwitchEventSubEnvelope,
  TwitchEventSubNotificationPayload,
  TwitchEventSubReconnectPayload,
  TwitchEventSubWelcomePayload,
} from "@twitch-overlay/types";
import type { HelixClient } from "./helixClient.js";

const twitchEventSubWebSocketUrl = "wss://eventsub.wss.twitch.tv/ws";
const channelChatMessageSubscriptionType = "channel.chat.message";
const channelChatMessageSubscriptionVersion = "1";
const channelBitsUseSubscriptionType = "channel.bits.use";
const channelBitsUseSubscriptionVersion = "1";

export type TwitchEventSubscriptionClientOptions = {
  broadcasterUserId: string;
  authenticatedUserId: string;
  helixClient: HelixClient;
};

type TwitchEventSubscriptionEvents = {
  chatMessage: [TwitchChannelChatMessageEvent];
  bitsUse: [TwitchChannelBitsUseEvent];
  connected: [];
  disconnected: [{ code: number; reason: string }];
  fatalError: [Error];
};

export class TwitchEventSubscriptionClient extends EventEmitter<TwitchEventSubscriptionEvents> {
  private currentWebSocket: WebSocket | null = null;
  private currentSessionId: string | null = null;
  private hasSubscribedForCurrentSession = false;
  private reconnectAttempts = 0;
  private explicitlyStopped = false;

  constructor(private readonly options: TwitchEventSubscriptionClientOptions) {
    super();
  }

  start(): void {
    this.explicitlyStopped = false;
    this.openWebSocket(twitchEventSubWebSocketUrl, { isReconnect: false });
  }

  stop(): void {
    this.explicitlyStopped = true;
    if (this.currentWebSocket) {
      this.currentWebSocket.close(1000, "client stopping");
      this.currentWebSocket = null;
    }
  }

  private openWebSocket(url: string, options: { isReconnect: boolean }): void {
    const socket = new WebSocket(url);
    socket.on("open", () => {
      console.log(`[eventsub] connected to ${url}`);
      this.reconnectAttempts = 0;
    });
    socket.on("message", (rawMessage: WebSocket.RawData) => {
      this.handleIncomingMessage(rawMessage, socket, options.isReconnect);
    });
    socket.on("close", (code: number, reasonBuffer: Buffer) => {
      const reason = reasonBuffer.toString("utf8");
      console.log(`[eventsub] socket closed (code=${code} reason="${reason}")`);
      this.emit("disconnected", { code, reason });
      if (this.currentWebSocket === socket) {
        this.currentWebSocket = null;
        this.currentSessionId = null;
        this.hasSubscribedForCurrentSession = false;
      }
      if (!this.explicitlyStopped) {
        this.scheduleReconnect();
      }
    });
    socket.on("error", (error: Error) => {
      console.error("[eventsub] socket error:", error.message);
    });
    if (!options.isReconnect) {
      this.currentWebSocket = socket;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts += 1;
    const delayMilliseconds = Math.min(30_000, 1_000 * 2 ** (this.reconnectAttempts - 1));
    console.log(
      `[eventsub] reconnecting in ${delayMilliseconds}ms (attempt ${this.reconnectAttempts})`,
    );
    setTimeout(() => {
      if (!this.explicitlyStopped) {
        this.openWebSocket(twitchEventSubWebSocketUrl, { isReconnect: false });
      }
    }, delayMilliseconds);
  }

  private handleIncomingMessage(
    rawMessage: WebSocket.RawData,
    sourceSocket: WebSocket,
    isReconnectSocket: boolean,
  ): void {
    let envelope: TwitchEventSubEnvelope;
    try {
      envelope = JSON.parse(rawMessage.toString()) as TwitchEventSubEnvelope;
    } catch (parseError) {
      console.error("[eventsub] failed to parse incoming message", parseError);
      return;
    }
    const messageType = envelope.metadata.message_type;
    if (messageType === "session_welcome") {
      const welcomePayload = envelope.payload as TwitchEventSubWelcomePayload;
      this.handleSessionWelcome(
        welcomePayload.session.id,
        sourceSocket,
        isReconnectSocket,
      );
      return;
    }
    if (messageType === "session_keepalive") {
      return;
    }
    if (messageType === "session_reconnect") {
      const reconnectPayload = envelope.payload as TwitchEventSubReconnectPayload;
      const reconnectUrl = reconnectPayload.session.reconnect_url;
      if (reconnectUrl) {
        console.log("[eventsub] session_reconnect received, opening replacement socket");
        this.openWebSocket(reconnectUrl, { isReconnect: true });
      }
      return;
    }
    if (messageType === "notification") {
      const notificationPayload =
        envelope.payload as TwitchEventSubNotificationPayload<TwitchEvent>;
      const subscriptionType = envelope.metadata.subscription_type;
      if (subscriptionType === channelChatMessageSubscriptionType) {
        this.emit(
          "chatMessage",
          notificationPayload.event as TwitchChannelChatMessageEvent,
        );
      } else if (subscriptionType === channelBitsUseSubscriptionType) {
        this.emit(
          "bitsUse",
          notificationPayload.event as TwitchChannelBitsUseEvent,
        );
      }
      return;
    }
    if (messageType === "revocation") {
      const revocationPayload = envelope.payload as {
        subscription: { type: string };
      };
      console.warn(
        "[eventsub] subscription revoked:",
        revocationPayload.subscription.type,
      );
      return;
    }
  }

  private async handleSessionWelcome(
    sessionId: string,
    sourceSocket: WebSocket,
    isReconnectSocket: boolean,
  ): Promise<void> {
    console.log(`[eventsub] session welcome (id=${sessionId})`);
    if (isReconnectSocket) {
      // Replacement socket: swap pointer; old socket will close on its own.
      if (this.currentWebSocket && this.currentWebSocket !== sourceSocket) {
        this.currentWebSocket.close(1000, "replaced by reconnect");
      }
      this.currentWebSocket = sourceSocket;
      this.currentSessionId = sessionId;
      // Twitch retains subscriptions across reconnect; do not re-subscribe.
      this.hasSubscribedForCurrentSession = true;
      this.emit("connected");
      return;
    }
    this.currentSessionId = sessionId;
    if (this.hasSubscribedForCurrentSession) {
      return;
    }
    try {
      await this.options.helixClient.createEventSubscription({
        type: channelChatMessageSubscriptionType,
        version: channelChatMessageSubscriptionVersion,
        condition: {
          broadcaster_user_id: this.options.broadcasterUserId,
          user_id: this.options.authenticatedUserId,
        },
        transport: {
          method: "websocket",
          session_id: sessionId,
        },
      });
      console.log("[eventsub] channel.chat.message subscription confirmed");

      await this.options.helixClient.createEventSubscription({
        type: channelBitsUseSubscriptionType,
        version: channelBitsUseSubscriptionVersion,
        condition: {
          broadcaster_user_id: this.options.broadcasterUserId,
        },
        transport: {
          method: "websocket",
          session_id: sessionId,
        },
      });
      console.log("[eventsub] channel.bits.use subscription confirmed");

      this.hasSubscribedForCurrentSession = true;
      this.emit("connected");
    } catch (error) {
      const wrappedError =
        error instanceof Error ? error : new Error(String(error));
      this.emit("fatalError", wrappedError);
    }
  }
}
