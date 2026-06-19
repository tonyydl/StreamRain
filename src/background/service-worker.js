importScripts('../vendor/browser-polyfill.min.js');
importScripts('../shared/constants.js');

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await browser.storage.sync.set(DEFAULT_SETTINGS);
  }
});
