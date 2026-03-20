// ============================================================
// PIXEL HEARTS — Shared Constants
// ============================================================

export const DEFAULT_SCORE_LIMIT = 100;
export const TOTAL_PENALTY_POINTS = 26;
export const CARDS_PER_HAND = 13;
export const NUM_PLAYERS = 4;
export const PASS_CARD_COUNT = 3;
export const TOTAL_CARDS = 52;

// Timing (ms)
export const DEAL_CARD_INTERVAL = 80;
export const DEAL_CARD_FLIGHT = 300;
export const PASS_FLIGHT = 1500;
export const PLAY_CARD_FLIGHT = 400;
export const TRICK_VIEW_PAUSE = 1500;
export const TRICK_COLLECT = 800;
export const HAND_SORT = 500;
export const MOON_CELEBRATION = 3000;
export const SCORE_REVEAL = 2000;

// Server
export const DEFAULT_TURN_TIMEOUT = 60000;
export const BOT_THINK_DELAY_EASY = { min: 1000, max: 2500 };
export const BOT_THINK_DELAY_MEDIUM = { min: 800, max: 1800 };
export const BOT_THINK_DELAY_HARD = { min: 1200, max: 3000 };
export const DISCONNECT_TIMEOUT = 30000;
export const RECONNECT_WINDOW = 300000; // 5 minutes
export const ROOM_CLEANUP_TIMEOUT = 120000; // 2 minutes
export const WS_HEARTBEAT_INTERVAL = 25000;
export const MAX_ROOMS = 50;
export const MAX_MESSAGES_PER_SECOND = 10;

// Lobby
export const LOBBY_REFRESH_INTERVAL = 5000;
export const ROOM_CODE_LENGTH = 4;

// Player
export const MAX_USERNAME_LENGTH = 12;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

// Bot names by difficulty
export const BOT_NAMES = {
  EASY: ['Bumbling Bill', 'Sleepy Sam', 'Daisy', 'Patches'],
  MEDIUM: ['Careful Carol', 'Steady Steve', 'Nova', 'Maple'],
  HARD: ['Ruthless Rick', 'Iron Iris', 'Viper', 'Onyx'],
};

// Random human name generator words
export const NAME_PREFIXES = [
  'Card', 'Heart', 'Moon', 'Pixel', 'Lucky', 'Wild', 'Ace', 'Royal',
  'Swift', 'Brave', 'Clever', 'Shadow', 'Storm', 'Star', 'Iron', 'Golden',
];

export const NAME_SUFFIXES = [
  'Shark', 'Breaker', 'Shooter', 'Runner', 'Slayer', 'Hunter', 'Master', 'Player',
  'Wolf', 'Fox', 'Bear', 'Hawk', 'Knight', 'Rogue', 'Ninja', 'Hero',
];
