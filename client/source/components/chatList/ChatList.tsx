import { useChatStore } from "../../stores/chatStore.js";
import { useFadeQueryParameter } from "../../hooks/useFadeQueryParameter.js";
import { ChatMessage } from "../chatMessage/ChatMessage.js";
import styles from "./ChatList.module.scss";

export function ChatList() {
  const visibleMessages = useChatStore((state) => state.visibleMessages);
  const fadeAfterSeconds = useFadeQueryParameter();

  return (
    <div className={styles.chatListViewport}>
      <ol className={styles.chatList}>
        {visibleMessages.map((message) => (
          <li key={message.messageId} className={styles.chatListItem}>
            <ChatMessage message={message} fadeAfterSeconds={fadeAfterSeconds} />
          </li>
        ))}
      </ol>
    </div>
  );
}
