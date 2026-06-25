/**
 * Renders a past-tense relative time like "5 min ago" / "2 hours ago".
 * Used by the stats overlay's "latest X" cards.
 */
export function formatRelativeTime(timestampMilliseconds: number): string {
  const nowMilliseconds = Date.now();
  const elapsedMilliseconds = Math.max(0, nowMilliseconds - timestampMilliseconds);
  const elapsedSeconds = Math.floor(elapsedMilliseconds / 1_000);
  if (elapsedSeconds < 30) {
    return "just now";
  }
  if (elapsedSeconds < 60) {
    return `${elapsedSeconds} sec ago`;
  }
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`;
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  }
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays === 1) {
    return "yesterday";
  }
  if (elapsedDays < 7) {
    return `${elapsedDays} days ago`;
  }
  const elapsedWeeks = Math.floor(elapsedDays / 7);
  if (elapsedWeeks < 5) {
    return `${elapsedWeeks} week${elapsedWeeks === 1 ? "" : "s"} ago`;
  }
  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12) {
    return `${elapsedMonths} month${elapsedMonths === 1 ? "" : "s"} ago`;
  }
  const elapsedYears = Math.floor(elapsedDays / 365);
  return `${elapsedYears} year${elapsedYears === 1 ? "" : "s"} ago`;
}
