import type { OverlayChatMessage } from "@twitch-overlay/types";

let sampleMessageCounter = 0;

export function buildSampleChatMessage(
  overrides: Partial<OverlayChatMessage> = {},
): OverlayChatMessage {
  sampleMessageCounter += 1;
  const baseMessage: OverlayChatMessage = {
    messageId: `sample-${sampleMessageCounter}-${Date.now()}`,
    platform: "twitch",
    chatter: {
      userId: "0",
      loginName: "sampleviewer",
      displayName: "SampleViewer",
      color: "#3B6ABE",
      profileImageUrl:
        "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_70x70.png",
    },
    badges: [],
    fragments: [{ type: "text", text: "Hello from the debug panel!" }],
    messageType: "text",
    messageEffectId: null,
    reply: null,
    receivedAt: Date.now(),
  };
  return { ...baseMessage, ...overrides };
}
