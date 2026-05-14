import type { OverlayPlatform } from "@twitch-overlay/types";
import { TwitchGlyph } from "./icons/TwitchGlyph.js";
import styles from "./PlatformIndicator.module.scss";

export type PlatformIndicatorProperties = {
  platform: OverlayPlatform;
};

export function PlatformIndicator({ platform }: PlatformIndicatorProperties) {
  switch (platform) {
    case "twitch":
      return (
        <span className={`${styles.platformIndicator} ${styles.platformIndicatorTwitch}`}>
          <TwitchGlyph className={styles.platformIcon} />
        </span>
      );
  }
}
