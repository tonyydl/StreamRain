# StreamRain — Danmaku Extension Design Spec

**Date:** 2026-06-19  
**Status:** Approved

## Overview

StreamRain is a cross-browser extension (Chrome, Firefox, Edge) that converts Twitch chat messages into danmaku (彈幕) — animated text that flies from right to left across the video player. Users can toggle the feature via a button in the video corner or through the extension popup, which also exposes visual settings.

---

## Goals

- Overlay danmaku on the Twitch video player (not beside it)
- Read chat messages from the Twitch page DOM (no OAuth required)
- Color-code messages by user role: MOD, Subscriber, VIP, General
- Display all messages with no filtering or rate-limiting
- Provide two toggle surfaces: video corner button + extension popup with settings
- Support Chrome, Firefox, and Edge via Manifest V3 + WebExtension polyfill

---

## Architecture

### Technology Stack

- **Manifest V3** — current standard supported by Chrome, Edge, and Firefox
- **webextension-polyfill** — unifies `chrome.*` / `browser.*` API differences for Firefox compatibility
- **Vanilla JS + CSS animations** — no framework dependency; keeps the extension lightweight
- **`chrome.storage.sync`** — persists user settings across devices

### File Structure

```
StreamRain/
├── manifest.json
├── src/
│   ├── content/
│   │   ├── index.js             # Entry: injects overlay, starts observer
│   │   ├── chat-observer.js     # MutationObserver on Twitch chat DOM
│   │   ├── danmaku-engine.js    # Track management, animation timing, color logic
│   │   ├── danmaku-overlay.js   # Creates and manages the <div> overlay on video
│   │   └── toggle-button.js     # Corner toggle button injected into player
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── background/
│   │   └── service-worker.js    # State sync, storage coordination
│   └── shared/
│       ├── constants.js         # Twitch DOM selectors, color definitions
│       └── storage.js           # chrome.storage wrapper
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── styles/
    └── danmaku.css              # @keyframes for right-to-left animation
```

---

## Component Responsibilities

### `chat-observer.js`
- Attaches a `MutationObserver` to the Twitch chat container
- Parses each new chat message node to extract:
  - `username` — from `[data-a-user]`
  - `message` — text content
  - `badge` — from `.chat-badge` (MOD / Subscriber / VIP / none)
- Emits parsed message objects to `danmaku-engine.js`
- Handles Twitch SPA navigation: monitors `document.body` for chat container appearance/disappearance, restarts observer automatically

### `danmaku-engine.js`
- Computes track count dynamically: `Math.floor(videoHeight / (fontSize + 6px padding))`
- Each track records the estimated end-time of the last assigned danmaku
- Assigns incoming messages to the earliest-available track; queues overflow (max queue size: 50 messages — older entries dropped when cap is reached)
- Calculates animation duration based on message character length
- Applies color by badge:
  - MOD → green (`#00C000`)
  - Subscriber → purple (`#9146FF`)
  - VIP → yellow (`#F5A623`)
  - General → white (`#FFFFFF`)

### `danmaku-overlay.js`
- Creates a `<div>` overlay positioned `absolute` over the `<video>` element
- Uses `ResizeObserver` to keep overlay dimensions in sync with the video container (including fullscreen)
- Each danmaku = one `<span>` added to the overlay with a CSS animation class
- Removes each `<span>` from the DOM on `animationend` to prevent memory accumulation

### `toggle-button.js`
- Injects a semi-transparent circular button into the video player's bottom-right corner
- Active state: accent color (StreamRain blue); inactive: gray
- On click: reads current `enabled` state from storage, toggles it, writes back

### `service-worker.js`
- Listens for messages from content script and popup
- Acts as the single source of truth for the `enabled` flag across tabs
- No persistent state in memory — relies entirely on `chrome.storage.sync`

### Popup (`popup.html` / `popup.js`)
- Controls exposed:
  - **Enable toggle** — on/off switch
  - **Opacity** — slider 10–100% (default 80%)
  - **Speed** — slider: slow / medium / fast (maps to CSS animation durations: 12s / 8s / 5s)
  - **Font size** — small / medium / large (14px / 18px / 22px)
  - **Color pickers** — per role (MOD, Subscriber, VIP, General)
- All changes write immediately to `chrome.storage.sync`
- Content script listens to `chrome.storage.onChanged` and applies settings live without reload

### `constants.js` — Twitch DOM Selectors (single source of truth)

```js
export const SELECTORS = {
  CHAT_LINE:      '.chat-line__message',
  USERNAME:       '[data-a-user]',
  BADGE:          '.chat-badge',
  CHAT_CONTAINER: '.chat-scrollable-area__message-container',
  VIDEO:          'video.video-player__video',
  PLAYER_WRAPPER: '.video-player__container',
};

export const COLORS = {
  MOD:        '#00C000',
  SUBSCRIBER: '#9146FF',
  VIP:        '#F5A623',
  GENERAL:    '#FFFFFF',
};
```

---

## Data Flow

```
Twitch chat DOM
      │  MutationObserver (new .chat-line__message)
      ▼
chat-observer.js  →  { username, message, badge }
      │
      ▼
danmaku-engine.js
  - pick available track
  - compute duration
  - assign color
      │
      ▼
danmaku-overlay.js
  - append <span> with CSS animation
  - remove on animationend
```

---

## Settings Schema (chrome.storage.sync)

```js
{
  enabled:   true,         // boolean
  opacity:   0.8,          // 0.1–1.0
  speed:     'medium',     // 'slow' | 'medium' | 'fast'
  fontSize:  'medium',     // 'small' | 'medium' | 'large'
  colors: {
    mod:        '#00C000',
    subscriber: '#9146FF',
    vip:        '#F5A623',
    general:    '#FFFFFF',
  }
}
```

---

## Error Handling & Edge Cases

| Scenario | Handling |
|---|---|
| Chat container not yet in DOM | `MutationObserver` on `document.body`; starts chat observer when container appears |
| Twitch SPA navigation (channel change) | Observer detects container removal, pauses, restarts on reappear |
| Video element not found | Overlay injection retries with exponential backoff: 500ms → 1s → 2s → 4s → 8s (max 5 attempts, then stops) |
| All tracks busy | New messages queued in a FIFO buffer; dispatched as tracks free up |
| Fullscreen mode | `ResizeObserver` on player wrapper keeps overlay in sync |
| Firefox API differences | `webextension-polyfill` wraps all `chrome.*` calls |

---

## Browser Compatibility

| Browser | Manifest Version | Notes |
|---|---|---|
| Chrome 88+ | V3 | Native support |
| Edge 88+ | V3 | Chromium-based, identical to Chrome |
| Firefox 109+ | V3 | Requires `browser_specific_settings` in manifest + polyfill |

---

## Out of Scope (v1)

- Twitch IRC / EventSub integration
- Message filtering or keyword blocking
- Mobile browser support
- Sending chat messages from the extension
- Danmaku on VODs (recordings) — v1 targets live streams only
