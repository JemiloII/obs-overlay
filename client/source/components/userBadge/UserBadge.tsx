import type { OverlayBadge } from "@twitch-overlay/types";
import styles from "./UserBadge.module.scss";

export type UserBadgeProperties = {
  badge: OverlayBadge;
};

export function UserBadge({ badge }: UserBadgeProperties) {
  return (
    <img
      className={styles.userBadge}
      src={badge.imageUrlMedium}
      srcSet={`${badge.imageUrlSmall} 1x, ${badge.imageUrlMedium} 2x, ${badge.imageUrlLarge} 4x`}
      alt={badge.title}
      title={badge.title}
      loading="lazy"
      decoding="async"
    />
  );
}
