const assert = require('assert');

global.DEFAULT_SETTINGS = {
  opacity: 0.8,
  speed: 'medium',
  fontSize: 'medium',
  colors: {
    mod: '#00C000',
    subscriber: '#9146FF',
    vip: '#F5A623',
    general: '#FFFFFF',
  },
};
global.SPEED_MAP = { slow: 12, medium: 8, fast: 5 };
global.FONT_SIZE_MAP = { small: 14, medium: 18, large: 22 };
global.EmoteCache = { sevenTv: {}, twitchUrl: id => `twitch:${id}` };

global.document = {
  createElement() {
    return {
      className: '',
      style: {
        setProperty(name, value) {
          this[name] = value;
        },
      },
      childNodes: [],
      parentNode: null,
      offsetWidth: 320,
      appendChild(child) {
        this.childNodes.push(child);
      },
      addEventListener() {},
    };
  },
  createTextNode(text) {
    return { text };
  },
};

const { DanmakuEngine } = require('../src/content/danmaku-engine.js');

const originalNow = Date.now;
Date.now = () => 1000;

try {
  const overlay = {
    getWidth: () => 800,
    getHeight: () => 450,
    appendSpan(span) {
      span.parentNode = this;
    },
  };

  const engine = new DanmakuEngine(overlay);
  engine.applySettings({ ...DEFAULT_SETTINGS });
  engine._render({ username: 'u', message: 'hi', badge: '', emotes: [] }, 0);

  const expectedWidth = 320;
  const duration = 8;
  const travelPx = 800 + expectedWidth;
  const msPerPx = (duration * 1000) / travelPx;
  const expectedFreeAt = 1000 + Math.max(500, expectedWidth * msPerPx);

  assert.strictEqual(engine._tracks[0].freeAt, expectedFreeAt);
} finally {
  Date.now = originalNow;
}

console.log('ok');
