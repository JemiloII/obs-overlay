import { useChatWebSocket } from "../hooks/useChatWebSocket.js";
import { useDebugQueryParameter } from "../hooks/useDebugQueryParameter.js";
import { ChatList } from "../components/chatList/ChatList.js";
import { DebugPanel } from "../components/debugPanel/DebugPanel.js";

export function ChatOverlayRoute() {
  useChatWebSocket();
  const isDebugMode = useDebugQueryParameter();
  return (
    <>
      <ChatList />
      {isDebugMode ? <DebugPanel /> : null}
    </>
  );
}
