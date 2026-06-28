const assert = require('assert');

global.DEFAULT_SETTINGS = {
  opacity: 0.8,
  speed: 'medium',
  fontSize: 'medium',
  density: 'medium',
  displayRange: 'threeQuarter',
  colors: {
    mod: '#00C000',
    subscriber: '#9146FF',
    vip: '#F5A623',
    general: '#FFFFFF',
  },
};
global.SPEED_MAP = { slow: 12, medium: 8, fast: 5 };
global.FONT_SIZE_MAP = { small: 14, medium: 18, large: 22 };
global.DENSITY_MAP = {
  low: { queueLimit: 20 },
  medium: { queueLimit: 50 },
  high: { queueLimit: 100 },
};
global.DISPLAY_RANGE_MAP = {
  half: 0.5,
  threeQuarter: 0.75,
  full: 1,
};
global.EmoteCache = { sevenTv: {}, twitchUrl: id => `twitch:${id}` };

global.document = {
  createElement() {
    return {
      className: '',
      style: { setProperty() {} },
      appendChild() {},
      addEventListener() {},
    };
  },
  createTextNode(text) {
    return { text };
  },
};

const { DanmakuEngine } = require('../src/content/danmaku-engine.js');

function mockOverlay() {
  return {
    getWidth: () => 0,
    getHeight: () => 450,
    appendSpan() {},
  };
}

{
  const engine = new DanmakuEngine(mockOverlay());
  engine.applySettings({ ...DEFAULT_SETTINGS, density: 'low', displayRange: 'full' });
  for (let i = 0; i < 30; i++) {
    engine.push({ username: 'u', message: 'msg' + i, badge: '', emotes: [] });
  }
  assert.strictEqual(engine._queue.length, 20);
  assert.strictEqual(engine._queue[0].message, 'msg10');
  engine.destroy();
}

{
  const engine = new DanmakuEngine(mockOverlay());
  engine.applySettings({ ...DEFAULT_SETTINGS, density: 'high', displayRange: 'full' });
  for (let i = 0; i < 110; i++) {
    engine.push({ username: 'u', message: 'msg' + i, badge: '', emotes: [] });
  }
  assert.strictEqual(engine._queue.length, 100);
  assert.strictEqual(engine._queue[0].message, 'msg10');
  engine.destroy();
}

{
  const engine = new DanmakuEngine(mockOverlay());
  engine.applySettings({ ...DEFAULT_SETTINGS, density: 'high', displayRange: 'half' });
  engine._rebuildTracks();
  assert.strictEqual(engine._usableTrackCount(), 8);
}

{
  const engine = new DanmakuEngine(mockOverlay());
  engine.applySettings({ ...DEFAULT_SETTINGS, density: 'low', displayRange: 'full' });
  engine._rebuildTracks();
  assert.strictEqual(engine._usableTrackCount(), 15);
}

console.log('ok');
