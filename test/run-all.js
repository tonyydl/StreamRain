const { spawnSync } = require('child_process');
const path = require('path');

const TEST_FILES = [
  'chat-observer.test.js',
  'danmaku-density.test.js',
  'danmaku-width.test.js',
  'emote-cache.test.js',
  'emote-parse.test.js',
  'manifest.test.js',
  'popup-debounce.test.js',
  'popup-markup.test.js',
].sort();

function runAll() {
  for (const file of TEST_FILES) {
    const fullPath = path.join(__dirname, file);
    console.log(`\n> node test\\${file}`);
    const result = spawnSync(process.execPath, [fullPath], { stdio: 'inherit' });
    if (result.status !== 0) {
      process.exitCode = result.status || 1;
      return;
    }
  }
}

if (require.main === module) {
  runAll();
}

module.exports = { TEST_FILES, runAll };
