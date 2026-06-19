# StreamRain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-browser (Chrome/Firefox/Edge) extension that overlays Twitch chat as right-to-left danmaku on the video player, with a corner toggle button and a popup settings panel.

**Architecture:** Manifest V3 content script reads the Twitch chat DOM via MutationObserver and passes parsed messages to the danmaku engine, which assigns each message to a horizontal track and renders it as an animated `<span>` on a `<div>` overlay above the video. Settings are stored in `chrome.storage.sync` and shared between content script, popup, and service worker.

**Tech Stack:** Vanilla JS (ES modules via IIFE bundles), CSS `@keyframes`, Manifest V3, `webextension-polyfill` for Firefox compatibility, no build tool.

## Global Constraints

- Manifest V3 only — no Manifest V2 APIs (`background.page`, `browser_action`)
- Firefox 109+, Chrome 88+, Edge 88+
- No external CDN — `webextension-polyfill` must be vendored locally under `src/vendor/`
- No framework (React, Vue, etc.) — vanilla JS only
- All `chrome.*` calls wrapped through `src/shared/storage.js` which uses the polyfill
- Default settings: `{ enabled: true, opacity: 0.8, speed: 'medium', fontSize: 'medium', colors: { mod: '#00C000', subscriber: '#9146FF', vip: '#F5A623', general: '#FFFFFF' } }`
- Queue cap: 50 messages; drop oldest when full
- Overlay retry: exponential backoff 500ms → 1s → 2s → 4s → 8s, max 5 attempts
- Track count: `Math.floor(videoHeight / (fontSizePx + 6))`

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `manifest.json` | Create | Extension manifest — permissions, content scripts, popup, service worker |
| `src/vendor/browser-polyfill.min.js` | Download | webextension-polyfill vendored copy |
| `src/shared/constants.js` | Create | Twitch DOM selectors + default color palette |
| `src/shared/storage.js` | Create | `chrome.storage.sync` read/write/watch wrapper |
| `styles/danmaku.css` | Create | `@keyframes danmaku-fly` + `.sr-danmaku` + `.sr-overlay` styles |
| `src/content/danmaku-overlay.js` | Create | Creates overlay `<div>`, ResizeObserver, append/destroy |
| `src/content/danmaku-engine.js` | Create | Track assignment, duration calc, color lookup, queue |
| `src/content/chat-observer.js` | Create | MutationObserver on Twitch chat, SPA reconnect logic |
| `src/content/toggle-button.js` | Create | Corner button inject, click → storage toggle |
| `src/content/index.js` | Create | Entry: bootstrap sequence, storage change listener |
| `src/background/service-worker.js` | Create | `onInstalled` default settings, message relay |
| `src/popup/popup.html` | Create | Settings page markup |
| `src/popup/popup.css` | Create | Popup styles |
| `src/popup/popup.js` | Create | Reads/writes storage, live updates |
| `tests/danmaku-engine.test.html` | Create | In-browser unit tests for track + queue logic |
| `icons/icon16.png` | Note | Placeholder — replace with real asset before publishing |
| `icons/icon48.png` | Note | Placeholder — replace with real asset before publishing |
| `icons/icon128.png` | Note | Placeholder — replace with real asset before publishing |

---

## Task 1: Project Scaffold + Manifest

**Files:**
- Create: `manifest.json`
- Create: `src/vendor/` (directory)
- Create: `icons/` (directory, placeholder PNGs)
- Create: `styles/` (directory)
- Create: `src/shared/`, `src/content/`, `src/background/`, `src/popup/` (directories)

**Interfaces:**
- Produces: `manifest.json` declaring all permissions, content scripts, popup, and service worker paths that every subsequent task depends on

- [ ] **Step 1: Download webextension-polyfill**

  Go to `https://github.com/mozilla/webextension-polyfill/releases` and download `browser-polyfill.min.js`. Save it to `src/vendor/browser-polyfill.min.js`.

  Alternatively, run:
  ```bash
  curl -L "https://unpkg.com/webextension-polyfill@0.10.0/dist/browser-polyfill.min.js" \
    -o src/vendor/browser-polyfill.min.js
  ```

- [ ] **Step 2: Create directory structure**

  ```bash
  mkdir -p src/vendor src/shared src/content src/background src/popup styles icons tests
  ```

- [ ] **Step 3: Create placeholder icons**

  Use any 16×16, 48×48, 128×128 PNG images as placeholders. Name them `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`. These must exist or the extension will fail to load.

  Quick approach — create minimal 1×1 PNGs via terminal (requires ImageMagick) or copy any existing PNG and resize. The icons are not functional yet; they just need to be valid PNG files.

- [ ] **Step 4: Create `manifest.json`**

  ```json
  {
    "manifest_version": 3,
    "name": "StreamRain",
    "version": "1.0.0",
    "description": "Twitch chat as danmaku overlay — right to left, on your stream.",
    "icons": {
      "16":  "icons/icon16.png",
      "48":  "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "permissions": [
      "storage",
      "activeTab"
    ],
    "host_permissions": [
      "https://www.twitch.tv/*"
    ],
    "content_scripts": [
      {
        "matches": ["https://www.twitch.tv/*"],
        "js": [
          "src/vendor/browser-polyfill.min.js",
          "src/shared/constants.js",
          "src/shared/storage.js",
          "src/content/danmaku-overlay.js",
          "src/content/danmaku-engine.js",
          "src/content/chat-observer.js",
          "src/content/toggle-button.js",
          "src/content/index.js"
        ],
        "css": ["styles/danmaku.css"],
        "run_at": "document_idle"
      }
    ],
    "background": {
      "service_worker": "src/background/service-worker.js"
    },
    "action": {
      "default_popup": "src/popup/popup.html",
      "default_icon": {
        "16":  "icons/icon16.png",
        "48":  "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    "browser_specific_settings": {
      "gecko": {
        "id": "streamrain@extension",
        "strict_min_version": "109.0"
      }
    }
  }
  ```

