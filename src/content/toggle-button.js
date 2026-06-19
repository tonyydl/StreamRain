class ToggleButton {
  constructor() {
    this._btn = null;
  }

  inject() {
    if (this._btn) return;
    const wrapper = document.querySelector(SELECTORS.PLAYER_WRAPPER);
    if (!wrapper) return;

    this._btn = document.createElement('button');
    this._btn.id = 'sr-toggle-btn';
    this._btn.title = 'StreamRain — toggle danmaku';
    this._btn.textContent = '彈';
    Object.assign(this._btn.style, {
      position:        'absolute',
      bottom:          '48px',
      right:           '12px',
      zIndex:          '10000',
      width:           '32px',
      height:          '32px',
      borderRadius:    '50%',
      border:          'none',
      cursor:          'pointer',
      fontSize:        '14px',
      fontWeight:      'bold',
      background:      'rgba(0,0,0,0.6)',
      color:           '#fff',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      transition:      'background 0.2s',
    });

    this._btn.addEventListener('click', async () => {
      const settings = await getSettings();
      await setSettings({ enabled: !settings.enabled });
    });

    wrapper.style.position = 'relative';
    wrapper.appendChild(this._btn);
  }

  remove() {
    if (this._btn && this._btn.parentNode) this._btn.parentNode.removeChild(this._btn);
    this._btn = null;
  }

  syncState(enabled) {
    if (!this._btn) return;
    this._btn.style.background = enabled
      ? 'rgba(145, 70, 255, 0.85)'
      : 'rgba(0, 0, 0, 0.6)';
    this._btn.style.color = enabled ? '#fff' : '#888';
  }
}
