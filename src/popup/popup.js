function createDebouncedSettingsWriter(writeSettings, delayMs = 200) {
  let timer = null;
  let latest = null;

  return (partial) => {
    latest = { ...(latest || {}), ...partial };
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      const pending = latest;
      latest = null;
      writeSettings(pending);
    }, delayMs);
  };
}

function createResetSettings(defaultSettings) {
  return {
    ...defaultSettings,
    colors: { ...defaultSettings.colors },
  };
}

async function init() {
  const settings = await getSettings();
  const writeSettingsDebounced = createDebouncedSettingsWriter(setSettings);

  const elEnabled    = document.getElementById('toggle-enabled');
  const elOpacity    = document.getElementById('opacity-slider');
  const elOpacityVal = document.getElementById('opacity-val');
  const elSpeed      = document.getElementById('speed-select');
  const elFont       = document.getElementById('font-select');
  const elDensity    = document.getElementById('density-select');
  const elDisplayRange = document.getElementById('display-range-select');
  const elMod        = document.getElementById('color-mod');
  const elSub        = document.getElementById('color-subscriber');
  const elVip        = document.getElementById('color-vip');
  const elGeneral    = document.getElementById('color-general');
  const elReset      = document.getElementById('reset-settings');

  const populate = (nextSettings) => {
    elEnabled.checked  = nextSettings.enabled;
    elOpacity.value    = Math.round(nextSettings.opacity * 100);
    elOpacityVal.textContent = elOpacity.value + '%';
    elSpeed.value      = nextSettings.speed;
    elFont.value       = nextSettings.fontSize;
    elDensity.value    = nextSettings.density;
    elDisplayRange.value = nextSettings.displayRange;
    elMod.value        = nextSettings.colors.mod;
    elSub.value        = nextSettings.colors.subscriber;
    elVip.value        = nextSettings.colors.vip;
    elGeneral.value    = nextSettings.colors.general;
  };

  // Populate from storage
  populate(settings);

  // Wire up changes — each writes to storage immediately
  elEnabled.addEventListener('change', () =>
    setSettings({ enabled: elEnabled.checked }));

  elOpacity.addEventListener('input', () => {
    elOpacityVal.textContent = elOpacity.value + '%';
    writeSettingsDebounced({ opacity: elOpacity.value / 100 });
  });

  elSpeed.addEventListener('change', () =>
    setSettings({ speed: elSpeed.value }));

  elFont.addEventListener('change', () =>
    setSettings({ fontSize: elFont.value }));

  elDensity.addEventListener('change', () =>
    setSettings({ density: elDensity.value }));

  elDisplayRange.addEventListener('change', () =>
    setSettings({ displayRange: elDisplayRange.value }));

  const updateColors = () => setSettings({
    colors: {
      mod:        elMod.value,
      subscriber: elSub.value,
      vip:        elVip.value,
      general:    elGeneral.value,
    },
  });
  const updateColorsDebounced = () => writeSettingsDebounced({
    colors: {
      mod:        elMod.value,
      subscriber: elSub.value,
      vip:        elVip.value,
      general:    elGeneral.value,
    },
  });

  elMod.addEventListener('change', updateColors);
  elSub.addEventListener('change', updateColors);
  elVip.addEventListener('change', updateColors);
  elGeneral.addEventListener('change', updateColors);
  elMod.addEventListener('input', updateColorsDebounced);
  elSub.addEventListener('input', updateColorsDebounced);
  elVip.addEventListener('input', updateColorsDebounced);
  elGeneral.addEventListener('input', updateColorsDebounced);

  elReset.addEventListener('click', async () => {
    const resetSettings = createResetSettings(DEFAULT_SETTINGS);
    populate(resetSettings);
    await setSettings(resetSettings);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createDebouncedSettingsWriter, createResetSettings };
} else {
  init();
}