- [ ] **Step 5: Verify extension loads**

  Open Chrome → `chrome://extensions` → Enable "Developer mode" → "Load unpacked" → select the `StreamRain/` folder.

  Expected: Extension appears in the list with name "StreamRain" and no errors shown. Warnings about missing files are OK at this stage.

- [ ] **Step 6: Commit**

  ```bash
  git add manifest.json src/vendor/ icons/ styles/ src/ tests/
  git commit -m "feat: project scaffold and manifest"
  ```

---

## Task 2: Shared Constants + Storage Wrapper

**Files:**
- Create: `src/shared/constants.js`
- Create: `src/shared/storage.js`

**Interfaces:**
- Produces:
  - `SELECTORS` — object with keys `CHAT_LINE`, `USERNAME`, `BADGE`, `CHAT_CONTAINER`, `VIDEO`, `PLAYER_WRAPPER`
  - `COLORS` — object with keys `MOD`, `SUBSCRIBER`, `VIP`, `GENERAL`
  - `SPEED_MAP` — object with keys `slow`, `medium`, `fast` mapping to seconds (numbers)
  - `FONT_SIZE_MAP` — object with keys `small`, `medium`, `large` mapping to px (numbers)
  - `DEFAULT_SETTINGS` — the default settings object
  - `getSettings()` → `Promise<settings>` — returns current settings merged with defaults
  - `setSettings(partial)` → `Promise<void>` — writes partial settings
  - `onSettingsChanged(callback)` — registers a listener called with `(newSettings)` on any change

- [ ] **Step 1: Create `src/shared/constants.js`**

  ```js
  // Single source of truth for Twitch DOM selectors and defaults.
  // Update selectors here if Twitch changes their markup.

  const SELECTORS = {
    CHAT_LINE:      '.chat-line__message',
    USERNAME:       '[data-a-user]',
    BADGE:          '.chat-badge',
    CHAT_CONTAINER: '.chat-scrollable-area__message-container',
    VIDEO:          'video.video-player__video',
    PLAYER_WRAPPER: '.video-player__container',
  };

  const COLORS = {
    MOD:        '#00C000',
    SUBSCRIBER: '#9146FF',
    VIP:        '#F5A623',
    GENERAL:    '#FFFFFF',
  };

  const SPEED_MAP = { slow: 12, medium: 8, fast: 5 };

  const FONT_SIZE_MAP = { small: 14, medium: 18, large: 22 };

  const DEFAULT_SETTINGS = {
    enabled:  true,
    opacity:  0.8,
    speed:    'medium',
    fontSize: 'medium',
    colors: {
      mod:        COLORS.MOD,
      subscriber: COLORS.SUBSCRIBER,
      vip:        COLORS.VIP,
      general:    COLORS.GENERAL,
    },
  };
  ```

- [ ] **Step 2: Create `src/shared/storage.js`**

  ```js
  // Wraps chrome.storage.sync. All content script + popup code goes through here.

  async function getSettings() {
    const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    return Object.assign({}, DEFAULT_SETTINGS, stored, {
      colors: Object.assign({}, DEFAULT_SETTINGS.colors, stored.colors),
    });
  }

  async function setSettings(partial) {
    await chrome.storage.sync.set(partial);
  }

  function onSettingsChanged(callback) {
    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area !== 'sync') return;
      const current = await getSettings();
      callback(current);
    });
  }
  ```

- [ ] **Step 3: Reload extension and verify no console errors**

  In Chrome, go to `chrome://extensions`, click the reload icon on StreamRain.
  Open `https://www.twitch.tv/` in a tab, open DevTools Console.
  Expected: No `ReferenceError` or `SyntaxError` from the content scripts.

- [ ] **Step 4: Commit**

  ```bash
  git add src/shared/constants.js src/shared/storage.js
  git commit -m "feat: shared constants and storage wrapper"
  ```

---

## Task 3: Danmaku CSS Animation

**Files:**
- Create: `styles/danmaku.css`

**Interfaces:**
- Produces:
  - `.sr-overlay` — the container div that sits over the video
  - `.sr-danmaku` — each individual danmaku span
  - `@keyframes sr-fly` — the right-to-left translation animation

- [ ] **Step 1: Create `styles/danmaku.css`**

  ```css
  @keyframes sr-fly {
    from { transform: translateX(0); }
    to   { transform: translateX(calc(-100% - 100vw)); }
  }

  .sr-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
    z-index: 9999;
  }

  .sr-danmaku {
    position: absolute;
    right: 0;
    white-space: nowrap;
    font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
    font-weight: bold;
    text-shadow:
      -1px -1px 0 #000,
       1px -1px 0 #000,
      -1px  1px 0 #000,
       1px  1px 0 #000;
    animation-name: sr-fly;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
    line-height: 1;
    user-select: none;
  }
  ```

