import { create } from "zustand";
import type { OverlayAlertEvent } from "@twitch-overlay/types";

type AlertQueueStoreState = {
  pendingAlerts: OverlayAlertEvent[];
  currentAlert: OverlayAlertEvent | null;
  enqueueAlert: (alert: OverlayAlertEvent) => void;
  advanceToNextAlert: () => void;
};

export const useAlertQueueStore = create<AlertQueueStoreState>((set) => ({
  pendingAlerts: [],
  currentAlert: null,
  enqueueAlert: (alert) =>
    set((state) => {
      if (state.currentAlert === null) {
        return { currentAlert: alert, pendingAlerts: state.pendingAlerts };
      }
      return {
        currentAlert: state.currentAlert,
        pendingAlerts: [...state.pendingAlerts, alert],
      };
    }),
  advanceToNextAlert: () =>
    set((state) => {
      const [nextAlert, ...remainingAlerts] = state.pendingAlerts;
      return {
        currentAlert: nextAlert ?? null,
        pendingAlerts: remainingAlerts,
      };
    }),
}));
