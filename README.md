# OBS Overlay

Custom Twitch overlays for OBS Browser Source — live chat with Power-Up effects, plus animated alerts for subscriptions, follows, cheers, raids, and channel-point redemptions.

Two overlays, one server:

- **Chat overlay** (`/`) — renders live chat with avatars, badges, Twitch's username colors, gigantified emotes, and Power-Up Message Effects (Cosmic Abyss, Rainbow Eclipse, Simmer).
- **Alerts overlay** (`/alerts`) — plays animated WebM alerts + sounds for subscriptions (new/resub/gift), follows, cheers, raids, and channel-point redemptions.

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

Then place the alert pack assets in `client/public/alerts/` (see [Third-party assets](#third-party-assets)).

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
| `VITE_SERVER_HTTP_URL` | no | Override the HTTP URL the client uses for the debug-broadcast endpoint (default derived from `VITE_SERVER_WEBSOCKET_URL`) |

## Required Twitch token scopes

Generate the token with these scopes — the server validates on boot and refuses to start if any are missing:

- `user:read:chat` — **required** for `channel.chat.message` EventSub

Recommended for the alerts overlay:

- `bits:read` — `channel.bits.use` + `channel.cheer`
- `channel:read:subscriptions` — sub/resub/gift alerts
- `moderator:read:followers` — follow alerts
- `channel:read:redemptions` — channel-point redemption alerts
- `channel:manage:redemptions` — programmatically create the "Customize Chat Appearance" reward (Phase 2)
- `channel:read:hype_train` — hype train events
- `user:write:chat` — send chat messages from the overlay/bot

Recommended for the stats overlay (`/stats`):

- `channel:read:goals` — creator goals (follower / sub goals); seeded at boot from Helix `/goals` and kept live via `channel.goal.*` EventSub. **Without this, the Goals section is always empty.**
- `moderator:read:followers` — also powers the "latest follower" backfill so the board isn't empty between live follows.

The server is forgiving: if a sub-scope is missing, it logs a warning and skips that one subscription rather than refusing to start. Note that "latest subscriber / cheer / gift" have no time-ordered Helix history endpoint, so they can't be backfilled — those slots fill in only as events arrive while the server is running.

## OBS Browser Sources

Add two browser sources, one per overlay:

**Chat:**
- **URL:** `http://localhost:4242`
- **Dimensions:** `540 × 900` for a sidebar layout on 1080p

**Alerts:**
- **URL:** `http://localhost:4242/alerts`
- **Dimensions:** `1920 × 1080` (full canvas — fullscreen alerts span the screen, corner alerts position themselves)

For both:

- **Custom frame rate:** 30
- **Shutdown source when not visible:** off
- **Refresh browser when scene becomes active:** off

## Query parameters

- `?fade=<seconds>` (chat only) — fade messages out after N seconds (default: messages persist until pushed off)
- `?debug=1` — show a corner debug panel with WebSocket status + sample-message inject buttons. Clicks in this panel fan out to **every** connected overlay client (so you can keep OBS open on the plain URL and the debug panel in a separate browser tab — clicks fire alerts/messages in OBS).

## Third-party assets

The alerts overlay plays WebM animations + MP3 sounds from a creator-purchased alert pack. **The pack files are not included in this repository and are never committed.** They live inside the top-level `external-assets/` folder, which is committed (via a `.gitkeep`) so the directory always exists after cloning, but every entry inside it is gitignored.

### Set up your pack

1. **Purchase** a pack license (this repo's defaults match DexPixel's **Glowing Starfall Alerts**, but any pack works if you map filenames):
   <https://vgen.co/DexPixel/product/glowing-starfall-alerts-full-screen-animated-twitch-alerts-for-obs-streamlabs/210eff42-a624-45c0-865b-a441f7914839>

2. **Unzip** the pack and drop the unzipped folder into `external-assets/` at the project root. Keep the creator's original folder names + filenames untouched. With the Glowing Starfall pack you end up with:
   ```
   external-assets/
   ├── .gitkeep
   └── Glowing Starfall - Rainbow/
       ├── Animated Alerts/
       │   ├── Alert Fullscreen Tier 1 Glowy Starfall Rainbow.webm
       │   ├── Alert Fullscreen Tier 2 Glowy Starfall Rainbow.webm
       │   ├── Alert Fullscreen Tier 3 Glowy Starfall Rainbow.webm
       │   ├── Alert Corner Left Glowy Starfall Rainbow.webm
       │   ├── Alert Corner Right Glowy Starfall Rainbow.webm
       │   └── Alert Screen Sides Glowy Starfall Rainbow.webm
       └── Sound/
           ├── Alert Sound 1.mp3 … Alert Sound 3.mp3
           └── Alert Sound Glowy 1.mp3 … Alert Sound Glowy 4.mp3
   ```

3. **That's it.** No env var, no config file. A small Vite middleware in `client/vite.config.ts` serves the contents of the top-level `external-assets/` folder at `http://localhost:<CLIENT_PORT>/external-assets/<sub-path>`, with a path-traversal guard so requests can only resolve to files inside that directory.

### Using a different pack

Edit `client/source/utilities/alertAssetManifest.ts` and change the `packBaseUrl` constant + the `videoUrl(...)` / `soundUrl(...)` filenames to match your pack's folder name + filenames. The folder structure under `external-assets/` mirrors however your pack ships — the code doesn't care about the layout, just the paths it looks for.

### Licensing

The DexPixel pack ships under vgen's **Personal + Monetized Content** license — no commercial merchandising, no redistribution. To keep this repository clean of pack bytes, `.gitignore` blocks:

- `external-assets/*` (with `!external-assets/.gitkeep` so the folder itself stays tracked)
- `client/public/external-assets/`, `client/public/alerts/`, `packs/` (legacy paths, kept as belt-and-suspenders)
- `*.webm`, `*.mp3`, `*.wav`, `*.ogg` anywhere in the tree

Any contributor who accidentally drops a binary into the working copy will see it ignored automatically.

## Features

### Chat overlay
- Avatars (Helix `/users`, cached 5 minutes)
- Global + channel badges (fetched at boot)
- Twitch user color preserved (falls back to theme blue `#3B6ABE` for users without one)
- Twitch platform indicator next to each username — slot designed so other platforms can be added later
- Gigantified emotes (rendered at the 3.0 CDN size)
- Power-Up Message Effects keyed off the undocumented `channel_points_animation_id` field on the chat message:
  - **Cosmic Abyss** — deep nebula with a twinkling starfield
  - **Rainbow Eclipse** — full hue spectrum slowly cycling
  - **Simmer** — warm orange/red heat shimmer
  - Unknown effect IDs fall back to a generic animated frame

### Alerts overlay
- Subscription (new / resub / gift) — fullscreen WebM per tier with matching glowy sound
- Follow — corner-right WebM with light sound
- Cheer — Tier 3 fullscreen WebM
- Raid — Tier 3 fullscreen WebM
- Channel-point redemption — corner-left WebM
- Queue-driven: simultaneous events play one after another rather than overlapping

### Server
- One Hono process serves both overlays over a single WebSocket relay
- Reconnect with exponential backoff (client and server)
- Auto-refreshes the Twitch access token using the refresh token and writes the new tokens back to `.env`
- Continues with partial subscriptions if any individual EventSub topic fails to subscribe (logs a warning)
- `POST /debug/broadcast` endpoint for fanning sample chat/alert events to every connected overlay (used by the `?debug=1` panel)

## Scripts

```bash
pnpm dev          # run server + client with HMR
pnpm build        # build all packages
pnpm type-check   # tsc --noEmit across all packages
```

## Roadmap

**Phase 2** (separate planning session): public viewer-customization site where chatters log in with Twitch and personalize how their own messages appear, gated by channel points or bits. Will use SQLite for storage.

## Credits

- **[@DexPixel](https://vgen.co/DexPixel)** — *Glowing Starfall Alerts* pack used by the alerts overlay. Purchase your own license to use the pack with this project — see [Third-party assets](#third-party-assets).

## License

The **code** in this repository is licensed under the [MIT License](./LICENSE).

The MIT license **does not extend to third-party assets** (alert WebMs / MP3s in `client/public/alerts/`). Those assets are **not redistributed** by this repository — they are gitignored and must be obtained under their original creator's license. See [Third-party assets](#third-party-assets) for sourcing.
