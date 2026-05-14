import { useEffect, useState } from "react";
import type { OverlayChatMessage, OverlayEmoteFragment } from "@twitch-overlay/types";
import { UserAvatar } from "../userAvatar/UserAvatar.js";
import { UserBadge } from "../userBadge/UserBadge.js";
import { PlatformIndicator } from "../platformIndicator/PlatformIndicator.js";
import { MessageFragment } from "./MessageFragment.js";
import { GigantifiedEmote } from "./GigantifiedEmote.js";
import { MessageEffectWrapper } from "./MessageEffectWrapper.js";
import { useChatStore } from "../../stores/chatStore.js";
import styles from "./ChatMessage.module.scss";

const themeBlueFallbackColor = "#3B6ABE";

export type ChatMessageProperties = {
  message: OverlayChatMessage;
  fadeAfterSeconds: number | null;
};

function findFirstEmoteFragment(message: OverlayChatMessage): OverlayEmoteFragment | null {
  for (const fragment of message.fragments) {
    if (fragment.type === "emote") {
      return fragment;
    }
  }
  return null;
}

export function ChatMessage({ message, fadeAfterSeconds }: ChatMessageProperties) {
  const removeMessage = useChatStore((state) => state.removeMessage);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (fadeAfterSeconds === null) {
      return;
    }
    const fadeOutTimeoutId = setTimeout(() => {
      setIsExiting(true);
    }, fadeAfterSeconds * 1_000);
    return () => clearTimeout(fadeOutTimeoutId);
  }, [fadeAfterSeconds, message.messageId]);

  useEffect(() => {
    if (!isExiting) {
      return;
    }
    const removalTimeoutId = setTimeout(() => {
      removeMessage(message.messageId);
    }, 400);
    return () => clearTimeout(removalTimeoutId);
  }, [isExiting, message.messageId, removeMessage]);

  const usernameColor = message.chatter.color || themeBlueFallbackColor;
  const gigantifiedEmote =
    message.messageType === "powerUpsGigantifiedEmote"
      ? findFirstEmoteFragment(message)
      : null;
  const hasMessageEffect = message.messageType === "powerUpsMessageEffect";

  const body = (
    <div
      className={[
        styles.chatMessage,
        hasMessageEffect ? styles.chatMessageInsideEffect : "",
        isExiting ? styles.chatMessageExiting : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <UserAvatar
        profileImageUrl={message.chatter.profileImageUrl}
        displayName={message.chatter.displayName}
      />
      <div className={styles.chatMessageBody}>
        {message.reply ? (
          <div className={styles.replyLine}>
            <span aria-hidden="true">↳</span> replying to{" "}
            <span className={styles.replyTarget}>
              @{message.reply.parentUserDisplayName}
            </span>
          </div>
        ) : null}
        <div className={styles.chatMessageHeader}>
          <span className={styles.username} style={{ color: usernameColor }}>
            {message.chatter.displayName}
          </span>
          <PlatformIndicator platform={message.platform} />
          {message.badges.map((badge) => (
            <UserBadge key={`${badge.setId}:${badge.badgeId}`} badge={badge} />
          ))}
        </div>
        {gigantifiedEmote ? (
          <div className={styles.chatMessageGigantifiedContainer}>
            <GigantifiedEmote emote={gigantifiedEmote} />
            {message.fragments
              .filter(
                (fragment) =>
                  !(fragment.type === "emote" && fragment.emoteId === gigantifiedEmote.emoteId),
              )
              .map((fragment, fragmentIndex) => (
                <MessageFragment key={fragmentIndex} fragment={fragment} />
              ))}
          </div>
        ) : (
          <div className={styles.chatMessageFragments}>
            {message.fragments.map((fragment, fragmentIndex) => (
              <MessageFragment key={fragmentIndex} fragment={fragment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (message.messageType === "powerUpsMessageEffect") {
    return (
      <MessageEffectWrapper messageEffectId={message.messageEffectId}>
        {body}
      </MessageEffectWrapper>
    );
  }
  return body;
}
