// Wraps chrome.storage.sync. All content script + popup code goes through here.

async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return Object.assign({}, DEFAULT_SETTINGS, stored, {
    colors: Object.assign({}, DEFAULT_SETTINGS.colors, stored.colors),
  });
}

async function setSettings(partial) {
  await chrome.storage.sync.set(partial);
}

function onSettingsChanged(callback) {
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'sync') return;
    const current = await getSettings();
    callback(current);
  });
}
