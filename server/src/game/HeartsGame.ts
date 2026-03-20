// ============================================================
// PIXEL HEARTS — Hearts Game Engine (Server-Authoritative)
// ============================================================

import { EventEmitter } from 'events';
import {
  Card, Suit, Trick, TrickCard, GamePhase, PassDirection,
  GameSettings, MoonScoringVariant, isPenaltyCard, isTwoOfClubs,
} from '@shared/game-types';
import { NUM_PLAYERS, CARDS_PER_HAND, PASS_CARD_COUNT, DEFAULT_SCORE_LIMIT } from '@shared/constants';
import { createDeck, shuffleDeck, dealCards, sortHand, findCard, removeCard } from './Deck';
import {
  getPassDirection, getPassTargetIndex, validatePass,
  findStartingPlayer, getLegalMoves, isLegalMove,
  getTrickWinner, doesCardBreakHearts, calculateTrickPoints,
  getNextPlayerIndex,
} from './HeartsRules';
import { scoreHand, applyMoonScoring, isGameOver, getWinner, HandScoreResult } from './Scoring';

export interface GamePlayer {
  id: string;
  name: string;
  hand: Card[];
  tricksWon: Trick[];
  totalScore: number;
  isBot: boolean;
}

export type GameEventType =
  | 'deal'
  | 'passRequest'
  | 'passComplete'
  | 'turnStart'
  | 'cardPlayed'
  | 'trickComplete'
  | 'handComplete'
  | 'gameOver'
  | 'moonShot'
  | 'error';

export interface GameEvent {
  type: GameEventType;
  data: any;
}

export class HeartsGame extends EventEmitter {
  private players: GamePlayer[];
  private phase: GamePhase;
  private settings: GameSettings;
  private roundNumber: number;

  // Hand state
  private currentTrick: TrickCard[];
  private trickNumber: number;
  private currentPlayerIndex: number;
  private leadPlayerIndex: number;
  private heartsBroken: boolean;
  private isFirstTrick: boolean;
  private passDirection: PassDirection;
  private passSelections: Map<string, string[]>; // playerId → cardIds

  // Trick history for current hand
  private tricksByPlayer: Map<string, Trick[]>;
  private handScores: Map<string, number>;

  constructor(players: { id: string; name: string; isBot: boolean }[], settings: Partial<GameSettings> = {}) {
    super();

    if (players.length !== NUM_PLAYERS) {
      throw new Error(`Hearts requires exactly ${NUM_PLAYERS} players, got ${players.length}`);
    }

    this.players = players.map(p => ({
      id: p.id,
      name: p.name,
      hand: [],
      tricksWon: [],
      totalScore: 0,
      isBot: p.isBot,
    }));

    this.settings = {
      scoreLimit: settings.scoreLimit ?? DEFAULT_SCORE_LIMIT,
      jackOfDiamonds: settings.jackOfDiamonds ?? false,
      moonScoringVariant: settings.moonScoringVariant ?? MoonScoringVariant.ADD_TO_OTHERS,
      noPointsOnFirstTrick: settings.noPointsOnFirstTrick ?? false,
      queenBreaksHearts: settings.queenBreaksHearts ?? true,
      botDifficulty: settings.botDifficulty ?? 'MEDIUM' as any,
      turnTimeout: settings.turnTimeout ?? 60000,
      animationSpeed: settings.animationSpeed ?? 'normal',
    };

    this.phase = GamePhase.WAITING;
    this.roundNumber = 0;
    this.currentTrick = [];
    this.trickNumber = 0;
    this.currentPlayerIndex = 0;
    this.leadPlayerIndex = 0;
    this.heartsBroken = false;
    this.isFirstTrick = true;
    this.passDirection = PassDirection.LEFT;
    this.passSelections = new Map();
    this.tricksByPlayer = new Map();
    this.handScores = new Map();
  }

  // ── Getters ────────────────────────────────────────────

