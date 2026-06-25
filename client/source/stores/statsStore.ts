import { create } from "zustand";
import type { OverlayStatsSnapshot } from "@twitch-overlay/types";

type StatsStoreState = {
  snapshot: OverlayStatsSnapshot | null;
  setSnapshot: (snapshot: OverlayStatsSnapshot) => void;
};

export const useStatsStore = create<StatsStoreState>((set) => ({
  snapshot: null,
  setSnapshot: (snapshot) => set(() => ({ snapshot })),
}));
