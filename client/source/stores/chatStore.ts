import { create } from "zustand";
import type { OverlayChatMessage } from "@twitch-overlay/types";

const defaultMaximumVisibleMessages = 15;

type ChatStoreState = {
  visibleMessages: OverlayChatMessage[];
  maximumVisibleMessages: number;
  appendMessage: (message: OverlayChatMessage) => void;
  removeMessage: (messageId: string) => void;
  setMaximumVisibleMessages: (maximum: number) => void;
};

export const useChatStore = create<ChatStoreState>((set) => ({
  visibleMessages: [],
  maximumVisibleMessages: defaultMaximumVisibleMessages,
  appendMessage: (message) =>
    set((state) => {
      const withoutDuplicate = state.visibleMessages.filter(
        (existing) => existing.messageId !== message.messageId,
      );
      const next = [...withoutDuplicate, message];
      const trimmed =
        next.length > state.maximumVisibleMessages
          ? next.slice(next.length - state.maximumVisibleMessages)
          : next;
      return { visibleMessages: trimmed };
    }),
  removeMessage: (messageId) =>
    set((state) => ({
      visibleMessages: state.visibleMessages.filter(
        (existing) => existing.messageId !== messageId,
      ),
    })),
  setMaximumVisibleMessages: (maximum) =>
    set(() => ({ maximumVisibleMessages: Math.max(1, Math.floor(maximum)) })),
}));
