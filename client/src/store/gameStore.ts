// ============================================================
// PIXEL HEARTS — Game State Store (Zustand)
// ============================================================

import { create } from 'zustand';
import {
  Card, Trick, TrickCard, GamePhase, PassDirection,
  PlayerPosition, BotDifficulty, MoonScoringVariant, GameSettings,
} from '@shared/game-types';
import { BOT_NAMES, NUM_PLAYERS, DEFAULT_SCORE_LIMIT } from '@shared/constants';
import { createDeck, shuffleDeck, dealCards, sortHand, removeCard } from '../game-logic/deck';
import {
  getPassDirection, getPassTargetIndex, findStartingPlayer,
  getLegalMoves, getTrickWinner, doesCardBreakHearts,
} from '../game-logic/rules';
import { scoreHand, applyMoonScoring, isGameOver, getWinner } from '../game-logic/scoring';
import { chooseBotPassCards, chooseBotPlay, getBotDelay } from '../game-logic/bot-ai';

export interface PlayerData {
  id: string;
  name: string;
  position: PlayerPosition;
  hand: Card[];
  tricksWon: Trick[];
  score: number;
  totalScore: number;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  avatar: number;
  cardCount: number;
  _passCards?: string[];
}

interface GameStore {
  phase: GamePhase;
  players: PlayerData[];
  humanPlayerIndex: number;
  roundNumber: number;
  passDirection: PassDirection;
  currentTrick: TrickCard[];
  trickNumber: number;
  currentPlayerIndex: number;
  heartsBroken: boolean;
  isFirstTrick: boolean;
  legalMoves: string[];
  selectedPassCards: string[];
  lastTrick: TrickCard[] | null;
  lastTrickWinner: string | null;
  moonShooter: string | null;
  handScores: Record<string, number> | null;
  gameWinner: string | null;
  message: string;
  isMultiplayer: boolean;
  settings: GameSettings;
  tricksByPlayer: Map<string, Trick[]>;

  startSoloGame: (difficulty: BotDifficulty, settings?: Partial<GameSettings>) => void;
  selectPassCard: (cardId: string) => void;
  confirmPass: () => void;
  playCard: (cardId: string) => void;
  reset: () => void;
}

const POSITIONS = [PlayerPosition.SOUTH, PlayerPosition.WEST, PlayerPosition.NORTH, PlayerPosition.EAST];

const defaultSettings: GameSettings = {
  scoreLimit: DEFAULT_SCORE_LIMIT,
  jackOfDiamonds: false,
  moonScoringVariant: MoonScoringVariant.ADD_TO_OTHERS,
  noPointsOnFirstTrick: false,
  queenBreaksHearts: true,
  botDifficulty: BotDifficulty.MEDIUM,
  turnTimeout: 60000,
  animationSpeed: 'normal',
};

// ── Internal helpers ─────────────────────────────────────

function _startNewHand(get: () => GameStore, set: (s: Partial<GameStore>) => void) {
  const state = get();
  const roundNumber = state.roundNumber + 1;
  const passDirection = getPassDirection(roundNumber);

  const deck = shuffleDeck(createDeck());
  const hands = dealCards(deck, NUM_PLAYERS);

  const players = state.players.map((p, i) => ({
    ...p,
    hand: hands[i],
    tricksWon: [] as Trick[],
    score: 0,
    cardCount: hands[i].length,
    _passCards: undefined,
  }));

  const tricksByPlayer = new Map<string, Trick[]>();
  players.forEach(p => tricksByPlayer.set(p.id, []));

  set({
    phase: passDirection === PassDirection.NONE ? GamePhase.PLAYING : GamePhase.PASSING,
    players,
    roundNumber,
    passDirection,
    currentTrick: [],
    trickNumber: 1,
    heartsBroken: false,
    isFirstTrick: true,
    selectedPassCards: [],
    lastTrick: null,
    lastTrickWinner: null,
    moonShooter: null,
    handScores: null,
    message: passDirection === PassDirection.NONE ? '' : `Pass 3 cards ${passDirection.toLowerCase()}`,
    tricksByPlayer,
  });

  if (passDirection === PassDirection.NONE) {
    setTimeout(() => _startPlayPhase(get, set), 300);
  } else {
    setTimeout(() => {
      const s = get();
      const updatedPlayers = s.players.map(p => {
        if (p.isBot) {
          const passCards = chooseBotPassCards(p.hand, p.botDifficulty || BotDifficulty.MEDIUM);
          return { ...p, _passCards: passCards.map(c => c.id) };
        }
        return p;
      });
      set({ players: updatedPlayers });
    }, 500);
  }
}

