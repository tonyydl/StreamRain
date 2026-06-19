// DanmakuEngine — consumes a DanmakuOverlay instance and manages a scrolling
// danmaku track system. Depends on SPEED_MAP, FONT_SIZE_MAP from constants.js.
// Loaded as a content script after danmaku-overlay.js.

class DanmakuEngine {
  constructor(overlay) {
    this._overlay = overlay;
    this._tracks = [];       // array of { freeAt: timestamp, index: number }
    this._queue = [];        // FIFO, capped at 50
    this._settings = {
      opacity: 0.8,
      speed: 'medium',
      fontSize: 'medium',
      colors: { mod: '#00C000', subscriber: '#9146FF', vip: '#F5A623', general: '#FFFFFF' },
    };
    this._fontSizePx = 18;   // cached from FONT_SIZE_MAP; updated in _rebuildTracks
    this._dispatchTimer = null;
  }

  applySettings(settings) {
    this._settings = {
      ...this._settings,
      ...settings,
      colors: { ...this._settings.colors, ...(settings.colors || {}) },
    };
    this._rebuildTracks();
  }

  _rebuildTracks() {
    this._fontSizePx = FONT_SIZE_MAP[this._settings.fontSize] || 18;
    const trackHeight = this._fontSizePx + 6;
    const count = Math.max(1, Math.floor(this._overlay.getHeight() / trackHeight));
    this._tracks = Array.from({ length: count }, (_, i) => ({ freeAt: 0, index: i }));
  }

  _colorForBadge(badge) {
    const c = this._settings.colors;
    if (badge === 'moderator')  return c.mod;
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
    span.textContent = msg.message;
    span.style.fontSize          = fontSizePx + 'px';
    span.style.color             = color;
    span.style.opacity           = String(this._settings.opacity);
    span.style.top               = (trackIndex * (fontSizePx + 6)) + 'px';
    span.style.animationDuration = duration + 's';

    span.addEventListener('animationend', () => {
      if (span.parentNode) span.parentNode.removeChild(span);
    });

    // guard: if the overlay has no width yet, skip rendering to avoid garbage freeAt
    const overlayWidth = this._overlay.getWidth();
    if (overlayWidth <= 0) return;

    this._overlay.appendSpan(span);

    // mark track busy for the full animation duration — the leading edge of the
    // message takes exactly `duration` seconds to traverse the overlay width
    track.freeAt = Date.now() + (duration * 1000);
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
