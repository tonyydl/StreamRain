// ChatObserver — watches Twitch chat and fires onMessage for each new line.
// Depends on SELECTORS from constants.js (loaded before this file in manifest order).

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
      // Container appeared — switch from body observer to chat observer.
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
