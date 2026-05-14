import { useMemo } from "react";
import { readPositiveNumberQueryParameter } from "../utilities/readQueryParameters.js";

export function useFadeQueryParameter(): number | null {
  return useMemo(() => readPositiveNumberQueryParameter("fade"), []);
}
