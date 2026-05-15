import { ChatOverlayRoute } from "./routes/chatOverlayRoute.js";
import { AlertOverlayRoute } from "./routes/alertOverlayRoute.js";

export function Application() {
  // Lightweight path-based routing — no react-router needed for two static
  // overlay routes. OBS will point each Browser Source at a specific URL.
  const pathname =
    typeof window === "undefined" ? "/" : window.location.pathname;
  if (pathname.startsWith("/alerts")) {
    return <AlertOverlayRoute />;
  }
  return <ChatOverlayRoute />;
}
