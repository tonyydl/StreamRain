// Single source of truth for Twitch DOM selectors and defaults.
// Update selectors here if Twitch changes their markup.

const SELECTORS = {
  CHAT_LINE:      '.chat-line__message',
  USERNAME:       '[data-a-user]',
  BADGE:          '.chat-badge',
  CHAT_CONTAINER: '.chat-scrollable-area__message-container',
  VIDEO:          'video.video-player__video',
  PLAYER_WRAPPER: '.video-player__container',
};

const COLORS = {
  MOD:        '#00C000',
  SUBSCRIBER: '#9146FF',
  VIP:        '#F5A623',
  GENERAL:    '#FFFFFF',
};

const SPEED_MAP = { slow: 12, medium: 8, fast: 5 };

const FONT_SIZE_MAP = { small: 14, medium: 18, large: 22 };

const DEFAULT_SETTINGS = {
  enabled:  true,
  opacity:  0.8,
  speed:    'medium',
  fontSize: 'medium',
  colors: {
    mod:        COLORS.MOD,
    subscriber: COLORS.SUBSCRIBER,
    vip:        COLORS.VIP,
    general:    COLORS.GENERAL,
  },
};
