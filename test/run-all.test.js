const assert = require('assert');
const { TEST_FILES } = require('./run-all.js');

assert.ok(TEST_FILES.includes('chat-observer.test.js'));
assert.ok(TEST_FILES.includes('danmaku-density.test.js'));
assert.ok(TEST_FILES.includes('popup-markup.test.js'));
assert.ok(!TEST_FILES.includes('run-all.test.js'));

assert.deepStrictEqual([...TEST_FILES].sort(), TEST_FILES);

console.log('ok');
