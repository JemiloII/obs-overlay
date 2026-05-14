import { useConnectionStore } from "../../stores/connectionStore.js";
import { useChatStore } from "../../stores/chatStore.js";
import { buildSampleChatMessage } from "../../utilities/sampleChatMessages.js";
import styles from "./DebugPanel.module.scss";

export function DebugPanel() {
  const connectionStatus = useConnectionStore((state) => state.status);
  const appendMessage = useChatStore((state) => state.appendMessage);

  function injectSampleTextMessage(): void {
    appendMessage(buildSampleChatMessage());
  }

  function injectSampleGigantifiedEmote(): void {
    appendMessage(
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
    appendMessage(
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