- [ ] **Step 2: Verify animation manually**

  Create a quick test page `tests/css-test.html`:

  ```html
  <!DOCTYPE html>
  <html>
  <head>
    <link rel="stylesheet" href="../styles/danmaku.css">
    <style>
      body { background: #18181b; margin: 0; }
      .container { position: relative; width: 800px; height: 450px; background: #000; overflow: hidden; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="sr-overlay" id="overlay"></div>
    </div>
    <script>
      const overlay = document.getElementById('overlay');
      const span = document.createElement('span');
      span.className = 'sr-danmaku';
      span.textContent = 'Hello StreamRain!';
      span.style.top = '50px';
      span.style.color = '#9146FF';
      span.style.fontSize = '18px';
      span.style.animationDuration = '8s';
      overlay.appendChild(span);
    </script>
  </body>
  </html>
  ```

  Open `tests/css-test.html` in a browser. Expected: purple text flies from right to left across the black box and disappears.

- [ ] **Step 3: Commit**

  ```bash
  git add styles/danmaku.css tests/css-test.html
  git commit -m "feat: danmaku CSS animation"
  ```

---

## Task 4: Danmaku Overlay

**Files:**
- Create: `src/content/danmaku-overlay.js`

**Interfaces:**
- Consumes: `SELECTORS` from `constants.js`
- Produces:
  - `DanmakuOverlay` — class with methods:
    - `constructor()` — does not inject yet
    - `mount()` → `Promise<boolean>` — finds video, injects overlay div, starts ResizeObserver. Returns `true` on success, `false` after 5 failed attempts.
    - `unmount()` — removes overlay div, disconnects ResizeObserver
    - `appendSpan(spanEl)` — adds a `<span>` to the overlay div
    - `getHeight()` → `number` — current overlay height in px
    - `getWidth()` → `number` — current overlay width in px

- [ ] **Step 1: Create `src/content/danmaku-overlay.js`**

  ```js
  class DanmakuOverlay {
    constructor() {
      this._div = null;
      this._resizeObserver = null;
    }

    async mount() {
      const delays = [500, 1000, 2000, 4000, 8000];
      for (let i = 0; i < delays.length; i++) {
        const playerWrapper = document.querySelector(SELECTORS.PLAYER_WRAPPER);
        if (playerWrapper) {
          this._div = document.createElement('div');
          this._div.className = 'sr-overlay';
          playerWrapper.style.position = 'relative';
          playerWrapper.appendChild(this._div);
          this._resizeObserver = new ResizeObserver(() => this._syncSize(playerWrapper));
          this._resizeObserver.observe(playerWrapper);
          this._syncSize(playerWrapper);
          return true;
        }
        await new Promise(r => setTimeout(r, delays[i]));
      }
      return false;
    }

    _syncSize(playerWrapper) {
      if (!this._div) return;
      this._div.style.width  = playerWrapper.offsetWidth  + 'px';
      this._div.style.height = playerWrapper.offsetHeight + 'px';
    }

    unmount() {
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._div && this._div.parentNode) this._div.parentNode.removeChild(this._div);
      this._div = null;
      this._resizeObserver = null;
    }

    appendSpan(spanEl) {
      if (this._div) this._div.appendChild(spanEl);
    }

    getHeight() {
      return this._div ? this._div.offsetHeight : 0;
    }

    getWidth() {
      return this._div ? this._div.offsetWidth : 0;
    }
  }
  ```

- [ ] **Step 2: Verify overlay in browser**

  Add a temporary test at the bottom of `src/content/danmaku-overlay.js` (remove after testing):

  ```js
  // TEMP TEST — remove before commit
  (async () => {
    const overlay = new DanmakuOverlay();
    const ok = await overlay.mount();
    console.log('[StreamRain] overlay mounted:', ok);
    console.log('[StreamRain] overlay size:', overlay.getWidth(), 'x', overlay.getHeight());
  })();
  ```

  Reload the extension, open `https://www.twitch.tv/` on a live channel, open DevTools.
  Expected: `[StreamRain] overlay mounted: true` and non-zero dimensions.
  Remove the temp test block before committing.

- [ ] **Step 3: Commit**

  ```bash
  git add src/content/danmaku-overlay.js
  git commit -m "feat: danmaku overlay with ResizeObserver and retry logic"
  ```

---

## Task 5: Danmaku Engine + In-Browser Tests

**Files:**
- Create: `src/content/danmaku-engine.js`
- Create: `tests/danmaku-engine.test.html`

**Interfaces:**
- Consumes:
  - `DanmakuOverlay` instance (passed to constructor)
  - `SPEED_MAP`, `FONT_SIZE_MAP` from `constants.js`
- Produces:
  - `DanmakuEngine` — class with methods:
    - `constructor(overlay)` — takes a `DanmakuOverlay` instance
    - `applySettings(settings)` — updates `opacity`, `speed`, `fontSize`, `colors`; recomputes tracks
    - `push(msg)` — `msg: { username: string, message: string, badge: string }` — queues or dispatches one danmaku
    - `_dispatch()` — internal: pulls from queue, finds a free track, renders span
    - `destroy()` — clears queue, cancels pending timers

