// Emote support: Twitch native (from IRC tags) + 7TV (from 7tv.io API).
// Loaded before danmaku-engine.js so the engine can read EmoteCache.sevenTv.

// Parse the IRCv3 `emotes` tag, e.g. "25:0-4,12-16/1902:6-10"
// -> [{id:'25',start:0,end:4},{id:'25',start:12,end:16},{id:'1902',start:6,end:10}]
// Positions are codepoint indices into the message text.
function parseTwitchEmotes(tag) {
  if (!tag) return [];
  const out = [];
  for (const group of tag.split('/')) {
    const sep = group.indexOf(':');
    if (sep === -1) continue;
    const id = group.slice(0, sep);
    for (const range of group.slice(sep + 1).split(',')) {
      const dash = range.indexOf('-');
      if (dash === -1) continue;
      out.push({ id, start: +range.slice(0, dash), end: +range.slice(dash + 1) });
    }
  }
  return out;
}

const EmoteCache = {
  sevenTv: {},          // 7TV code -> image url
  _loadedRoom: null,

  twitchUrl(id) {
    return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`;
  },

  // Fetch the channel's 7TV emote set once per room. Global emotes load first
  // so channel emotes override them on name conflicts. Failures are non-fatal —
  // danmaku still renders text.
  async loadForRoom(roomId) {
    if (!roomId || this._loadedRoom === roomId) return;

    const map = {};
    let hadFetchFailure = false;
    const add = (list) => {
      for (const e of list || []) {
        const host = e.data && e.data.host;
        if (host && host.url) map[e.name] = 'https:' + host.url + '/2x.webp';
      }
    };

    try {
      const g = await fetch('https://7tv.io/v3/emote-sets/global').then(r => r.ok ? r.json() : null);
      if (g) add(g.emotes);
    } catch (e) { hadFetchFailure = true; }
    try {
      const u = await fetch(`https://7tv.io/v3/users/twitch/${roomId}`).then(r => r.ok ? r.json() : null);
      if (u && u.emote_set) add(u.emote_set.emotes);
    } catch (e) { hadFetchFailure = true; }

    this.sevenTv = map;
    if (!hadFetchFailure) this._loadedRoom = roomId;
  },
};

// ponytail: dual-export so the pure parser is testable under Node without a build step
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseTwitchEmotes, EmoteCache };
}
