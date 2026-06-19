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

  // Bug 7: retry injecting the button until the player wrapper is in the DOM
  function injectButtonWhenReady() {
    const wrapper = document.querySelector(SELECTORS.PLAYER_WRAPPER);
    if (wrapper) {
      button.inject();
      button.syncState(false);
      return;
    }
    const obs = new MutationObserver(() => {
      if (document.querySelector(SELECTORS.PLAYER_WRAPPER)) {
        obs.disconnect();
        button.inject();
        button.syncState(false);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // Bug 4: Register BEFORE any await so popup changes during mount retries are caught
  onSettingsChanged(async (newSettings) => {
    if (newSettings.enabled) {
      await enable(newSettings);
    } else {
      disable();
      button.inject(); // keep button visible even when disabled
    }
  });

  // Bootstrap on load
  const settings = await getSettings();
  if (settings.enabled) {
    await enable(settings);
  } else {
    injectButtonWhenReady();
  }
})();