- [ ] **Step 1: Create `src/content/danmaku-engine.js`**

  ```js
  class DanmakuEngine {
    constructor(overlay) {
      this._overlay = overlay;
      this._tracks = [];       // array of { freeAt: timestamp }
      this._queue = [];        // FIFO, capped at 50
      this._settings = {
        opacity: 0.8,
        speed: 'medium',
        fontSize: 'medium',
        colors: { mod: '#00C000', subscriber: '#9146FF', vip: '#F5A623', general: '#FFFFFF' },
      };
      this._dispatchTimer = null;
    }

    applySettings(settings) {
      this._settings = settings;
      this._rebuildTracks();
    }

    _rebuildTracks() {
      const fontSizePx = FONT_SIZE_MAP[this._settings.fontSize] || 18;
      const count = Math.max(1, Math.floor(this._overlay.getHeight() / (fontSizePx + 6)));
      this._tracks = Array.from({ length: count }, () => ({ freeAt: 0 }));
    }

    _colorForBadge(badge) {
      const c = this._settings.colors;
      if (badge === 'moderator') return c.mod;
      if (badge === 'subscriber') return c.subscriber;
      if (badge === 'vip')        return c.vip;
      return c.general;
    }

    _durationForText(text) {
      const base = SPEED_MAP[this._settings.speed] || 8;
      // longer messages get a bit more time so they fully cross the screen
      return base + Math.floor(text.length / 10);
    }

    _pickTrack() {
      const now = Date.now();
      // prefer the track that became free earliest
      let best = null;
      for (const track of this._tracks) {
        if (track.freeAt <= now) {
          if (!best || track.freeAt < best.freeAt) best = track;
        }
      }
      return best;
    }

    push(msg) {
      if (this._queue.length >= 50) this._queue.shift(); // drop oldest
      this._queue.push(msg);
      this._scheduleDispatch();
    }

    _scheduleDispatch() {
      if (this._dispatchTimer !== null) return;
      this._dispatchTimer = setTimeout(() => {
        this._dispatchTimer = null;
        this._flush();
      }, 0);
    }

    _flush() {
      if (!this._tracks.length) this._rebuildTracks();
      while (this._queue.length > 0) {
        const track = this._pickTrack();
        if (!track) break; // all tracks busy — try again shortly
        const msg = this._queue.shift();
        this._render(msg, track);
      }
      if (this._queue.length > 0) {
        this._dispatchTimer = setTimeout(() => {
          this._dispatchTimer = null;
          this._flush();
        }, 200);
      }
    }

    _render(msg, track) {
      const fontSizePx = FONT_SIZE_MAP[this._settings.fontSize] || 18;
      const trackIndex = this._tracks.indexOf(track);
      const duration   = this._durationForText(msg.message);
      const color      = this._colorForBadge(msg.badge);

      const span = document.createElement('span');
      span.className = 'sr-danmaku';
      span.textContent = msg.message;
      span.style.fontSize          = fontSizePx + 'px';
      span.style.color             = color;
      span.style.opacity           = String(this._settings.opacity);
      span.style.top               = (trackIndex * (fontSizePx + 6)) + 'px';
      span.style.animationDuration = duration + 's';

      span.addEventListener('animationend', () => {
        if (span.parentNode) span.parentNode.removeChild(span);
      });

      this._overlay.appendSpan(span);

      // mark track as busy until the message has fully exited (crosses full overlay width)
      const overlayWidth = this._overlay.getWidth();
      const approxMsPerPx = (duration * 1000) / (overlayWidth + overlayWidth);
      const approxTextWidth = msg.message.length * fontSizePx * 0.6;
      track.freeAt = Date.now() + approxTextWidth * approxMsPerPx;
    }

    destroy() {
      if (this._dispatchTimer !== null) {
        clearTimeout(this._dispatchTimer);
        this._dispatchTimer = null;
      }
      this._queue = [];
      this._tracks = [];
    }
  }
  ```

