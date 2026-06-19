// DanmakuEngine — consumes a DanmakuOverlay instance and manages a scrolling
// danmaku track system. Depends on SPEED_MAP, FONT_SIZE_MAP from constants.js.
// Loaded as a content script after danmaku-overlay.js.

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