function _startPlayPhase(get: () => GameStore, set: (s: Partial<GameStore>) => void) {
  const state = get();
  const hands = state.players.map(p => p.hand);
  const startIdx = findStartingPlayer(hands);

  const legalMoves = startIdx === state.humanPlayerIndex
    ? getLegalMoves(state.players[startIdx].hand, [], true, false).map(c => c.id)
    : [];

  set({
    phase: GamePhase.PLAYING,
    currentPlayerIndex: startIdx,
    isFirstTrick: true,
    legalMoves,
    message: startIdx === state.humanPlayerIndex ? 'Your turn — play the 2♣' : '',
  });

  if (state.players[startIdx].isBot) {
    _triggerBotPlay(get, set);
  }
}

function _executePlay(get: () => GameStore, set: (s: Partial<GameStore>) => void, playerIndex: number, cardId: string) {
  const state = get();
  const players = state.players.map(p => ({ ...p, hand: [...p.hand] }));
  const player = players[playerIndex];
  const card = removeCard(player.hand, cardId);
  if (!card) return;

  player.cardCount = player.hand.length;
  let heartsBroken = state.heartsBroken;
  const currentTrick: TrickCard[] = [...state.currentTrick, { card, playedBy: player.id }];

  if (!heartsBroken && state.currentTrick.length > 0) {
    const ledSuit = state.currentTrick[0].card.suit;
    if (card.suit !== ledSuit && doesCardBreakHearts(card)) {
      heartsBroken = true;
    }
  }

  set({ players, currentTrick, heartsBroken });

  if (currentTrick.length === NUM_PLAYERS) {
    setTimeout(() => _resolveTrick(get, set), 600);
  } else {
    const nextIdx = (playerIndex + 1) % NUM_PLAYERS;
    const nextLegalMoves = nextIdx === state.humanPlayerIndex
      ? getLegalMoves(players[nextIdx].hand, currentTrick, state.isFirstTrick, heartsBroken).map(c => c.id)
      : [];

    set({
      currentPlayerIndex: nextIdx,
      legalMoves: nextLegalMoves,
      message: nextIdx === state.humanPlayerIndex ? 'Your turn' : '',
    });

    if (players[nextIdx].isBot) {
      _triggerBotPlay(get, set);
    }
  }
}

function _triggerBotPlay(get: () => GameStore, set: (s: Partial<GameStore>) => void) {
  const state = get();
  const player = state.players[state.currentPlayerIndex];
  if (!player || !player.isBot) return;

  const difficulty = player.botDifficulty || BotDifficulty.MEDIUM;
  const delay = getBotDelay(difficulty);
  const expectedIdx = state.currentPlayerIndex;

  setTimeout(() => {
    const cur = get();
    if (cur.phase !== GamePhase.PLAYING || cur.currentPlayerIndex !== expectedIdx) return;

    const bot = cur.players[cur.currentPlayerIndex];
    const legalMoves = getLegalMoves(bot.hand, cur.currentTrick, cur.isFirstTrick, cur.heartsBroken);
    if (legalMoves.length === 0) return;

    const chosen = chooseBotPlay({
      hand: bot.hand,
      currentTrick: cur.currentTrick,
      isFirstTrick: cur.isFirstTrick,
      heartsBroken: cur.heartsBroken,
      legalMoves,
    }, difficulty);

    _executePlay(get, set, cur.currentPlayerIndex, chosen.id);
  }, delay);
}

