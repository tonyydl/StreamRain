const assert = require('assert');
const { createDebouncedSettingsWriter } = require('../src/popup/popup.js');

(async () => {
  const writes = [];
  const writer = createDebouncedSettingsWriter((value) => {
    writes.push(value);
  }, 20);

  writer({ opacity: 0.1 });
  writer({ opacity: 0.2 });
  writer({ opacity: 0.3 });

  assert.deepStrictEqual(writes, []);

  await new Promise(resolve => setTimeout(resolve, 40));
  assert.deepStrictEqual(writes, [{ opacity: 0.3 }]);

  const mergedWrites = [];
  const mergingWriter = createDebouncedSettingsWriter((value) => {
    mergedWrites.push(value);
  }, 20);

  mergingWriter({ opacity: 0.4 });
  mergingWriter({ colors: { general: '#ffffff' } });

  await new Promise(resolve => setTimeout(resolve, 40));
  assert.deepStrictEqual(mergedWrites, [
    { opacity: 0.4, colors: { general: '#ffffff' } },
  ]);

  console.log('ok');
})();
