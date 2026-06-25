import { useStatsWebSocket } from "../hooks/useStatsWebSocket.js";
import { useDebugQueryParameter } from "../hooks/useDebugQueryParameter.js";
import { StatsBoard } from "../components/stats/StatsBoard.js";
import { StatsDebugPanel } from "../components/stats/StatsDebugPanel.js";

export function StatsOverlayRoute() {
  useStatsWebSocket();
  const isDebugMode = useDebugQueryParameter();
  return (
    <>
      <StatsBoard />
      {isDebugMode ? <StatsDebugPanel /> : null}
    </>
  );
}