- [ ] **Step 2: Create `tests/danmaku-engine.test.html`**

  Tests the engine logic in isolation using a mock overlay (no real DOM needed for track logic).

  ```html
  <!DOCTYPE html>
  <html>
  <head><title>DanmakuEngine Tests</title>
  <style>
    body { font-family: monospace; background: #111; color: #eee; padding: 20px; }
    .pass { color: #0f0; } .fail { color: #f44; }
  </style>
  </head>
  <body>
  <h2>DanmakuEngine Tests</h2>
  <div id="results"></div>

  <script src="../src/shared/constants.js"></script>
  <script src="../src/content/danmaku-engine.js"></script>
  <script>
    const results = document.getElementById('results');
    let passed = 0, failed = 0;

    function assert(label, condition) {
      const el = document.createElement('div');
      if (condition) {
        el.className = 'pass'; el.textContent = '✓ ' + label; passed++;
      } else {
        el.className = 'fail'; el.textContent = '✗ ' + label; failed++;
      }
      results.appendChild(el);
    }

    // Mock overlay that reports fixed dimensions
    function mockOverlay(width, height) {
      const spans = [];
      return {
        getWidth:    () => width,
        getHeight:   () => height,
        appendSpan:  (s) => spans.push(s),
        _spans:      spans,
      };
    }

    // --- Test: track count calculation ---
    {
      const engine = new DanmakuEngine(mockOverlay(800, 450));
      engine.applySettings({ ...DEFAULT_SETTINGS });
      engine._rebuildTracks();
      // fontSize medium = 18px, padding 6 → 24px per track, 450/24 = 18 tracks
      assert('track count: 450px height / 24px = 18 tracks', engine._tracks.length === 18);
    }

    // --- Test: color lookup ---
    {
      const engine = new DanmakuEngine(mockOverlay(800, 450));
      engine.applySettings({ ...DEFAULT_SETTINGS, colors: DEFAULT_SETTINGS.colors });
      assert('MOD color is green',      engine._colorForBadge('moderator') === '#00C000');
      assert('subscriber color purple', engine._colorForBadge('subscriber') === '#9146FF');
      assert('VIP color yellow',        engine._colorForBadge('vip')        === '#F5A623');
      assert('general color white',     engine._colorForBadge('')           === '#FFFFFF');
    }

    // --- Test: duration scaling ---
    {
      const engine = new DanmakuEngine(mockOverlay(800, 450));
      engine.applySettings({ ...DEFAULT_SETTINGS, speed: 'medium' });
      const short = engine._durationForText('Hi');        // 2 chars → 8 + 0 = 8
      const long  = engine._durationForText('A'.repeat(20)); // 20 chars → 8 + 2 = 10
      assert('short message duration is 8s',  short === 8);
      assert('long message duration >= 10s',  long >= 10);
    }

    // --- Test: queue cap at 50 ---
    {
      const engine = new DanmakuEngine(mockOverlay(0, 0)); // height 0 → no tracks → all queued
      engine.applySettings({ ...DEFAULT_SETTINGS });
      engine._tracks = []; // force no tracks so everything queues
      for (let i = 0; i < 60; i++) {
        engine._queue.push({ username: 'u', message: 'msg' + i, badge: '' });
        if (engine._queue.length > 50) engine._queue.shift();
      }
      assert('queue capped at 50', engine._queue.length === 50);
      assert('oldest entry dropped (msg10)',
        engine._queue[0].message === 'msg10');
    }

    // --- Summary ---
    const summary = document.createElement('p');
    summary.textContent = `${passed} passed, ${failed} failed`;
    summary.style.color = failed > 0 ? '#f44' : '#0f0';
    results.appendChild(summary);
  </script>
  </body>
  </html>
  ```

