(async () => {
  let overlay = null;
  let engine  = null;
  let observer = null;
  const button = new ToggleButton();

  async function enable(settings) {
    if (!overlay) {
      overlay = new DanmakuOverlay();
      const ok = await overlay.mount();
      if (!ok) { overlay = null; return; }
    }
    if (!engine) {
      engine = new DanmakuEngine(overlay);
    }
    engine.applySettings(settings);

    if (!observer) {
      observer = new ChatObserver(msg => engine.push(msg));
      observer.start();
    }

    button.inject();
    button.syncState(true);
  }

  function disable() {
    if (observer) { observer.stop(); observer = null; }
    if (engine)   { engine.destroy(); engine = null; }
    if (overlay)  { overlay.unmount(); overlay = null; }
    button.syncState(false);
  }

  // Bootstrap on load
  const settings = await getSettings();
  if (settings.enabled) {
    await enable(settings);
  } else {
    button.inject();
    button.syncState(false);
  }

  // React to settings changes (from popup or toggle button)
  onSettingsChanged(async (newSettings) => {
    if (newSettings.enabled) {
      await enable(newSettings);
    } else {
      disable();
      button.inject(); // keep button visible even when disabled
    }
  });
})();
