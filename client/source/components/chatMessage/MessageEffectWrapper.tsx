import type { ReactNode } from "react";
import styles from "./ChatMessage.module.scss";

export type MessageEffectWrapperProperties = {
  children: ReactNode;
};

export function MessageEffectWrapper({ children }: MessageEffectWrapperProperties) {
  return <div className={styles.messageEffectWrapper}>{children}</div>;
}