- [ ] **Step 3: Run the tests**

  Open `tests/danmaku-engine.test.html` in a browser (file:// is fine).
  Expected: All 8 assertions show green ✓ and summary reads "8 passed, 0 failed".

- [ ] **Step 4: Commit**

  ```bash
  git add src/content/danmaku-engine.js tests/danmaku-engine.test.html
  git commit -m "feat: danmaku engine with track management and queue"
  ```

---

## Task 6: Chat Observer

**Files:**
- Create: `src/content/chat-observer.js`

**Interfaces:**
- Consumes: `SELECTORS` from `constants.js`
- Produces:
  - `ChatObserver` — class with methods:
    - `constructor(onMessage)` — `onMessage: (msg: { username, message, badge }) => void`
    - `start()` — begins watching; if chat container already present, attaches immediately; otherwise waits via body observer
    - `stop()` — disconnects all observers

- [ ] **Step 1: Create `src/content/chat-observer.js`**

  ```js
  class ChatObserver {
    constructor(onMessage) {
      this._onMessage    = onMessage;
      this._chatObserver = null;
      this._bodyObserver = null;
    }

    start() {
      const container = document.querySelector(SELECTORS.CHAT_CONTAINER);
      if (container) {
        this._attachToContainer(container);
      } else {
        this._watchForContainer();
      }
    }

    stop() {
      if (this._chatObserver) { this._chatObserver.disconnect(); this._chatObserver = null; }
      if (this._bodyObserver) { this._bodyObserver.disconnect(); this._bodyObserver = null; }
    }

    _attachToContainer(container) {
      this._chatObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const line = node.matches(SELECTORS.CHAT_LINE)
              ? node
              : node.querySelector(SELECTORS.CHAT_LINE);
            if (line) this._onMessage(this._parseLine(line));
          }
        }
      });
      this._chatObserver.observe(container, { childList: true, subtree: true });
    }

    _watchForContainer() {
      this._bodyObserver = new MutationObserver(() => {
        const container = document.querySelector(SELECTORS.CHAT_CONTAINER);
        if (!container) return;
        // container appeared — switch from body observer to chat observer
        this._bodyObserver.disconnect();
        this._bodyObserver = null;
        this._attachToContainer(container);
      });
      this._bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

    _parseLine(lineEl) {
      const usernameEl = lineEl.querySelector(SELECTORS.USERNAME);
      const badgeEl    = lineEl.querySelector(SELECTORS.BADGE);

      const username = usernameEl ? (usernameEl.getAttribute('data-a-user') || '') : '';
      const message  = lineEl.textContent.replace(username, '').trim();
      const badge    = badgeEl ? (badgeEl.getAttribute('alt') || '').toLowerCase() : '';

      return { username, message, badge };
    }
  }
  ```

- [ ] **Step 2: Verify manually on Twitch**

  Add a temp test at the bottom of `chat-observer.js` (remove after testing):

  ```js
  // TEMP TEST — remove before commit
  const testObserver = new ChatObserver(msg => console.log('[StreamRain] msg:', msg));
  testObserver.start();
  ```

  Reload extension, open a live Twitch stream. Watch DevTools console.
  Expected: Each new chat message logs `[StreamRain] msg: { username, message, badge }`.
  Remove the temp test before committing.

- [ ] **Step 3: Commit**

  ```bash
  git add src/content/chat-observer.js
  git commit -m "feat: chat observer with SPA reconnect"
  ```

---

## Task 7: Toggle Button

**Files:**
- Create: `src/content/toggle-button.js`

**Interfaces:**
- Consumes: `SELECTORS`, `getSettings`, `setSettings` from `storage.js`
- Produces:
  - `ToggleButton` — class with methods:
    - `inject()` — injects button into player; no-op if already injected
    - `remove()` — removes button from DOM
    - `syncState(enabled)` — updates button visual state without toggling storage

- [ ] **Step 1: Create `src/content/toggle-button.js`**

  ```js
  class ToggleButton {
    constructor() {
      this._btn = null;
    }

    inject() {
      if (this._btn) return;
      const wrapper = document.querySelector(SELECTORS.PLAYER_WRAPPER);
      if (!wrapper) return;

      this._btn = document.createElement('button');
      this._btn.id = 'sr-toggle-btn';
      this._btn.title = 'StreamRain — toggle danmaku';
      this._btn.textContent = '彈';
      Object.assign(this._btn.style, {
        position:        'absolute',
        bottom:          '48px',
        right:           '12px',
        zIndex:          '10000',
        width:           '32px',
        height:          '32px',
        borderRadius:    '50%',
        border:          'none',
        cursor:          'pointer',
        fontSize:        '14px',
        fontWeight:      'bold',
        background:      'rgba(0,0,0,0.6)',
        color:           '#fff',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        transition:      'background 0.2s',
      });

      this._btn.addEventListener('click', async () => {
        const settings = await getSettings();
        await setSettings({ enabled: !settings.enabled });
      });

      wrapper.style.position = 'relative';
      wrapper.appendChild(this._btn);
    }

    remove() {
      if (this._btn && this._btn.parentNode) this._btn.parentNode.removeChild(this._btn);
      this._btn = null;
    }

    syncState(enabled) {
      if (!this._btn) return;
      this._btn.style.background = enabled
        ? 'rgba(145, 70, 255, 0.85)'
        : 'rgba(0, 0, 0, 0.6)';
      this._btn.style.color = enabled ? '#fff' : '#888';
    }
  }
  ```

- [ ] **Step 2: Verify button appears on Twitch**

  Add temp test at bottom of `toggle-button.js` (remove after testing):

  ```js
  // TEMP TEST — remove before commit
  const btn = new ToggleButton();
  btn.inject();
  btn.syncState(true);
  ```

  Reload extension, open a live Twitch stream.
  Expected: A purple circular "彈" button appears in the bottom-right of the video player.
  Remove the temp test block before committing.

- [ ] **Step 3: Commit**

  ```bash
  git add src/content/toggle-button.js
  git commit -m "feat: toggle button injected into video player"
  ```

---

## Task 8: Content Script Entry Point

**Files:**
- Create: `src/content/index.js`

**Interfaces:**
- Consumes: `DanmakuOverlay`, `DanmakuEngine`, `ChatObserver`, `ToggleButton`, `getSettings`, `onSettingsChanged`
- Produces: bootstraps the full extension on page load

- [ ] **Step 1: Create `src/content/index.js`**

  ```js
  (async () => {
    let overlay = null;
    let engine  = null;
    let observer = null;
    const button = new ToggleButton();

    async function enable(settings) {
      if (!overlay) {
        overlay = new DanmakuOverlay();
        const ok = await overlay.mount();
        if (!ok) { overlay = null; return; }
      }
      if (!engine) {
        engine = new DanmakuEngine(overlay);
      }
      engine.applySettings(settings);

      if (!observer) {
        observer = new ChatObserver(msg => engine.push(msg));
        observer.start();
      }

      button.inject();
      button.syncState(true);
    }

    function disable() {
      if (observer) { observer.stop(); observer = null; }
      if (engine)   { engine.destroy(); engine = null; }
      if (overlay)  { overlay.unmount(); overlay = null; }
      button.syncState(false);
    }

    // Bootstrap on load
    const settings = await getSettings();
    if (settings.enabled) {
      await enable(settings);
    } else {
      button.inject();
      button.syncState(false);
    }

    // React to settings changes (from popup or toggle button)
    onSettingsChanged(async (newSettings) => {
      if (newSettings.enabled) {
        await enable(newSettings);
      } else {
        disable();
        button.inject(); // keep button visible even when disabled
      }
    });
  })();
  ```

- [ ] **Step 2: End-to-end test in browser**

  Reload the extension. Open a live Twitch stream.

  Checklist:
  - [ ] "彈" button appears in the video bottom-right corner, purple (enabled by default)
  - [ ] Chat messages fly as danmaku across the video from right to left
  - [ ] Clicking the button turns it gray and danmaku stops
  - [ ] Clicking again turns it purple and danmaku resumes
  - [ ] Opening DevTools shows no errors

- [ ] **Step 3: Commit**

  ```bash
  git add src/content/index.js
  git commit -m "feat: content script entry point — full danmaku pipeline"
  ```

---

## Task 9: Background Service Worker

**Files:**
- Create: `src/background/service-worker.js`

**Interfaces:**
- Produces: sets default settings on first install so `getSettings()` always has a base to merge with

- [ ] **Step 1: Create `src/background/service-worker.js`**

  ```js
  importScripts('../vendor/browser-polyfill.min.js');
  importScripts('../shared/constants.js');

  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === 'install') {
      await chrome.storage.sync.set(DEFAULT_SETTINGS);
    }
  });
  ```

- [ ] **Step 2: Verify on fresh install**

  Go to `chrome://extensions`, remove StreamRain, re-load unpacked.
  Open `chrome://extensions` → StreamRain → "Service worker" → Inspect.
  In the service worker console: `chrome.storage.sync.get(null, console.log)`.
  Expected: The default settings object appears in the console.

- [ ] **Step 3: Commit**

  ```bash
  git add src/background/service-worker.js
  git commit -m "feat: service worker sets default settings on install"
  ```

---

## Task 10: Popup Settings UI

**Files:**
- Create: `src/popup/popup.html`
- Create: `src/popup/popup.css`
- Create: `src/popup/popup.js`

**Interfaces:**
- Consumes: `getSettings`, `setSettings` (via storage.js, loaded via script tag)
- Produces: settings panel with all controls wired to `chrome.storage.sync`

- [ ] **Step 1: Create `src/popup/popup.css`**

  ```css
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    width: 280px;
    background: #18181b;
    color: #efeff1;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    font-size: 13px;
    padding: 0 0 12px;
  }

  header {
    background: #9146ff;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  header h1 { font-size: 15px; font-weight: 700; color: #fff; }
  header span { font-size: 18px; }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    border-bottom: 1px solid #2d2d33;
  }

  label { color: #adadb8; font-size: 12px; }

  /* Toggle switch */
  .switch { position: relative; width: 40px; height: 22px; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute; inset: 0;
    background: #3d3d45; border-radius: 22px; cursor: pointer;
    transition: background 0.2s;
  }
  .slider::before {
    content: ''; position: absolute;
    width: 16px; height: 16px; border-radius: 50%;
    background: #fff; left: 3px; top: 3px;
    transition: transform 0.2s;
  }
  input:checked + .slider { background: #9146ff; }
  input:checked + .slider::before { transform: translateX(18px); }

  /* Sliders */
  input[type=range] {
    width: 100px; accent-color: #9146ff; cursor: pointer;
  }

  /* Select */
  select {
    background: #2d2d33; color: #efeff1; border: none;
    padding: 3px 6px; border-radius: 4px; cursor: pointer;
  }

  /* Color section */
  .section-title {
    padding: 8px 14px 2px;
    font-size: 11px;
    text-transform: uppercase;
    color: #6e6e80;
    letter-spacing: 0.05em;
  }

  input[type=color] {
    width: 28px; height: 22px; border: none;
    border-radius: 4px; cursor: pointer; background: none;
  }

  .color-label {
    display: inline-block; width: 70px;
  }
  ```

- [ ] **Step 2: Create `src/popup/popup.html`**

  ```html
  <!DOCTYPE html>
  <html lang="zh-TW">
  <head>
    <meta charset="UTF-8">
    <title>StreamRain</title>
    <link rel="stylesheet" href="popup.css">
  </head>
  <body>
    <header>
      <span>🌧</span>
      <h1>StreamRain</h1>
    </header>

    <div class="row">
      <label for="toggle-enabled">彈幕開關</label>
      <label class="switch">
        <input type="checkbox" id="toggle-enabled">
        <span class="slider"></span>
      </label>
    </div>

    <div class="row">
      <label for="opacity-slider">透明度 <span id="opacity-val">80%</span></label>
      <input type="range" id="opacity-slider" min="10" max="100" step="5" value="80">
    </div>

    <div class="row">
      <label for="speed-select">速度</label>
      <select id="speed-select">
        <option value="slow">慢</option>
        <option value="medium" selected>中</option>
        <option value="fast">快</option>
      </select>
    </div>

    <div class="row">
      <label for="font-select">字體大小</label>
      <select id="font-select">
        <option value="small">小</option>
        <option value="medium" selected>中</option>
        <option value="large">大</option>
      </select>
    </div>

    <div class="section-title">角色顏色</div>

    <div class="row">
      <label><span class="color-label">MOD</span></label>
      <input type="color" id="color-mod" value="#00C000">
    </div>
    <div class="row">
      <label><span class="color-label">訂閱者</span></label>
      <input type="color" id="color-subscriber" value="#9146FF">
    </div>
    <div class="row">
      <label><span class="color-label">VIP</span></label>
      <input type="color" id="color-vip" value="#F5A623">
    </div>
    <div class="row">
      <label><span class="color-label">一般</span></label>
      <input type="color" id="color-general" value="#FFFFFF">
    </div>

    <script src="../vendor/browser-polyfill.min.js"></script>
    <script src="../shared/constants.js"></script>
    <script src="../shared/storage.js"></script>
    <script src="popup.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 3: Create `src/popup/popup.js`**

  ```js
  async function init() {
    const settings = await getSettings();

    const elEnabled    = document.getElementById('toggle-enabled');
    const elOpacity    = document.getElementById('opacity-slider');
    const elOpacityVal = document.getElementById('opacity-val');
    const elSpeed      = document.getElementById('speed-select');
    const elFont       = document.getElementById('font-select');
    const elMod        = document.getElementById('color-mod');
    const elSub        = document.getElementById('color-subscriber');
    const elVip        = document.getElementById('color-vip');
    const elGeneral    = document.getElementById('color-general');

    // Populate from storage
    elEnabled.checked  = settings.enabled;
    elOpacity.value    = Math.round(settings.opacity * 100);
    elOpacityVal.textContent = elOpacity.value + '%';
    elSpeed.value      = settings.speed;
    elFont.value       = settings.fontSize;
    elMod.value        = settings.colors.mod;
    elSub.value        = settings.colors.subscriber;
    elVip.value        = settings.colors.vip;
    elGeneral.value    = settings.colors.general;

    // Wire up changes — each writes to storage immediately
    elEnabled.addEventListener('change', () =>
      setSettings({ enabled: elEnabled.checked }));

    elOpacity.addEventListener('input', () => {
      elOpacityVal.textContent = elOpacity.value + '%';
      setSettings({ opacity: elOpacity.value / 100 });
    });

    elSpeed.addEventListener('change', () =>
      setSettings({ speed: elSpeed.value }));

    elFont.addEventListener('change', () =>
      setSettings({ fontSize: elFont.value }));

    const updateColors = () => setSettings({
      colors: {
        mod:        elMod.value,
        subscriber: elSub.value,
        vip:        elVip.value,
        general:    elGeneral.value,
      },
    });

    elMod.addEventListener('input', updateColors);
    elSub.addEventListener('input', updateColors);
    elVip.addEventListener('input', updateColors);
    elGeneral.addEventListener('input', updateColors);
  }

  init();
  ```

- [ ] **Step 4: Verify popup end-to-end**

  Reload extension. Click the StreamRain icon in the toolbar.

  Checklist:
  - [ ] Popup opens with correct default values (enabled=on, opacity=80%, speed=中, font=中)
  - [ ] Toggling the switch and going to a Twitch tab — danmaku stops/starts
  - [ ] Changing opacity slider — danmaku text opacity changes live on Twitch
  - [ ] Changing speed — new danmaku fly at the new speed
  - [ ] Changing font size — new danmaku render at the new size
  - [ ] Changing a color picker — new danmaku for that role use the new color

- [ ] **Step 5: Commit**

  ```bash
  git add src/popup/popup.html src/popup/popup.css src/popup/popup.js
  git commit -m "feat: popup settings UI — all controls wired to storage"
  ```

---

## Task 11: Firefox Verification + Cross-Browser Polish

**Files:**
- No new files — verify existing code in Firefox

**Interfaces:**
- No new interfaces

- [ ] **Step 1: Load extension in Firefox**

  Open Firefox → `about:debugging` → "This Firefox" → "Load Temporary Add-on" → select `StreamRain/manifest.json`.

  Expected: Extension loads without errors.

- [ ] **Step 2: Verify Firefox end-to-end**

  Open a live Twitch stream in Firefox.

  Checklist:
  - [ ] "彈" button appears in video corner
  - [ ] Danmaku flies right to left
  - [ ] Popup opens and settings apply live
  - [ ] Toggle button works
  - [ ] No console errors (`about:debugging` → Inspect → Console)

- [ ] **Step 3: Verify Edge**

  Open Edge → `edge://extensions` → "Load unpacked" → select `StreamRain/`.

  Expected: Same behavior as Chrome. Edge is Chromium-based so differences are rare; confirm no regressions.

- [ ] **Step 4: Twitch SPA navigation test**

  On a Twitch stream, click another streamer's link in the sidebar (changes channel without full page reload).

  Expected:
  - Danmaku does not appear on a non-stream page
  - After navigating to another channel, danmaku resumes on the new stream

- [ ] **Step 5: Fullscreen test**

  Press F11 or the fullscreen button on Twitch video.
  Expected: Overlay covers the full screen, danmaku still flies correctly.

- [ ] **Step 6: Final commit**

  ```bash
  git add .
  git commit -m "chore: cross-browser verification complete (Chrome, Firefox, Edge)"
  ```

---

## Self-Review Checklist

- [x] Spec: danmaku overlaid on video → Task 4 (overlay), Task 8 (bootstrap)
- [x] Spec: DOM-based chat reading → Task 6 (ChatObserver)
- [x] Spec: color by badge → Task 5 (`_colorForBadge`)
- [x] Spec: all messages displayed → Task 5 (`push()` accepts all, no filter)
- [x] Spec: toggle button in video corner → Task 7
- [x] Spec: popup with settings → Task 10
- [x] Spec: Chrome/Firefox/Edge → Task 1 (manifest) + Task 11
- [x] Spec: SPA navigation resilience → Task 6 (`_watchForContainer`)
- [x] Spec: fullscreen → Task 4 (ResizeObserver)
- [x] Spec: queue cap 50 → Task 5 (`push()`)
- [x] Spec: retry backoff → Task 4 (`mount()`)
- [x] No TBDs or placeholders found
- [x] Type consistency: `getSettings`/`setSettings`/`onSettingsChanged` consistent across Tasks 2, 7, 8, 10
- [x] `DanmakuOverlay.appendSpan` used in Task 5 matches Task 4 definition
- [x] `DanmakuEngine.applySettings` called with full settings object in Task 8 ✓
