// Run: node test/emote-parse.test.js
const assert = require('assert');
const { parseTwitchEmotes } = require('../src/content/emotes.js');

assert.deepStrictEqual(
  parseTwitchEmotes('25:0-4,12-16/1902:6-10'),
  [
    { id: '25', start: 0, end: 4 },
    { id: '25', start: 12, end: 16 },
    { id: '1902', start: 6, end: 10 },
  ],
);
assert.deepStrictEqual(parseTwitchEmotes(''), []);
assert.deepStrictEqual(parseTwitchEmotes(undefined), []);
assert.deepStrictEqual(parseTwitchEmotes('555555584:0-2'), [{ id: '555555584', start: 0, end: 2 }]);

console.log('ok');
