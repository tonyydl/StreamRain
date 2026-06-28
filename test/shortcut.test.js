const assert = require('assert');
const { shouldToggleShortcut } = require('../src/content/keyboard-shortcut.js');

function event(overrides = {}) {
  return {
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: 'd',
    target: { tagName: 'DIV', isContentEditable: false },
    ...overrides,
  };
}

assert.strictEqual(shouldToggleShortcut(event()), true);
assert.strictEqual(shouldToggleShortcut(event({ key: 'D' })), true);
assert.strictEqual(shouldToggleShortcut(event({ altKey: false })), false);
assert.strictEqual(shouldToggleShortcut(event({ key: 'x' })), false);
assert.strictEqual(shouldToggleShortcut(event({ ctrlKey: true })), false);
assert.strictEqual(shouldToggleShortcut(event({ metaKey: true })), false);
assert.strictEqual(shouldToggleShortcut(event({ target: { tagName: 'INPUT' } })), false);
assert.strictEqual(shouldToggleShortcut(event({ target: { tagName: 'TEXTAREA' } })), false);
assert.strictEqual(shouldToggleShortcut(event({ target: { tagName: 'SELECT' } })), false);
assert.strictEqual(shouldToggleShortcut(event({ target: { tagName: 'DIV', isContentEditable: true } })), false);

console.log('ok');
