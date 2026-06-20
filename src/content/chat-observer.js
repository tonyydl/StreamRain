// ChatObserver — sources Twitch chat via the public anonymous IRC-over-WebSocket
// gateway (wss://irc-ws.chat.twitch.tv:443) instead of scraping the DOM.
//
// Why IRC and not the DOM: extensions like 7TV replace Twitch's chat renderer
// entirely, so the native `.chat-scrollable-area__message-container` exists but
// stays empty — DOM observation never fires. The IRC gateway is the same source
// Twitch's own client uses, is anonymous/read-only, and yields structured data
// (display name + badges) immune to any front-end rewrite.
//
// Emits { username, message, badge } to onMessage, where `badge` is one of
// 'moderator' | 'vip' | 'subscriber' | '' — the contract DanmakuEngine expects.

const IRC_URL = 'wss://irc-ws.chat.twitch.tv:443';

class ChatObserver {
  constructor(onMessage) {
    this._onMessage     = onMessage;
    this._ws            = null;
    this._channel       = null;   // current joined channel (lowercase, no '#')
    this._reconnectTimer = null;
    this._channelTimer  = null;
    this._stopped       = false;
  }

  start() {
    this._stopped = false;
    const channel = this._channelFromUrl();
    this._channel = channel;
    this._connect();
    this._watchChannelChange();
  }

  stop() {
    this._stopped = true;
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    if (this._channelTimer)   { clearInterval(this._channelTimer); this._channelTimer = null; }
    if (this._ws) {
      // Prevent onclose from scheduling a reconnect
      this._ws.onclose = null;
      try { this._ws.close(); } catch (e) { /* ignore */ }
      this._ws = null;
    }
  }

  // --- channel detection --------------------------------------------------

  _channelFromUrl() {
    // twitch.tv/<channel> — first path segment, lowercased.
    // Skip known non-channel routes so we don't JOIN a junk channel.
    const NON_CHANNEL = new Set([
      '', 'directory', 'settings', 'subscriptions', 'inventory', 'wallet',
      'drops', 'friends', 'following', 'videos', 'u', 'p', 'team', 'search',
      'downloads', 'turbo', 'prime', 'jobs', 'store',
    ]);
    const seg = location.pathname.split('/').filter(Boolean)[0] || '';
    const channel = seg.toLowerCase();
    if (NON_CHANNEL.has(channel)) return null;
    return channel;
  }

  _watchChannelChange() {
    // Twitch is a SPA; the URL changes without a reload. Re-JOIN on change.
    this._channelTimer = setInterval(() => {
      if (this._stopped) return;
      const channel = this._channelFromUrl();
      if (channel === this._channel) return;
      if (this._channel && this._ws && this._ws.readyState === WebSocket.OPEN) {
        this._send(`PART #${this._channel}`);
      }
      this._channel = channel;
      if (channel && this._ws && this._ws.readyState === WebSocket.OPEN) {
        this._send(`JOIN #${channel}`);
      }
    }, 2000);
  }

  // --- connection ---------------------------------------------------------

  _connect() {
    if (this._stopped) return;
    let ws;
    try {
      ws = new WebSocket(IRC_URL);
    } catch (e) {
      console.warn('[StreamRain] WebSocket construction failed:', e);
      this._scheduleReconnect();
      return;
    }
    this._ws = ws;

    ws.onopen = () => {
      // Request tags (badges, display-name) and command capabilities.
      this._send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      // Anonymous login — any justinfan<number> nick, no password required.
      this._send(`NICK justinfan${10000 + Math.floor(Math.random() * 80000)}`);
      if (this._channel) {
        this._send(`JOIN #${this._channel}`);
      }
    };

    ws.onmessage = (event) => {
      // A single frame may contain multiple IRC lines separated by CRLF.
      const lines = event.data.split('\r\n');
      for (const line of lines) {
        if (line) this._handleLine(line);
      }
    };

    ws.onerror = (e) => {
      console.warn('[StreamRain] IRC socket error', e);
    };

    ws.onclose = () => {
      this._ws = null;
      this._scheduleReconnect();
    };
  }

  _scheduleReconnect() {
    if (this._stopped || this._reconnectTimer) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this._connect();
    }, 3000);
  }

  _send(raw) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(raw + '\r\n');
    }
  }

  // --- IRC parsing --------------------------------------------------------

  _handleLine(line) {
    // Keepalive: server sends "PING :tmi.twitch.tv" — must reply or be dropped.
    if (line.startsWith('PING')) {
      this._send('PONG :tmi.twitch.tv');
      return;
    }

    const parsed = this._parseIrc(line);
    if (!parsed || parsed.command !== 'PRIVMSG') return;

    // room-id is the channel's numeric Twitch ID — used to fetch its 7TV set.
    if (parsed.tags['room-id']) EmoteCache.loadForRoom(parsed.tags['room-id']);

    const msg = {
      username: parsed.displayName || parsed.nick || '',
      message:  parsed.text || '',
      badge:    this._roleFromBadges(parsed.tags.badges || ''),
      emotes:   parseTwitchEmotes(parsed.tags.emotes),
    };
    if (!msg.message) return;
    this._onMessage(msg);
  }

  // Parse an IRCv3 line: "@tags :prefix COMMAND params :trailing"
  _parseIrc(line) {
    let rest = line;
    const tags = {};

    // Tags
    if (rest[0] === '@') {
      const sp = rest.indexOf(' ');
      const tagStr = rest.slice(1, sp);
      rest = rest.slice(sp + 1);
      for (const pair of tagStr.split(';')) {
        const eq = pair.indexOf('=');
        if (eq === -1) { tags[pair] = ''; continue; }
        tags[pair.slice(0, eq)] = pair.slice(eq + 1);
      }
    }

    // Prefix
    let nick = '';
    if (rest[0] === ':') {
      const sp = rest.indexOf(' ');
      const prefix = rest.slice(1, sp);
      rest = rest.slice(sp + 1);
      const bang = prefix.indexOf('!');
      nick = bang === -1 ? prefix : prefix.slice(0, bang);
    }

    // Command + params
    const sp = rest.indexOf(' ');
    const command = sp === -1 ? rest : rest.slice(0, sp);
    let params = sp === -1 ? '' : rest.slice(sp + 1);

    // Trailing message text (after " :")
    let text = '';
    const colon = params.indexOf(':');
    if (colon !== -1) {
      text = params.slice(colon + 1);
    }

    return {
      tags,
      nick,
      command,
      text,
      displayName: tags['display-name'] || '',
    };
  }

  // badges tag looks like "moderator/1,subscriber/12" or "vip/1,subscriber/6".
  // Map to the single role string DanmakuEngine._colorForBadge expects.
  // Priority: broadcaster/moderator (green) > vip (yellow) > subscriber (purple).
  _roleFromBadges(badges) {
    if (!badges) return '';
    const keys = badges.split(',').map(b => b.split('/')[0]);
    if (keys.includes('broadcaster') || keys.includes('moderator')) return 'moderator';
    if (keys.includes('vip')) return 'vip';
    if (keys.includes('subscriber')) return 'subscriber';
    return '';
  }
}
