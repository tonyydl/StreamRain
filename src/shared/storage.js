// Wraps storage.sync. All content script + popup code goes through here.
// Uses the promise-based `browser.*` namespace (provided natively on Firefox,
// and by webextension-polyfill on Chromium) so `await` works on every browser.

async function getSettings() {
  const stored = await browser.storage.sync.get(DEFAULT_SETTINGS);
  return Object.assign({}, DEFAULT_SETTINGS, stored, {
    colors: Object.assign({}, DEFAULT_SETTINGS.colors, stored.colors),
  });
}

async function setSettings(partial) {
  await browser.storage.sync.set(partial);
}

function onSettingsChanged(callback) {
  browser.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'sync') return;
    const current = await getSettings();
    callback(current);
  });
}
