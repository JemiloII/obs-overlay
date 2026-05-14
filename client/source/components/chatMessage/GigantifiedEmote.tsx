import type { OverlayEmoteFragment } from "@twitch-overlay/types";
import styles from "./ChatMessage.module.scss";

export type GigantifiedEmoteProperties = {
  emote: OverlayEmoteFragment;
};

export function GigantifiedEmote({ emote }: GigantifiedEmoteProperties) {
  return (
    <img
      className={styles.gigantifiedEmote}
      src={emote.imageUrlLarge}
      alt={emote.text}
      title={emote.text}
      decoding="async"
    />
  );
}
