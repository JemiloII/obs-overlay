import { useEffect, useState } from "react";
import { TwitchGlyph } from "../platformIndicator/icons/TwitchGlyph.js";
import { formatRelativeTime } from "../../utilities/formatRelativeTime.js";
import styles from "./LatestEventCard.module.scss";

export type LatestEventCardProperties = {
  label: string;
  primaryText: string;
  secondaryText?: string | null;
  receivedAtMilliseconds: number;
};

/**
 * Re-renders every 30 seconds so the "5 min ago" text stays current
 * without depending on incoming WS messages. Lightweight — one card pays
 * about one render per 30s.
 */
function useTickingClock(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(intervalId);
  }, []);
  return now;
}

export function LatestEventCard({
  label,
  primaryText,
  secondaryText,
  receivedAtMilliseconds,
}: LatestEventCardProperties) {
  useTickingClock();
  return (
    <div className={styles.latestEventCard}>
      <div className={styles.cardHeader}>
        <TwitchGlyph className={styles.platformGlyph} />
        <span className={styles.cardLabel}>{label}</span>
      </div>
      <div className={styles.primaryText}>{primaryText}</div>
      {secondaryText !== null && secondaryText !== undefined && secondaryText.length > 0 ? (
        <div className={styles.secondaryText}>{secondaryText}</div>
      ) : null}
      <div className={styles.relativeTime}>
        {formatRelativeTime(receivedAtMilliseconds)}
      </div>
    </div>
  );
}
