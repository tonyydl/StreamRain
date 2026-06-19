# 🌧 StreamRain

> Turn Twitch chat into danmaku (bullet comments) flowing right-to-left across the video.

**English** | [中文](README.zh-TW.md)

StreamRain is a cross-browser extension (Chrome / Edge / Firefox) that overlays
Twitch chat as danmaku — scrolling comments — directly on top of the stream,
color-coded by the sender's role. A toggle button sits in the corner of the
player, and a popup gives you fine-grained control over the look.

---

## Features

- **Danmaku overlay** — chat messages scroll right-to-left over the video, in lanes that avoid overlap.
- **Role-based colors** — Moderator/Broadcaster = green, Subscriber = purple, VIP = yellow, everyone else = white. All colors are customizable.
- **Shows every message** — no filtering.
- **In-player toggle** — a `彈` button in the bottom-right corner turns danmaku on/off instantly.
- **Popup settings** — opacity, speed (slow/medium/fast), font size (small/medium/large), and per-role colors. Settings sync across your browsers via `storage.sync`.
- **Immune to chat extensions** — works whether or not 7TV / BTTV / FFZ are installed (see [How it works](#how-it-works)).

---

## Installation (unpacked / developer mode)

The extension is not yet on the stores, so load it manually.

### Chrome / Edge

1. Go to `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select the `StreamRain` folder.
4. Open any Twitch stream — the `彈` button appears in the player's bottom-right corner.

### Firefox

> ⚠️ **Not yet verified on Firefox.** The API layer is cross-browser ready
> (uses `webextension-polyfill` + the promise-based `browser.*` namespace),
> but the MV3 background key may still need adjusting for Firefox. Treat
> Firefox support as experimental.

1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and select `StreamRain/manifest.json`.

---

## Usage

- **Toggle danmaku:** click the `彈` button in the bottom-right corner of the player, or use the toggle in the popup.
- **Adjust appearance:** click the StreamRain toolbar icon to open the popup:
  - **彈幕開關 (Enable)** — master on/off
  - **透明度 (Opacity)** — 10%–100%
  - **速度 (Speed)** — slow / medium / fast
  - **字體大小 (Font size)** — small / medium / large
  - **角色顏色 (Role colors)** — MOD / Subscriber / VIP / General

Changes apply live.

---

## How it works

Instead of scraping the chat DOM (which breaks when extensions like 7TV
replace Twitch's chat renderer), StreamRain connects directly to Twitch's
public **anonymous IRC-over-WebSocket** gateway
(`wss://irc-ws.chat.twitch.tv:443`) — the same source the official client
uses. It joins the current channel read-only as an anonymous `justinfan`
user and parses each message's IRCv3 tags for the sender's role.

This means danmaku works regardless of what chat front-end you use, and is
not affected by Twitch's markup changes.

---

## Privacy

- **Read-only & anonymous.** StreamRain joins chat as an anonymous viewer and never sends messages, logs in, or transmits your identity.
- **No external servers.** It talks only to Twitch. There is no StreamRain backend, analytics, or telemetry.
- **Local settings only.** Your preferences live in the browser's `storage.sync` and never leave Twitch + your browser sync.

---

## Project structure

```
StreamRain/
├─ manifest.json              # MV3 manifest
├─ icons/                     # 16 / 48 / 128 px icons
├─ styles/danmaku.css         # overlay + danmaku animation
└─ src/
   ├─ vendor/                 # webextension-polyfill
   ├─ shared/                 # constants.js, storage.js
   ├─ content/                # overlay, engine, IRC chat source, toggle button, bootstrap
   ├─ popup/                  # settings UI
   └─ background/             # service worker (sets defaults on install)
```

**Tech:** Manifest V3, vanilla JS, CSS `@keyframes`, no build step.
