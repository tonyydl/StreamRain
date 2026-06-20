// DanmakuEngine — consumes a DanmakuOverlay instance and manages a scrolling
// danmaku track system. Depends on SPEED_MAP, FONT_SIZE_MAP from constants.js.
// Loaded as a content script after danmaku-overlay.js.

class DanmakuEngine {
  constructor(overlay) {
    this._overlay = overlay;
    this._tracks = [];       // array of { freeAt: timestamp, index: number }
    this._queue = [];        // FIFO, capped at 50
    this._settings = {
      opacity:  DEFAULT_SETTINGS.opacity,
      speed:    DEFAULT_SETTINGS.speed,
      fontSize: DEFAULT_SETTINGS.fontSize,
      colors:   { ...DEFAULT_SETTINGS.colors },
    };
    this._fontSizePx = 18;   // cached from FONT_SIZE_MAP; updated in _rebuildTracks
    this._dispatchTimer = null;
  }

  applySettings(settings) {
    const prevFontSize = this._settings.fontSize;
    this._settings = {
      ...this._settings,
      ...settings,
      colors: { ...this._settings.colors, ...(settings.colors || {}) },
    };
    if (this._settings.fontSize !== prevFontSize || this._tracks.length === 0) {
      this._rebuildTracks();
    }
  }

  _rebuildTracks() {
    this._fontSizePx = FONT_SIZE_MAP[this._settings.fontSize] || 18;
    // Tracks must fit emotes (taller than text) without overlapping neighbours.
    this._trackHeight = this._emoteHeight() + 6;
    const count = Math.max(1, Math.floor(this._overlay.getHeight() / this._trackHeight));
    this._tracks = Array.from({ length: count }, (_, i) => ({ freeAt: 0, index: i }));
  }

  _emoteHeight() {
    return Math.round(this._fontSizePx * 1.25);
  }

  _colorForBadge(badge) {
    const c = this._settings.colors;
    if (badge === 'moderator')          return c.mod;
    if (badge.includes('subscriber'))   return c.subscriber;
    if (badge === 'vip')                return c.vip;
    return c.general;
  }

  // Build span content: text with Twitch (by position range) and 7TV (by word)
  // emotes turned into <img>. Falls back to plain text when there are no emotes.
  _renderContent(span, msg, fontSizePx) {
    const map = EmoteCache.sevenTv;
    const emotes = (msg.emotes || []).slice().sort((a, b) => a.start - b.start);
    if (!emotes.length) {
      this._appendText(span, msg.message, map, fontSizePx);
      return;
    }
    // Twitch positions are codepoint indices — split accordingly, not by UTF-16 unit.
    const chars = Array.from(msg.message);
    let cursor = 0;
    for (const e of emotes) {
      if (e.start > cursor) {
        this._appendText(span, chars.slice(cursor, e.start).join(''), map, fontSizePx);
      }
      const code = chars.slice(e.start, e.end + 1).join('');
      span.appendChild(this._emoteImg(EmoteCache.twitchUrl(e.id), code, fontSizePx));
      cursor = e.end + 1;
    }
    if (cursor < chars.length) {
      this._appendText(span, chars.slice(cursor).join(''), map, fontSizePx);
    }
  }

  _appendText(span, text, map, fontSizePx) {
    if (!text) return;
    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;
      if (map[part]) span.appendChild(this._emoteImg(map[part], part, fontSizePx));
      else span.appendChild(document.createTextNode(part));
    }
  }

  _emoteImg(url, alt, fontSizePx) {
    const img = document.createElement('img');
    img.className = 'sr-emote';
    img.src = url;
    img.alt = alt;
    img.style.height = this._emoteHeight() + 'px';
    return img;
  }

  _durationForText(text) {
    const base = SPEED_MAP[this._settings.speed] || 8;
    // longer messages get a bit more time so they fully cross the screen
    return base + Math.floor(text.length / 10);
  }

  _pickTrack() {
    const now = Date.now();
    // prefer the track that became free earliest; return its index or -1
    let bestIdx = -1;
    for (let i = 0; i < this._tracks.length; i++) {
      if (this._tracks[i].freeAt <= now) {
        if (bestIdx === -1 || this._tracks[i].freeAt < this._tracks[bestIdx].freeAt) {
          bestIdx = i;
        }
      }
    }
    return bestIdx;
  }

  push(msg) {
    if (this._queue.length >= 50) this._queue.shift(); // drop oldest
    this._queue.push(msg);
    this._scheduleDispatch();
  }

  _scheduleDispatch(delay = 0) {
    if (this._dispatchTimer !== null) return;
    this._dispatchTimer = setTimeout(() => {
      this._dispatchTimer = null;
      this._flush();
    }, delay);
  }

  _flush() {
    if (!this._tracks.length) this._rebuildTracks();
    while (this._queue.length > 0) {
      const trackIdx = this._pickTrack();
      if (trackIdx === -1) break; // all tracks busy — try again shortly
      this._render(this._queue.shift(), trackIdx);
    }
    if (this._queue.length > 0) this._scheduleDispatch(200);
  }

  _render(msg, trackIndex) {
    const fontSizePx = this._fontSizePx;
    const track    = this._tracks[trackIndex];
    const duration = this._durationForText(msg.message);
    const color    = this._colorForBadge(msg.badge);

    const span = document.createElement('span');
    span.className = 'sr-danmaku';
    this._renderContent(span, msg, fontSizePx);
    span.style.fontSize          = fontSizePx + 'px';
    span.style.color             = color;
    span.style.opacity           = String(this._settings.opacity);
    span.style.top               = (trackIndex * this._trackHeight) + 'px';
    span.style.animationDuration = duration + 's';

    span.addEventListener('animationend', () => {
      if (span.parentNode) span.parentNode.removeChild(span);
    });

    // guard: if the overlay has no width yet, skip rendering to avoid garbage freeAt
    const overlayWidth = this._overlay.getWidth();
    if (overlayWidth <= 0) return;

    // Bug 1: set travel distance so the keyframe uses the actual overlay width
    span.style.setProperty('--sr-travel', overlayWidth + 'px');

    this._overlay.appendSpan(span);

    // Bug 5: mark the track free once the trailing edge of this message clears the
    // entry point (right edge of overlay) — not after the full animation
    const approxTextWidth = msg.message.length * fontSizePx * 0.6;
    const travelPx = overlayWidth + approxTextWidth;
    const msPerPx = (duration * 1000) / travelPx;
    const clearanceMs = Math.max(500, approxTextWidth * msPerPx);
    track.freeAt = Date.now() + clearanceMs;
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
