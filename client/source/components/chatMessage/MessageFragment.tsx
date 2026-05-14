import type { OverlayMessageFragment } from "@twitch-overlay/types";
import styles from "./ChatMessage.module.scss";

export type MessageFragmentProperties = {
  fragment: OverlayMessageFragment;
};

export function MessageFragment({ fragment }: MessageFragmentProperties) {
  switch (fragment.type) {
    case "text":
      return <span className={styles.fragmentText}>{fragment.text}</span>;
    case "emote":
      return (
        <img
          className={styles.fragmentEmote}
          src={fragment.imageUrlMedium}
          srcSet={`${fragment.imageUrlSmall} 1x, ${fragment.imageUrlMedium} 2x, ${fragment.imageUrlLarge} 3x`}
          alt={fragment.text}
          title={fragment.text}
          loading="lazy"
          decoding="async"
        />
      );
    case "cheermote":
      return (
        <span className={styles.fragmentCheermote}>
          {fragment.prefix}
          {fragment.bits}
        </span>
      );
    case "mention":
      return (
        <span className={styles.fragmentMention}>{fragment.text}</span>
      );
  }
}
