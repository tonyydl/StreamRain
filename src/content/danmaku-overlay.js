// DanmakuOverlay — mounts a position:absolute overlay div over the Twitch
// player wrapper and keeps it sized via ResizeObserver.
// Loaded as a content script; depends on SELECTORS from constants.js.

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
