const assert = require('assert');

const {
  parseIrcLine,
  roleFromBadges,
  nextReconnectDelayMs,
} = require('../src/content/chat-observer.js');

assert.strictEqual(
  parseIrcLine('@badges=moderator/1;color=#fff;display-name=Tony;emotes=25:0-4;room-id=123 :tony!tony@tony.tmi.twitch.tv PRIVMSG #channel :Kappa hello').displayName,
  'Tony',
);

assert.strictEqual(
  parseIrcLine(':tmi.twitch.tv NOTICE * :Login authentication failed').command,
  'NOTICE',
);

assert.strictEqual(roleFromBadges('subscriber/12,vip/1'), 'vip');
assert.strictEqual(roleFromBadges('broadcaster/1,subscriber/12'), 'moderator');
assert.strictEqual(roleFromBadges(''), '');

assert.strictEqual(nextReconnectDelayMs(0), 3000);
assert.strictEqual(nextReconnectDelayMs(1), 6000);
assert.strictEqual(nextReconnectDelayMs(2), 12000);
assert.strictEqual(nextReconnectDelayMs(20), 30000);

console.log('ok');
