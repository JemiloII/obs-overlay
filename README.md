# Twitch Chat Overlay

Custom Twitch chat overlay built for OBS Browser Source. Subscribes to Twitch EventSub WebSocket (`channel.chat.message` + `channel.bits.use`) and renders chat in real time with avatars, badges, Twitch's username colors, gigantified emotes, and Power-Up Message Effects (Cosmic Abyss, Rainbow Eclipse, Simmer).

Designed with a public-widget Phase 2 in mind — viewers will eventually be able to log in and customize how their own chat appears, potentially gated by channel points or bits.

## Stack

- **pnpm workspaces** — three packages: `packages/types`, `server`, `client`
- **Server:** TypeScript + Hono + `@hono/node-ws` + `ws`
- **Client:** TypeScript + React 18 + Vite + Zustand + SCSS modules
- **Twitch:** EventSub WebSocket (Helix API for badges + user profiles)

## Setup

```bash
git clone https://github.com/JemiloII/obs-overlay.git
cd obs-overlay
pnpm install
cp .env.example .env
# Fill in the .env values (see below)
pnpm dev
```

The server starts on `http://localhost:8787` and the client on `http://localhost:4242`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TWITCH_CLIENT_ID` | yes | Twitch app Client ID (from https://dev.twitch.tv/console/apps) |
| `TWITCH_SECRET_ID` | yes | Twitch app Client Secret |
| `TWITCH_ACCESS_TOKEN` | yes | OAuth user access token for the broadcaster |
| `TWITCH_REFRESH_TOKEN` | yes | Matching refresh token (server auto-rotates when access token expires) |
| `SERVER_PORT` | no | Hono server port (default `8787`) |
| `CLIENT_PORT` | no | Vite dev port (default `4242`) |
| `VITE_SERVER_WEBSOCKET_URL` | no | Override the WS URL the client connects to (default `ws://localhost:8787/ws`) |

## Required Twitch token scopes

Generate the token with these scopes — the server validates on boot and refuses to start if any are missing:

- `user:read:chat` — **required** for `channel.chat.message` EventSub
- `bits:read` — required for `channel.bits.use` EventSub (Power-Up correlation, Phase 2 bits-gated features)

Optional but recommended for Phase 2:

- `channel:read:redemptions` — see channel-points redemptions
- `channel:manage:redemptions` — programmatically create the "Customize Chat Appearance" reward
- `channel:read:subscriptions` — know who's subscribed
- `channel:read:hype_train` — hype train events
- `moderator:read:followers` — new follow detection
- `user:write:chat` — send chat messages from the overlay/bot

## OBS Browser Source

- **URL:** `http://localhost:4242` (production: whatever URL you serve the client at)
- **Recommended dimensions:** `540 × 900` for a sidebar layout on a 1080p stream
- **Custom frame rate:** 30
- **Shutdown source when not visible:** off
- **Refresh browser when scene becomes active:** off

## Query parameters

- `?fade=<seconds>` — fade messages out after N seconds (default: messages persist until pushed off)
- `?debug=1` — show a corner panel with WebSocket status + sample-message inject buttons

## Features

- Avatars (fetched from Helix `/users`, cached 5 minutes)
- Global + channel badges (fetched at boot)
- Twitch user color preserved (falls back to theme blue `#3B6ABE` for users without one)
- Twitch platform indicator next to each username — slot designed so other platforms can be added later
- Gigantified emotes (rendered at the 3.0 CDN size)
- Power-Up Message Effects keyed off the undocumented `channel_points_animation_id` field on the chat message:
  - **Cosmic Abyss** — deep nebula with a twinkling starfield
  - **Rainbow Eclipse** — full hue spectrum slowly cycling
  - **Simmer** — warm orange/red heat shimmer
  - Unknown effect IDs fall back to a generic animated frame
- Reconnect with exponential backoff (client and server)
- Auto-refreshes the access token using the refresh token and writes the new tokens back to `.env`

## Scripts

```bash
pnpm dev          # run server + client with HMR
pnpm build        # build all packages
pnpm type-check   # tsc --noEmit across all packages
```

## Roadmap

**Phase 2** (separate planning session): public viewer-customization site where chatters log in with Twitch and personalize how their own messages appear, gated by channel points or bits. Will use SQLite for storage.

## License

MIT
