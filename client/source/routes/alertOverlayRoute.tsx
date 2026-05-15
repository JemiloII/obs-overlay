import { useAlertWebSocket } from "../hooks/useAlertWebSocket.js";
import { useAlertQueueStore } from "../stores/alertQueueStore.js";
import { useDebugQueryParameter } from "../hooks/useDebugQueryParameter.js";
import { AlertPlayer } from "../components/alertPlayer/AlertPlayer.js";
import { AlertDebugPanel } from "../components/alertPlayer/AlertDebugPanel.js";

export function AlertOverlayRoute() {
  useAlertWebSocket();
  const currentAlert = useAlertQueueStore((state) => state.currentAlert);
  const advanceToNextAlert = useAlertQueueStore((state) => state.advanceToNextAlert);
  const isDebugMode = useDebugQueryParameter();

  return (
    <>
      {currentAlert ? (
        <AlertPlayer
          key={currentAlert.alertId}
          alert={currentAlert}
          onAlertFinished={advanceToNextAlert}
        />
      ) : null}
      {isDebugMode ? <AlertDebugPanel /> : null}
    </>
  );
}
