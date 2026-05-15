import { useConnectionStore } from "../../stores/connectionStore.js";
import { buildSampleChatMessage } from "../../utilities/sampleChatMessages.js";
import { broadcastDebugMessage } from "../../utilities/broadcastDebugMessage.js";
import type { OverlayChatMessage } from "@twitch-overlay/types";
import styles from "./DebugPanel.module.scss";

function broadcastChat(message: OverlayChatMessage): void {
  void broadcastDebugMessage({ kind: "chatMessage", data: message });
}

export function DebugPanel() {
  const connectionStatus = useConnectionStore((state) => state.status);

  function injectSampleTextMessage(): void {
    broadcastChat(buildSampleChatMessage());
  }

  function injectSampleGigantifiedEmote(): void {
    broadcastChat(
      buildSampleChatMessage({
        messageType: "powerUpsGigantifiedEmote",
        fragments: [
          {
            type: "emote",
            text: "Kappa",
            emoteId: "25",
            imageUrlSmall: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0",
            imageUrlMedium: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0",
            imageUrlLarge: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0",
            animated: false,
          },
        ],
      }),
    );
  }

  function injectSampleMessageEffect(messageEffectId: string): void {
    broadcastChat(
      buildSampleChatMessage({
        messageType: "powerUpsMessageEffect",
        messageEffectId,
        fragments: [{ type: "text", text: `Message with ${messageEffectId} ✨` }],
      }),
    );
  }

  return (
    <div className={styles.debugPanel}>
      <div className={styles.statusRow}>
        <span
          className={`${styles.statusIndicator} ${styles[`status_${connectionStatus}`]}`}
          aria-label={connectionStatus}
        />
        <span className={styles.statusLabel}>WebSocket: {connectionStatus}</span>
      </div>
      <div className={styles.buttonRow}>
        <button type="button" onClick={injectSampleTextMessage}>
          Text
        </button>
        <button type="button" onClick={injectSampleGigantifiedEmote}>
          Gigantified
        </button>
        <button
          type="button"
          onClick={() => injectSampleMessageEffect("cosmic-abyss")}
        >
          Cosmic Abyss
        </button>
        <button
          type="button"
          onClick={() => injectSampleMessageEffect("rainbow-eclipse")}
        >
          Rainbow Eclipse
        </button>
        <button
          type="button"
          onClick={() => injectSampleMessageEffect("simmer")}
        >
          Simmer
        </button>
      </div>
    </div>
  );
}
