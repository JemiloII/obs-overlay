import { create } from "zustand";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

type ConnectionStoreState = {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
};

export const useConnectionStore = create<ConnectionStoreState>((set) => ({
  status: "connecting",
  setStatus: (status) => set(() => ({ status })),
}));
