function isEditableTarget(target) {
  if (!target) return false;
  const tag = (target.tagName || '').toUpperCase();
  return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function shouldToggleShortcut(event) {
  if (!event || isEditableTarget(event.target)) return false;
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
  return String(event.key || '').toLowerCase() === 'd';
}

function registerToggleShortcut(toggle) {
  const onKeyDown = async (event) => {
    if (!shouldToggleShortcut(event)) return;
    event.preventDefault();
    await toggle();
  };

  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { shouldToggleShortcut, registerToggleShortcut };
}
