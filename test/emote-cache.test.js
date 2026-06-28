const assert = require('assert');
const { EmoteCache } = require('../src/content/emotes.js');

(async () => {
  const originalFetch = global.fetch;
  try {
    EmoteCache.sevenTv = {};
    EmoteCache._loadedRoom = null;

    let failCalls = 0;
    global.fetch = async () => {
      failCalls++;
      throw new Error('network down');
    };

    await EmoteCache.loadForRoom('123');
    assert.strictEqual(failCalls, 2);
    assert.strictEqual(EmoteCache._loadedRoom, null);

    let successCalls = 0;
    global.fetch = async (url) => {
      successCalls++;
      if (String(url).includes('global')) {
        return {
          ok: true,
          json: async () => ({
            emotes: [{ name: 'Global', data: { host: { url: '//cdn.example/global' } } }],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          emote_set: {
            emotes: [{ name: 'Channel', data: { host: { url: '//cdn.example/channel' } } }],
          },
        }),
      };
    };

    await EmoteCache.loadForRoom('123');
    assert.strictEqual(successCalls, 2);
    assert.strictEqual(EmoteCache._loadedRoom, '123');
    assert.strictEqual(EmoteCache.sevenTv.Global, 'https://cdn.example/global/2x.webp');
    assert.strictEqual(EmoteCache.sevenTv.Channel, 'https://cdn.example/channel/2x.webp');
  } finally {
    global.fetch = originalFetch;
  }

  console.log('ok');
})();