function _resolveTrick(get: () => GameStore, set: (s: Partial<GameStore>) => void) {
  const state = get();
  if (state.currentTrick.length < NUM_PLAYERS) return;

  const winner = getTrickWinner(state.currentTrick);
  const winnerIdx = state.players.findIndex(p => p.id === winner.playedBy);

  const trick: Trick = {
    cards: [...state.currentTrick],
    ledSuit: state.currentTrick[0].card.suit,
    winnerId: winner.playedBy,
  };

  const tricksByPlayer = new Map(state.tricksByPlayer);
  tricksByPlayer.set(winner.playedBy, [...(tricksByPlayer.get(winner.playedBy) || []), trick]);

  const players = state.players.map(p =>
    p.id === winner.playedBy ? { ...p, tricksWon: [...p.tricksWon, trick] } : { ...p }
  );

  const nextTrickNumber = state.trickNumber + 1;

  set({
    lastTrick: state.currentTrick,
    lastTrickWinner: winner.playedBy,
    players,
    tricksByPlayer,
    message: `${players[winnerIdx].name} takes the trick`,
  });

  setTimeout(() => {
    if (nextTrickNumber > 13) {
      _resolveHand(get, set);
    } else {
      const cur = get();
      const legalMoves = winnerIdx === cur.humanPlayerIndex
        ? getLegalMoves(players[winnerIdx].hand, [], false, cur.heartsBroken).map(c => c.id)
        : [];

      set({
        currentTrick: [],
        trickNumber: nextTrickNumber,
        currentPlayerIndex: winnerIdx,
        isFirstTrick: false,
        legalMoves,
        message: winnerIdx === cur.humanPlayerIndex ? 'Your turn to lead' : '',
      });

      if (players[winnerIdx].isBot) {
        _triggerBotPlay(get, set);
      }
    }
  }, 1200);
}

function _resolveHand(get: () => GameStore, set: (s: Partial<GameStore>) => void) {
  const state = get();
  const playerIds = state.players.map(p => p.id);
  const result = scoreHand(state.tricksByPlayer, playerIds, state.settings.jackOfDiamonds);

  let finalScores = result.scores;
  if (result.moonShooter) {
    finalScores = applyMoonScoring(result.scores, result.moonShooter, state.settings.moonScoringVariant);
  }

  const players = state.players.map(p => ({
    ...p,
    score: finalScores[p.id] || 0,
    totalScore: p.totalScore + (finalScores[p.id] || 0),
  }));

  const totalScores: Record<string, number> = {};
  players.forEach(p => { totalScores[p.id] = p.totalScore; });

  set({
    phase: GamePhase.SCORING,
    players,
    handScores: finalScores,
    moonShooter: result.moonShooter,
    currentTrick: [],
    message: result.moonShooter
      ? `${players.find(p => p.id === result.moonShooter)?.name} Shot the Moon!`
      : 'Hand complete',
  });

  setTimeout(() => {
    if (isGameOver(totalScores, state.settings.scoreLimit)) {
      const winners = getWinner(totalScores);
      set({ phase: GamePhase.GAME_OVER, gameWinner: winners[0], message: '' });
    } else {
      _startNewHand(get, set);
    }
  }, 3000);
}

