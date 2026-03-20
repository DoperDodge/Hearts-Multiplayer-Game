// ============================================================
// PIXEL HEARTS — Shared Game Types
// ============================================================

export enum Suit {
  CLUBS = 'CLUBS',
  DIAMONDS = 'DIAMONDS',
  SPADES = 'SPADES',
  HEARTS = 'HEARTS',
}

export enum Rank {
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  JACK = 11,
  QUEEN = 12,
  KING = 13,
  ACE = 14,
}

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // e.g. "2C", "QS", "AH"
}

export enum PlayerPosition {
  SOUTH = 'SOUTH',
  WEST = 'WEST',
  NORTH = 'NORTH',
  EAST = 'EAST',
}

export enum PassDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  ACROSS = 'ACROSS',
  NONE = 'NONE',
}

export enum GamePhase {
  WAITING = 'WAITING',
  DEALING = 'DEALING',
  PASSING = 'PASSING',
  PLAYING = 'PLAYING',
  SCORING = 'SCORING',
  GAME_OVER = 'GAME_OVER',
}

export enum BotDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum MoonScoringVariant {
  ADD_TO_OTHERS = 'ADD_TO_OTHERS',
  SUBTRACT_FROM_SELF = 'SUBTRACT_FROM_SELF',
  PLAYER_CHOICE = 'PLAYER_CHOICE',
}

export interface TrickCard {
  card: Card;
  playedBy: string; // playerId
}

export interface Trick {
  cards: TrickCard[];
  ledSuit: Suit | null;
  winnerId: string | null;
}

export interface PlayerState {
  id: string;
  name: string;
  position: PlayerPosition;
  hand: Card[];
  tricksWon: Trick[];
  score: number;
  totalScore: number;
  isReady: boolean;
  isConnected: boolean;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  avatar: number;
  passCards: Card[] | null; // cards selected for passing
}

export interface HandState {
  roundNumber: number;
  passDirection: PassDirection;
  currentTrick: Trick;
  tricksPlayed: Trick[];
  trickNumber: number;
  currentPlayerIndex: number;
  heartsBroken: boolean;
  isFirstTrick: boolean;
  leadPlayerIndex: number;
}

export interface GameSettings {
  scoreLimit: number;
  jackOfDiamonds: boolean;
  moonScoringVariant: MoonScoringVariant;
  noPointsOnFirstTrick: boolean;
  queenBreaksHearts: boolean;
  botDifficulty: BotDifficulty;
  turnTimeout: number; // ms
  animationSpeed: 'slow' | 'normal' | 'fast' | 'instant';
}

export interface GameState {
  id: string;
  phase: GamePhase;
  players: PlayerState[];
  hand: HandState | null;
  settings: GameSettings;
  roundNumber: number;
  dealerIndex: number;
}

export interface RoomConfig {
  roomName: string;
  password?: string;
  maxPlayers: number;
  settings: GameSettings;
  botBackfill: boolean;
  botDifficulty: BotDifficulty;
}

export interface RoomInfo {
  id: string;
  name: string;
  hostId: string;
  playerCount: number;
  maxPlayers: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  hasPassword: boolean;
  settings: GameSettings;
  createdAt: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  avatar: number;
  isReady: boolean;
  isHost: boolean;
  isBot: boolean;
}

// Helper constants
export const SUIT_ORDER = [Suit.CLUBS, Suit.DIAMONDS, Suit.SPADES, Suit.HEARTS];
export const RANK_SHORT: Record<Rank, string> = {
  [Rank.TWO]: '2',
  [Rank.THREE]: '3',
  [Rank.FOUR]: '4',
  [Rank.FIVE]: '5',
  [Rank.SIX]: '6',
  [Rank.SEVEN]: '7',
  [Rank.EIGHT]: '8',
  [Rank.NINE]: '9',
  [Rank.TEN]: '10',
  [Rank.JACK]: 'J',
  [Rank.QUEEN]: 'Q',
  [Rank.KING]: 'K',
  [Rank.ACE]: 'A',
};

export const SUIT_SHORT: Record<Suit, string> = {
  [Suit.CLUBS]: 'C',
  [Suit.DIAMONDS]: 'D',
  [Suit.SPADES]: 'S',
  [Suit.HEARTS]: 'H',
};

export const SUIT_SYMBOL: Record<Suit, string> = {
  [Suit.CLUBS]: '♣',
  [Suit.DIAMONDS]: '♦',
  [Suit.SPADES]: '♠',
  [Suit.HEARTS]: '♥',
};

export function cardId(suit: Suit, rank: Rank): string {
  return `${RANK_SHORT[rank]}${SUIT_SHORT[suit]}`;
}

export function cardToString(card: Card): string {
  return `${RANK_SHORT[card.rank]}${SUIT_SYMBOL[card.suit]}`;
}

export function isQueenOfSpades(card: Card): boolean {
  return card.suit === Suit.SPADES && card.rank === Rank.QUEEN;
}

export function isJackOfDiamonds(card: Card): boolean {
  return card.suit === Suit.DIAMONDS && card.rank === Rank.JACK;
}

export function isTwoOfClubs(card: Card): boolean {
  return card.suit === Suit.CLUBS && card.rank === Rank.TWO;
}

export function isPenaltyCard(card: Card): boolean {
  return card.suit === Suit.HEARTS || isQueenOfSpades(card);
}
