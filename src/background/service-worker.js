importScripts('../vendor/browser-polyfill.min.js');
importScripts('../shared/constants.js');

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
  }
});
