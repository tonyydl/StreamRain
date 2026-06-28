const assert = require('assert');
const manifest = require('../manifest.json');

assert.deepStrictEqual(manifest.permissions, ['storage']);
assert.deepStrictEqual(manifest.host_permissions, [
  'https://www.twitch.tv/*',
  'https://7tv.io/*',
]);

console.log('ok');
