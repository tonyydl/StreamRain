(async () => {
  let overlay = null;
  let engine  = null;
  let observer = null;
  let buttonReadyObs = null;
  const button = new ToggleButton();

  async function enable(settings) {
    // Cancel the "waiting for player to inject button" observer if it's running
    if (buttonReadyObs) {
      buttonReadyObs.disconnect();
      buttonReadyObs = null;
    }
    if (!overlay) {
      overlay = new DanmakuOverlay();
      const ok = await overlay.mount(() => {
        if (engine) engine._rebuildTracks();
      });
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
    buttonReadyObs = new MutationObserver(() => {
      if (document.querySelector(SELECTORS.PLAYER_WRAPPER)) {
        buttonReadyObs.disconnect();
        buttonReadyObs = null;
        button.inject();
        button.syncState(false);
      }
    });
    buttonReadyObs.observe(document.body, { childList: true, subtree: true });
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
