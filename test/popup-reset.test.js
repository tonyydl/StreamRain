const assert = require('assert');
const { createResetSettings } = require('../src/popup/popup.js');

const defaults = {
  enabled: true,
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

const reset = createResetSettings(defaults);

assert.deepStrictEqual(reset, defaults);
assert.notStrictEqual(reset, defaults);
assert.notStrictEqual(reset.colors, defaults.colors);

console.log('ok');