  getPhase(): GamePhase { return this.phase; }
  getRoundNumber(): number { return this.roundNumber; }
  getPassDirection(): PassDirection { return this.passDirection; }
  getCurrentPlayerIndex(): number { return this.currentPlayerIndex; }
  getCurrentPlayerId(): string { return this.players[this.currentPlayerIndex].id; }
  getCurrentTrick(): TrickCard[] { return [...this.currentTrick]; }
  getTrickNumber(): number { return this.trickNumber; }
  isHeartsBroken(): boolean { return this.heartsBroken; }
  getIsFirstTrick(): boolean { return this.isFirstTrick; }

  getPlayer(playerId: string): GamePlayer | undefined {
    return this.players.find(p => p.id === playerId);
  }

  getPlayerIndex(playerId: string): number {
    return this.players.findIndex(p => p.id === playerId);
  }

  getPlayerHand(playerId: string): Card[] {
    const player = this.getPlayer(playerId);
    return player ? [...player.hand] : [];
  }

  getPlayers(): GamePlayer[] {
    return this.players.map(p => ({ ...p, hand: [...p.hand] }));
  }

  getTotalScores(): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const p of this.players) {
      scores[p.id] = p.totalScore;
    }
    return scores;
  }

  getLegalMovesFor(playerId: string): Card[] {
    const player = this.getPlayer(playerId);
    if (!player) return [];
    if (this.phase !== GamePhase.PLAYING) return [];
    if (this.players[this.currentPlayerIndex].id !== playerId) return [];

    return getLegalMoves(
      player.hand,
      this.currentTrick,
      this.isFirstTrick,
      this.heartsBroken,
      this.settings.noPointsOnFirstTrick,
    );
  }

  // ── Game Flow ──────────────────────────────────────────

  /**
   * Start a new hand (deal, then pass or play).
   */
  startNewHand(): void {
    this.roundNumber++;
    this.phase = GamePhase.DEALING;

    // Reset hand state
    this.currentTrick = [];
    this.trickNumber = 0;
    this.heartsBroken = false;
    this.isFirstTrick = true;
    this.passSelections.clear();
    this.tricksByPlayer.clear();
    this.handScores.clear();

    for (const p of this.players) {
      p.tricksWon = [];
      this.tricksByPlayer.set(p.id, []);
    }

    // Deal
    const deck = shuffleDeck(createDeck());
    const hands = dealCards(deck, NUM_PLAYERS);
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].hand = hands[i];
    }

    this.passDirection = getPassDirection(this.roundNumber);

    this.emit('deal', {
      roundNumber: this.roundNumber,
      passDirection: this.passDirection,
      hands: this.players.map(p => ({ playerId: p.id, hand: [...p.hand] })),
    });

    // Start pass phase or go directly to play
    if (this.passDirection === PassDirection.NONE) {
      this.startPlay();
    } else {
      this.phase = GamePhase.PASSING;
      this.emit('passRequest', {
        passDirection: this.passDirection,
      });
    }
  }

  /**
   * Submit pass cards for a player.
   */
  submitPass(playerId: string, cardIds: string[]): { success: boolean; error?: string } {
    if (this.phase !== GamePhase.PASSING) {
      return { success: false, error: 'Not in passing phase' };
    }

    if (this.passSelections.has(playerId)) {
      return { success: false, error: 'Already submitted pass' };
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    const validation = validatePass(cardIds, player.hand);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    this.passSelections.set(playerId, cardIds);

    // Check if all players have submitted
    if (this.passSelections.size === NUM_PLAYERS) {
      this.executePass();
    }

    return { success: true };
  }

  /**
   * Execute the pass: move cards between players.
   */
  private executePass(): void {
    const passedCards: Map<string, Card[]> = new Map(); // receiver → cards

    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      const cardIds = this.passSelections.get(player.id)!;
      const targetIndex = getPassTargetIndex(i, this.passDirection);
      const receiver = this.players[targetIndex];

      const cards: Card[] = [];
      for (const cid of cardIds) {
        const card = removeCard(player.hand, cid);
        if (card) cards.push(card);
      }

      const existing = passedCards.get(receiver.id) || [];
      passedCards.set(receiver.id, [...existing, ...cards]);
    }

    // Add received cards to each player's hand
    for (const [receiverId, cards] of passedCards) {
      const player = this.getPlayer(receiverId)!;
      player.hand.push(...cards);
      sortHand(player.hand);
    }

    this.emit('passComplete', {
      passedCards: Object.fromEntries(passedCards),
      hands: this.players.map(p => ({ playerId: p.id, hand: [...p.hand] })),
    });

    this.startPlay();
  }

  /**
   * Begin the play phase. Find who has the 2 of Clubs.
   */
  private startPlay(): void {
    this.phase = GamePhase.PLAYING;
    this.trickNumber = 1;
    this.isFirstTrick = true;

    const startIdx = findStartingPlayer(this.players.map(p => p.hand));
    this.currentPlayerIndex = startIdx;
    this.leadPlayerIndex = startIdx;

    this.emitTurnStart();
  }

  /**
   * Emit a turn start event for the current player.
   */
  private emitTurnStart(): void {
    const player = this.players[this.currentPlayerIndex];
    const legalMoves = getLegalMoves(
      player.hand,
      this.currentTrick,
      this.isFirstTrick,
      this.heartsBroken,
      this.settings.noPointsOnFirstTrick,
    );

    this.emit('turnStart', {
      playerId: player.id,
      legalMoves: legalMoves.map(c => c.id),
      currentTrick: [...this.currentTrick],
      trickNumber: this.trickNumber,
      isBot: player.isBot,
    });
  }

  /**
   * Play a card for the current player.
   */
  playCard(playerId: string, cardId: string): { success: boolean; error?: string } {
    if (this.phase !== GamePhase.PLAYING) {
      return { success: false, error: 'Not in playing phase' };
    }

    const player = this.players[this.currentPlayerIndex];
    if (player.id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    const card = findCard(player.hand, cardId);
    if (!card) {
      return { success: false, error: 'Card not in your hand' };
    }

    if (!isLegalMove(card, player.hand, this.currentTrick, this.isFirstTrick, this.heartsBroken, this.settings.noPointsOnFirstTrick)) {
      return { success: false, error: 'Illegal move' };
    }

    // Remove card from hand
    removeCard(player.hand, cardId);

    // Set led suit
    if (this.currentTrick.length === 0) {
      // Leading the trick
    }

    // Check if this breaks hearts
    if (!this.heartsBroken && this.currentTrick.length > 0) {
      // Only breaks if discarding (not following suit)
      const ledSuit = this.currentTrick[0].card.suit;
      if (card.suit !== ledSuit && doesCardBreakHearts(card, this.currentTrick, this.settings.queenBreaksHearts)) {
        this.heartsBroken = true;
      }
    }

    // Add to trick
    this.currentTrick.push({ card, playedBy: playerId });

    this.emit('cardPlayed', {
      playerId,
      card,
      trickComplete: this.currentTrick.length === NUM_PLAYERS,
    });

    // Check if trick is complete
    if (this.currentTrick.length === NUM_PLAYERS) {
      this.resolveTrick();
    } else {
      // Next player
      this.currentPlayerIndex = getNextPlayerIndex(this.currentPlayerIndex);
      this.emitTurnStart();
    }

    return { success: true };
  }

  /**
   * Resolve a completed trick.
   */
  private resolveTrick(): void {
    const winner = getTrickWinner(this.currentTrick);
    const winnerIndex = this.getPlayerIndex(winner.playedBy);
    const points = calculateTrickPoints(
      this.currentTrick.map(tc => tc.card),
      this.settings.jackOfDiamonds,
    );

    const trick: Trick = {
      cards: [...this.currentTrick],
      ledSuit: this.currentTrick[0].card.suit,
      winnerId: winner.playedBy,
    };

    // Store trick
    const winnerPlayer = this.players[winnerIndex];
    winnerPlayer.tricksWon.push(trick);
    this.tricksByPlayer.get(winner.playedBy)!.push(trick);

    this.emit('trickComplete', {
      winnerId: winner.playedBy,
      trick,
      points,
      heartsBroken: this.heartsBroken,
      trickNumber: this.trickNumber,
    });

    // Reset for next trick
    this.currentTrick = [];
    this.trickNumber++;
    this.isFirstTrick = false;

    // Check if hand is complete (13 tricks played)
    if (this.trickNumber > CARDS_PER_HAND) {
      this.resolveHand();
    } else {
      // Winner leads next trick
      this.currentPlayerIndex = winnerIndex;
      this.leadPlayerIndex = winnerIndex;
      this.emitTurnStart();
    }
  }

  /**
   * Resolve a completed hand (all 13 tricks played).
   */
  private resolveHand(): void {
    this.phase = GamePhase.SCORING;

    const playerIds = this.players.map(p => p.id);
    const result = scoreHand(this.tricksByPlayer, playerIds, this.settings.jackOfDiamonds);

    let finalScores = result.scores;

    // Handle moon
    if (result.moonShooter) {
      if (this.settings.moonScoringVariant !== MoonScoringVariant.PLAYER_CHOICE) {
        finalScores = applyMoonScoring(
          result.scores,
          result.moonShooter,
          this.settings.moonScoringVariant,
          this.getTotalScores(),
          this.settings.scoreLimit,
        );
      }

      this.emit('moonShot', {
        shooterId: result.moonShooter,
        shooterName: this.getPlayer(result.moonShooter)?.name,
      });
    }

    // Apply scores
    for (const player of this.players) {
      player.totalScore += finalScores[player.id] || 0;
    }

    const totalScores = this.getTotalScores();

    this.emit('handComplete', {
      scores: finalScores,
      totalScores,
      moonShooter: result.moonShooter,
      details: result.details,
    });

    // Check game over
    if (isGameOver(totalScores, this.settings.scoreLimit)) {
      this.endGame();
    }
    // Otherwise, wait for external call to startNewHand()
  }

  /**
   * End the game.
   */
  private endGame(): void {
    this.phase = GamePhase.GAME_OVER;
    const totalScores = this.getTotalScores();
    const winners = getWinner(totalScores);

    this.emit('gameOver', {
      finalScores: totalScores,
      winnerId: winners[0],
      winnerName: this.getPlayer(winners[0])?.name,
      winners,
    });
  }

  /**
   * Get a full state snapshot for reconnection.
   */
  getStateSnapshot(forPlayerId: string): any {
    const player = this.getPlayer(forPlayerId);
    return {
      phase: this.phase,
      roundNumber: this.roundNumber,
      passDirection: this.passDirection,
      hand: player ? [...player.hand] : [],
      currentTrick: [...this.currentTrick],
      trickNumber: this.trickNumber,
      heartsBroken: this.heartsBroken,
      isFirstTrick: this.isFirstTrick,
      isYourTurn: this.players[this.currentPlayerIndex]?.id === forPlayerId,
      legalMoves: this.getLegalMovesFor(forPlayerId).map(c => c.id),
      scores: this.getTotalScores(),
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        cardCount: p.hand.length,
        totalScore: p.totalScore,
        isBot: p.isBot,
      })),
    };
  }

  /**
   * Auto-play for a bot or timed-out player (lowest legal card).
   */
  autoPlay(playerId: string): { success: boolean; error?: string } {
    const legalMoves = this.getLegalMovesFor(playerId);
    if (legalMoves.length === 0) {
      return { success: false, error: 'No legal moves' };
    }
    // Play the lowest ranked legal card
    const sorted = [...legalMoves].sort((a, b) => a.rank - b.rank);
    return this.playCard(playerId, sorted[0].id);
  }
}
