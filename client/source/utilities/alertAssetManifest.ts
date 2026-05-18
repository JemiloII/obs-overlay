import type {
  OverlayAlertEvent,
  OverlaySubscriptionTier,
} from "@twitch-overlay/types";

// Alert pack files live at `client/public/external-assets/<pack-name>/` with
// the pack creator's original folder structure and filenames preserved. End
// users drop the unzipped pack folder in there once and never touch this file.
// Vite serves the public/ contents at the root URL, so each WebM/MP3 is
// reachable at `/external-assets/<pack-name>/<sub-path>` from the client.
const packBaseUrl = "/external-assets/Glowing Starfall - Rainbow";

function buildPackUrl(relativePath: string): string {
  // Each path segment is URL-encoded individually so the slash separators
  // stay intact while spaces and other special chars are properly escaped.
  const encodedRelativePath = relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${packBaseUrl}/${encodedRelativePath}`;
}

function videoUrl(filename: string): string {
  return buildPackUrl(`Animated Alerts/${filename}`);
}

function soundUrl(filename: string): string {
  return buildPackUrl(`Sound/${filename}`);
}

export type AlertAssetDescriptor = {
  videoUrl: string;
  soundUrl: string;
  position: "fullscreen" | "cornerLeft" | "cornerRight" | "screenSides";
  /** Safety-net duration in milliseconds in case the video onEnded never fires. */
  fallbackDurationMilliseconds: number;
};

function tierVideoUrl(tier: OverlaySubscriptionTier): string {
  switch (tier) {
    case "tier1":
    case "prime":
      return videoUrl("Alert Fullscreen Tier 1 Glowy Starfall Rainbow.webm");
    case "tier2":
      return videoUrl("Alert Fullscreen Tier 2 Glowy Starfall Rainbow.webm");
    case "tier3":
      return videoUrl("Alert Fullscreen Tier 3 Glowy Starfall Rainbow.webm");
  }
}

function tierSoundUrl(tier: OverlaySubscriptionTier): string {
  switch (tier) {
    case "tier1":
    case "prime":
      return soundUrl("Alert Sound Glowy 1.mp3");
    case "tier2":
      return soundUrl("Alert Sound Glowy 2.mp3");
    case "tier3":
      return soundUrl("Alert Sound Glowy 3.mp3");
  }
}

export function resolveAlertAssets(
  alert: OverlayAlertEvent,
): AlertAssetDescriptor {
  switch (alert.kind) {
    case "subscription":
      return {
        videoUrl: tierVideoUrl(alert.tier),
        soundUrl: tierSoundUrl(alert.tier),
        position: "fullscreen",
        fallbackDurationMilliseconds: 8_000,
      };
    case "subscriptionGift":
      // Gifts always use the Tier 3 alert regardless of the gifted tier —
      // gifting is a bigger event than a regular sub at any tier, so it gets
      // the most dramatic visual + sound.
      return {
        videoUrl: videoUrl("Alert Fullscreen Tier 3 Glowy Starfall Rainbow.webm"),
        soundUrl: soundUrl("Alert Sound Glowy 3.mp3"),
        position: "fullscreen",
        fallbackDurationMilliseconds: 8_000,
      };
    case "follow":
      return {
        videoUrl: videoUrl("Alert Corner Right Glowy Starfall Rainbow.webm"),
        soundUrl: soundUrl("Alert Sound 1.mp3"),
        position: "cornerRight",
        fallbackDurationMilliseconds: 6_000,
      };
    case "cheer":
      // User chose: cheers use the Tier 3 fullscreen Glowy Starfall.
      return {
        videoUrl: videoUrl("Alert Fullscreen Tier 3 Glowy Starfall Rainbow.webm"),
        soundUrl: soundUrl("Alert Sound Glowy 4.mp3"),
        position: "fullscreen",
        fallbackDurationMilliseconds: 8_000,
      };
    case "raid":
      // User chose: raids use the Tier 3 fullscreen Glowy Starfall.
      return {
        videoUrl: videoUrl("Alert Fullscreen Tier 3 Glowy Starfall Rainbow.webm"),
        soundUrl: soundUrl("Alert Sound 3.mp3"),
        position: "fullscreen",
        fallbackDurationMilliseconds: 8_000,
      };
    case "channelPointsRedemption":
      return {
        videoUrl: videoUrl("Alert Corner Left Glowy Starfall Rainbow.webm"),
        soundUrl: soundUrl("Alert Sound 2.mp3"),
        position: "cornerLeft",
        fallbackDurationMilliseconds: 6_000,
      };
  }
}

export function describeAlertHeadline(alert: OverlayAlertEvent): string {
  switch (alert.kind) {
    case "subscription":
      return alert.isResubscription
        ? `${alert.userDisplayName} resubscribed (${alert.cumulativeMonths ?? "?"} months)!`
        : `${alert.userDisplayName} subscribed!`;
    case "subscriptionGift":
      return alert.isAnonymous || alert.gifterDisplayName === null
        ? `An anonymous gifter gifted ${alert.giftCount} sub${alert.giftCount === 1 ? "" : "s"}!`
        : `${alert.gifterDisplayName} gifted ${alert.giftCount} sub${alert.giftCount === 1 ? "" : "s"}!`;
    case "follow":
      return `${alert.userDisplayName} followed!`;
    case "cheer":
      return alert.isAnonymous || alert.userDisplayName === null
        ? `Anonymous cheered ${alert.bits} bits!`
        : `${alert.userDisplayName} cheered ${alert.bits} bits!`;
    case "raid":
      return `${alert.fromBroadcasterDisplayName} raided with ${alert.viewerCount} viewers!`;
    case "channelPointsRedemption":
      return `${alert.userDisplayName} redeemed ${alert.rewardTitle}!`;
  }
}

export function describeAlertSubline(alert: OverlayAlertEvent): string | null {
  switch (alert.kind) {
    case "subscription":
      return alert.message;
    case "cheer":
      return alert.message;
    case "channelPointsRedemption":
      return alert.userInput.length > 0 ? alert.userInput : null;
    case "subscriptionGift":
    case "follow":
    case "raid":
      return null;
  }
}
