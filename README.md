# 🌧 StreamRain

> Turn Twitch chat into danmaku (bullet comments) flowing right-to-left across the video.

**English** | [中文](#-streamrain-中文)

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

---
---

# 🌧 StreamRain (中文)

> 把 Twitch 聊天室變成由右向左流動的彈幕，直接疊在直播畫面上。

[English](#-streamrain) | **中文**

StreamRain 是一個跨瀏覽器擴充套件（Chrome / Edge / Firefox），會把 Twitch
聊天室以彈幕形式疊在直播畫面上，並依發言者身分自動分色。播放器角落有開關按鈕，
彈出視窗則提供細部外觀設定。

---

## 功能特色

- **彈幕浮層** —— 聊天訊息由右向左滑過畫面，自動分軌避免重疊。
- **身分分色** —— 板主/實況主＝綠、訂閱者＝紫、VIP＝黃、其他＝白。顏色皆可自訂。
- **顯示所有訊息** —— 不做任何過濾。
- **播放器內開關** —— 右下角的 `彈` 按鈕可即時開關彈幕。
- **彈出視窗設定** —— 透明度、速度（慢/中/快）、字體大小（小/中/大）、各身分顏色，並透過 `storage.sync` 在你的瀏覽器間同步。
- **不受聊天擴充影響** —— 無論有沒有裝 7TV / BTTV / FFZ 都能正常運作（見 [運作原理](#運作原理)）。

---

## 安裝（開發者模式 / 未封裝）

目前尚未上架商店，請手動載入。

### Chrome / Edge

1. 開啟 `chrome://extensions`（或 `edge://extensions`）。
2. 開啟右上角的**開發人員模式**。
3. 點**載入未封裝項目**，選擇 `StreamRain` 資料夾。
4. 打開任一 Twitch 直播 —— 播放器右下角會出現 `彈` 按鈕。

### Firefox

> ⚠️ **尚未在 Firefox 實測。** API 層已做好跨瀏覽器準備（使用
> `webextension-polyfill` 及 promise 式的 `browser.*`），但 MV3 的 background
> 設定可能仍需針對 Firefox 調整。Firefox 支援目前視為實驗性。

1. 開啟 `about:debugging#/runtime/this-firefox`。
2. 點**載入暫時附加元件**，選擇 `StreamRain/manifest.json`。

---

## 使用方式

- **開關彈幕：** 點播放器右下角的 `彈` 按鈕，或用彈出視窗的開關。
- **調整外觀：** 點工具列上的 StreamRain 圖示開啟彈出視窗：
  - **彈幕開關** —— 主開關
  - **透明度** —— 10%～100%
  - **速度** —— 慢 / 中 / 快
  - **字體大小** —— 小 / 中 / 大
  - **角色顏色** —— MOD / 訂閱者 / VIP / 一般

所有變更即時生效。

---

## 運作原理

StreamRain 不去抓聊天室的 DOM（因為像 7TV 這類擴充會把 Twitch 的聊天渲染器
整個換掉，導致抓不到訊息），而是直接連到 Twitch 公開的**匿名 IRC-over-WebSocket**
閘道（`wss://irc-ws.chat.twitch.tv:443`）—— 也就是官方網頁自己用的同一個來源。
它以匿名 `justinfan` 使用者唯讀加入當前頻道，並解析每則訊息的 IRCv3 標籤來判斷
發言者身分。

因此不論你用哪種聊天前端，彈幕都能正常顯示，也不受 Twitch 改版影響。

---

## 隱私

- **唯讀且匿名。** StreamRain 以匿名觀眾身分加入聊天室，不會發言、不會登入、不傳送你的身分。
- **不連任何外部伺服器。** 只與 Twitch 通訊，沒有 StreamRain 後端、沒有分析或遙測。
- **設定僅存於本機。** 你的偏好設定存在瀏覽器的 `storage.sync`，不會離開 Twitch 與你的瀏覽器同步機制。

---

## 專案結構

```
StreamRain/
├─ manifest.json              # MV3 manifest
├─ icons/                     # 16 / 48 / 128 px 圖示
├─ styles/danmaku.css         # 浮層與彈幕動畫
└─ src/
   ├─ vendor/                 # webextension-polyfill
   ├─ shared/                 # constants.js, storage.js
   ├─ content/                # 浮層、引擎、IRC 聊天來源、開關按鈕、啟動程式
   ├─ popup/                  # 設定介面
   └─ background/             # service worker（安裝時寫入預設值）
```

**技術：** Manifest V3、原生 JavaScript、CSS `@keyframes`，無需建置步驟。
