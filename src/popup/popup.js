async function init() {
  const settings = await getSettings();

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
    setSettings({ opacity: elOpacity.value / 100 });
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

  elMod.addEventListener('input', updateColors);
  elSub.addEventListener('input', updateColors);
  elVip.addEventListener('input', updateColors);
  elGeneral.addEventListener('input', updateColors);
}

init();
