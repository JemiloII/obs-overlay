import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Application } from "./application.js";
import "./styles/global.scss";

const rootElement = document.getElementById("application-root");
if (!rootElement) {
  throw new Error("Could not find #application-root in document.");
}

createRoot(rootElement).render(
  <StrictMode>
    <Application />
  </StrictMode>,
);
