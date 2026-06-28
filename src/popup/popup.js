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

async function init() {
  const settings = await getSettings();
  const writeSettingsDebounced = createDebouncedSettingsWriter(setSettings);

  const elEnabled    = document.getElementById('toggle-enabled');
  const elOpacity    = document.getElementById('opacity-slider');
  const elOpacityVal = document.getElementById('opacity-val');
  const elSpeed      = document.getElementById('speed-select');
  const elFont       = document.getElementById('font-select');
  const elMod        = document.getElementById('color-mod');
  const elSub        = document.getElementById('color-subscriber');
  const elVip        = document.getElementById('color-vip');
  const elGeneral    = document.getElementById('color-general');

  // Populate from storage
  elEnabled.checked  = settings.enabled;
  elOpacity.value    = Math.round(settings.opacity * 100);
  elOpacityVal.textContent = elOpacity.value + '%';
  elSpeed.value      = settings.speed;
  elFont.value       = settings.fontSize;
  elMod.value        = settings.colors.mod;
  elSub.value        = settings.colors.subscriber;
  elVip.value        = settings.colors.vip;
  elGeneral.value    = settings.colors.general;

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
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createDebouncedSettingsWriter };
} else {
  init();
}
