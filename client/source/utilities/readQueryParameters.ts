export function readPositiveNumberQueryParameter(
  parameterName: string,
): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  const rawValue = new URLSearchParams(window.location.search).get(parameterName);
  if (rawValue === null) {
    return null;
  }
  const parsed = Number.parseFloat(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
