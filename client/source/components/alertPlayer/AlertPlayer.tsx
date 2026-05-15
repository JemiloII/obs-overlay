import { useEffect, useMemo, useRef, useState } from "react";
import type { OverlayAlertEvent } from "@twitch-overlay/types";
import {
  describeAlertHeadline,
  describeAlertSubline,
  resolveAlertAssets,
  type AlertAssetDescriptor,
} from "../../utilities/alertAssetManifest.js";
import styles from "./AlertPlayer.module.scss";

export type AlertPlayerProperties = {
  alert: OverlayAlertEvent;
  onAlertFinished: () => void;
};

function positionClassName(
  position: AlertAssetDescriptor["position"],
): string {
  switch (position) {
    case "fullscreen":
      return styles.positionFullscreen ?? "";
    case "cornerLeft":
      return styles.positionCornerLeft ?? "";
    case "cornerRight":
      return styles.positionCornerRight ?? "";
    case "screenSides":
      return styles.positionScreenSides ?? "";
  }
}

export function AlertPlayer({ alert, onAlertFinished }: AlertPlayerProperties) {
  const videoElementReference = useRef<HTMLVideoElement | null>(null);
  const audioElementReference = useRef<HTMLAudioElement | null>(null);
  const hasFinishedReference = useRef<boolean>(false);
  const assetDescriptor = useMemo(() => resolveAlertAssets(alert), [alert]);
  const headline = useMemo(() => describeAlertHeadline(alert), [alert]);
  const subline = useMemo(() => describeAlertSubline(alert), [alert]);
  const [hasVideoEnded, setHasVideoEnded] = useState(false);

  useEffect(() => {
    const audioElement = audioElementReference.current;
    if (!audioElement) {
      return;
    }
    audioElement.currentTime = 0;
    void audioElement.play().catch((playError) => {
      console.warn("[alerts] audio play failed:", playError);
    });
  }, [alert.alertId]);

  useEffect(() => {
    hasFinishedReference.current = false;
    setHasVideoEnded(false);
    const fallbackTimeoutId = setTimeout(() => {
      if (hasFinishedReference.current) {
        return;
      }
      hasFinishedReference.current = true;
      onAlertFinished();
    }, assetDescriptor.fallbackDurationMilliseconds);
    return () => clearTimeout(fallbackTimeoutId);
  }, [alert.alertId, assetDescriptor.fallbackDurationMilliseconds, onAlertFinished]);

  function handleVideoEnded(): void {
    if (hasFinishedReference.current) {
      return;
    }
    hasFinishedReference.current = true;
    setHasVideoEnded(true);
    onAlertFinished();
  }

  return (
    <div className={`${styles.alertContainer} ${positionClassName(assetDescriptor.position)}`}>
      <video
        ref={videoElementReference}
        className={styles.alertVideo}
        src={assetDescriptor.videoUrl}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
      />
      <audio ref={audioElementReference} src={assetDescriptor.soundUrl} preload="auto" />
      <div className={styles.alertText}>
        <div className={styles.alertHeadline}>{headline}</div>
        {subline ? <div className={styles.alertSubline}>{subline}</div> : null}
      </div>
    </div>
  );
}
