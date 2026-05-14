import type { ReactNode } from "react";
import styles from "./MessageEffectWrapper.module.scss";

export type MessageEffectWrapperProperties = {
  messageEffectId: string | null;
  children: ReactNode;
};

function resolveEffectClassName(messageEffectId: string | null): string {
  const genericFallback = styles.messageEffectGeneric ?? "";
  switch (messageEffectId) {
    case "cosmic-abyss":
      return styles.messageEffectCosmicAbyss ?? genericFallback;
    case "rainbow-eclipse":
      return styles.messageEffectRainbowEclipse ?? genericFallback;
    case "simmer":
      return styles.messageEffectSimmer ?? genericFallback;
    default:
      return genericFallback;
  }
}

export function MessageEffectWrapper({
  messageEffectId,
  children,
}: MessageEffectWrapperProperties) {
  return (
    <div className={`${styles.messageEffectWrapper} ${resolveEffectClassName(messageEffectId)}`}>
      {children}
    </div>
  );
}
