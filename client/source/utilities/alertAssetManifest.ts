import type {
  OverlayAlertEvent,
  OverlaySubscriptionTier,
} from "@twitch-overlay/types";

const packageBaseUrl = "/alerts/glowing-starfall-rainbow";

export type AlertAssetDescriptor = {
  videoUrl: string;
  soundUrl: string;
  position: "fullscreen" | "cornerLeft" | "cornerRight" | "screenSides";
  /** Safety-net duration in milliseconds in case the video onEnded never fires. */
  fallbackDurationMilliseconds: number;
};

function videoUrl(filename: string): string {
  return `${packageBaseUrl}/videos/${filename}`;
}

function soundUrl(filename: string): string {
  return `${packageBaseUrl}/sounds/${filename}`;
}

function tierVideoUrl(tier: OverlaySubscriptionTier): string {
  switch (tier) {
    case "tier1":
    case "prime":
      return videoUrl("fullscreen-tier-1.webm");
    case "tier2":
      return videoUrl("fullscreen-tier-2.webm");
    case "tier3":
      return videoUrl("fullscreen-tier-3.webm");
  }
}

function tierSoundUrl(tier: OverlaySubscriptionTier): string {
  switch (tier) {
    case "tier1":
    case "prime":
      return soundUrl("glowy-1.mp3");
    case "tier2":
      return soundUrl("glowy-2.mp3");
    case "tier3":
      return soundUrl("glowy-3.mp3");
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
      return {
        videoUrl: tierVideoUrl(alert.tier),
        soundUrl: tierSoundUrl(alert.tier),
        position: "fullscreen",
        fallbackDurationMilliseconds: 8_000,
      };
    case "follow":
      return {
        videoUrl: videoUrl("corner-right.webm"),
        soundUrl: soundUrl("alert-1.mp3"),
        position: "cornerRight",
        fallbackDurationMilliseconds: 6_000,
      };
    case "cheer":
      // User chose: cheers use the Tier 3 fullscreen Glowy Starfall.
      return {
        videoUrl: videoUrl("fullscreen-tier-3.webm"),
        soundUrl: soundUrl("glowy-4.mp3"),
        position: "fullscreen",
        fallbackDurationMilliseconds: 8_000,
      };
    case "raid":
      // User chose: raids use the Tier 3 fullscreen Glowy Starfall.
      return {
        videoUrl: videoUrl("fullscreen-tier-3.webm"),
        soundUrl: soundUrl("alert-3.mp3"),
        position: "fullscreen",
        fallbackDurationMilliseconds: 8_000,
      };
    case "channelPointsRedemption":
      return {
        videoUrl: videoUrl("corner-left.webm"),
        soundUrl: soundUrl("alert-2.mp3"),
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