// ── Store Creation ───────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  phase: GamePhase.WAITING,
  players: [],
  humanPlayerIndex: 0,
  roundNumber: 0,
  passDirection: PassDirection.NONE,
  currentTrick: [],
  trickNumber: 0,
  currentPlayerIndex: 0,
  heartsBroken: false,
  isFirstTrick: true,
  legalMoves: [],
  selectedPassCards: [],
  lastTrick: null,
  lastTrickWinner: null,
  moonShooter: null,
  handScores: null,
  gameWinner: null,
  message: '',
  isMultiplayer: false,
  settings: defaultSettings,
  tricksByPlayer: new Map(),

  startSoloGame: (difficulty, settings) => {
    const gameSettings = { ...defaultSettings, ...settings, botDifficulty: difficulty };
    const botNames = BOT_NAMES[difficulty];

    const players: PlayerData[] = [
      {
        id: 'human',
        name: localStorage.getItem('pixelhearts_name')?.replace(/"/g, '') || 'Player',
        position: PlayerPosition.SOUTH,
        hand: [], tricksWon: [], score: 0, totalScore: 0,
        isBot: false,
        avatar: parseInt(localStorage.getItem('pixelhearts_avatar')?.replace(/"/g, '') || '0'),
        cardCount: 0,
      },
      ...botNames.slice(0, 3).map((name, i) => ({
        id: `bot_${i}`,
        name,
        position: POSITIONS[i + 1],
        hand: [] as Card[], tricksWon: [] as Trick[], score: 0, totalScore: 0,
        isBot: true, botDifficulty: difficulty,
        avatar: (i + 4) % 12, cardCount: 0,
      })),
    ];

    set({
      players, settings: gameSettings, humanPlayerIndex: 0,
      isMultiplayer: false, gameWinner: null, roundNumber: 0,
    });

    setTimeout(() => _startNewHand(get, set), 300);
  },

  selectPassCard: (cardId) => {
    const state = get();
    if (state.phase !== GamePhase.PASSING) return;
    let selected = [...state.selectedPassCards];
    if (selected.includes(cardId)) {
      selected = selected.filter(id => id !== cardId);
    } else if (selected.length < 3) {
      selected.push(cardId);
    }
    set({ selectedPassCards: selected });
  },

  confirmPass: () => {
    const state = get();
    if (state.selectedPassCards.length !== 3) return;

    const players = state.players.map(p => ({ ...p, hand: [...p.hand] }));
    const passMap = new Map<number, Card[]>();

    // Human pass
    const humanCards: Card[] = [];
    for (const cid of state.selectedPassCards) {
      const card = removeCard(players[0].hand, cid);
      if (card) humanCards.push(card);
    }
    const humanTarget = getPassTargetIndex(0, state.passDirection);
    passMap.set(humanTarget, [...(passMap.get(humanTarget) || []), ...humanCards]);

    // Bot passes
    for (let i = 1; i < players.length; i++) {
      const botPassIds = players[i]._passCards || [];
      const botCards: Card[] = [];
      for (const cid of botPassIds) {
        const card = removeCard(players[i].hand, cid);
        if (card) botCards.push(card);
      }
      const target = getPassTargetIndex(i, state.passDirection);
      passMap.set(target, [...(passMap.get(target) || []), ...botCards]);
    }

    for (const [targetIdx, cards] of passMap) {
      players[targetIdx].hand.push(...cards);
      sortHand(players[targetIdx].hand);
      players[targetIdx].cardCount = players[targetIdx].hand.length;
    }
    for (const p of players) delete p._passCards;

    set({ players, selectedPassCards: [], message: '' });
    setTimeout(() => _startPlayPhase(get, set), 500);
  },

  playCard: (cardId) => {
    const state = get();
    if (state.phase !== GamePhase.PLAYING) return;
    if (state.currentPlayerIndex !== state.humanPlayerIndex) return;
    if (!state.legalMoves.includes(cardId)) return;
    _executePlay(get, set, state.humanPlayerIndex, cardId);
  },

  reset: () => {
    set({
      phase: GamePhase.WAITING, players: [], roundNumber: 0,
      currentTrick: [], trickNumber: 0, currentPlayerIndex: 0,
      selectedPassCards: [], lastTrick: null, lastTrickWinner: null,
      moonShooter: null, handScores: null, gameWinner: null,
      message: '', legalMoves: [], tricksByPlayer: new Map(),
    });
  },
}));
