import { useMemo } from "react";

export function useDebugQueryParameter(): boolean {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const rawValue = new URLSearchParams(window.location.search).get("debug");
    if (rawValue === null) {
      return false;
    }
    return rawValue !== "0" && rawValue.toLowerCase() !== "false";
  }, []);
}
