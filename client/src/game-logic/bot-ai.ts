// ============================================================
// Client-side Bot AI (all three difficulties)
// ============================================================

import {
  Card, Suit, Rank, TrickCard, BotDifficulty,
  isPenaltyCard, isQueenOfSpades,
} from '@shared/game-types';
import { getLegalMoves } from './rules';

export interface BotContext {
  hand: Card[];
  currentTrick: TrickCard[];
  isFirstTrick: boolean;
  heartsBroken: boolean;
  legalMoves: Card[];
}

/**
 * Choose cards to pass based on difficulty.
 */
export function chooseBotPassCards(hand: Card[], difficulty: BotDifficulty): Card[] {
  switch (difficulty) {
    case BotDifficulty.EASY:
      return easyPass(hand);
    case BotDifficulty.MEDIUM:
      return mediumPass(hand);
    case BotDifficulty.HARD:
      return hardPass(hand);
    default:
      return easyPass(hand);
  }
}

/**
 * Choose a card to play based on difficulty.
 */
export function chooseBotPlay(ctx: BotContext, difficulty: BotDifficulty): Card {
  if (ctx.legalMoves.length === 1) return ctx.legalMoves[0];

  switch (difficulty) {
    case BotDifficulty.EASY:
      return easyPlay(ctx);
    case BotDifficulty.MEDIUM:
      return mediumPlay(ctx);
    case BotDifficulty.HARD:
      return hardPlay(ctx);
    default:
      return easyPlay(ctx);
  }
}

// ── Easy Bot ─────────────────────────────────────────────

function easyPass(hand: Card[]): Card[] {
  const shuffled = [...hand].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function easyPlay(ctx: BotContext): Card {
  return ctx.legalMoves[Math.floor(Math.random() * ctx.legalMoves.length)];
}

// ── Medium Bot ───────────────────────────────────────────

function mediumPass(hand: Card[]): Card[] {
  const toPass: Card[] = [];
  const remaining = [...hand];

  // Pass QS, AKS, high hearts
  const priorities = [
    (c: Card) => isQueenOfSpades(c),
    (c: Card) => c.suit === Suit.SPADES && c.rank === Rank.ACE,
    (c: Card) => c.suit === Suit.SPADES && c.rank === Rank.KING,
    (c: Card) => c.suit === Suit.HEARTS && c.rank === Rank.ACE,
    (c: Card) => c.suit === Suit.HEARTS && c.rank === Rank.KING,
    (c: Card) => c.suit === Suit.HEARTS && c.rank === Rank.QUEEN,
  ];

  for (const test of priorities) {
    if (toPass.length >= 3) break;
    const idx = remaining.findIndex(test);
    if (idx >= 0) {
      toPass.push(remaining.splice(idx, 1)[0]);
    }
  }

  // Fill with highest cards
  remaining.sort((a, b) => b.rank - a.rank);
  while (toPass.length < 3 && remaining.length > 0) {
    toPass.push(remaining.shift()!);
  }

  return toPass.slice(0, 3);
}

function mediumPlay(ctx: BotContext): Card {
  const { legalMoves, currentTrick } = ctx;

  if (currentTrick.length === 0) {
    // Lead lowest non-heart
    const nonHearts = legalMoves.filter(c => c.suit !== Suit.HEARTS);
    const pool = nonHearts.length > 0 ? nonHearts : legalMoves;
    return pool.sort((a, b) => a.rank - b.rank)[0];
  }

  const ledSuit = currentTrick[0].card.suit;
  const followingSuit = legalMoves.some(c => c.suit === ledSuit);

  if (followingSuit) {
    const currentMax = Math.max(
      ...currentTrick.filter(tc => tc.card.suit === ledSuit).map(tc => tc.card.rank)
    );
    const canDuck = legalMoves.filter(c => c.rank < currentMax);
    if (canDuck.length > 0) return canDuck.sort((a, b) => b.rank - a.rank)[0];
    return legalMoves.sort((a, b) => b.rank - a.rank)[0];
  }

  // Void — slough penalty cards
  const qs = legalMoves.find(c => isQueenOfSpades(c));
  if (qs) return qs;
  const hearts = legalMoves.filter(c => c.suit === Suit.HEARTS).sort((a, b) => b.rank - a.rank);
  if (hearts.length > 0) return hearts[0];
  return legalMoves.sort((a, b) => b.rank - a.rank)[0];
}

// ── Hard Bot ─────────────────────────────────────────────

function hardPass(hand: Card[]): Card[] {
  // Similar to medium but tries to void a suit
  const toPass: Card[] = [];
  const remaining = [...hand];

  // Try to pass QS
  const qsIdx = remaining.findIndex(c => isQueenOfSpades(c));
  if (qsIdx >= 0) toPass.push(remaining.splice(qsIdx, 1)[0]);

  // Try to void a short suit (not hearts)
  const suitCounts: Record<string, number> = {};
  for (const s of [Suit.CLUBS, Suit.DIAMONDS, Suit.SPADES]) {
    suitCounts[s] = remaining.filter(c => c.suit === s).length;
  }
  const shortSuit = Object.entries(suitCounts)
    .filter(([, count]) => count > 0 && count <= 3 - toPass.length)
    .sort((a, b) => a[1] - b[1])[0];

  if (shortSuit) {
    const suitCards = remaining.filter(c => c.suit === shortSuit[0]);
    for (const card of suitCards) {
      if (toPass.length >= 3) break;
      toPass.push(card);
      remaining.splice(remaining.indexOf(card), 1);
    }
  }

  // Pass high spades and hearts
  for (const rank of [Rank.ACE, Rank.KING]) {
    if (toPass.length >= 3) break;
    const idx = remaining.findIndex(c => c.suit === Suit.SPADES && c.rank === rank);
    if (idx >= 0) toPass.push(remaining.splice(idx, 1)[0]);
  }

  const highHearts = remaining.filter(c => c.suit === Suit.HEARTS).sort((a, b) => b.rank - a.rank);
  for (const card of highHearts) {
    if (toPass.length >= 3) break;
    toPass.push(card);
    remaining.splice(remaining.indexOf(card), 1);
  }

  remaining.sort((a, b) => b.rank - a.rank);
  while (toPass.length < 3 && remaining.length > 0) {
    toPass.push(remaining.shift()!);
  }

  return toPass.slice(0, 3);
}

function hardPlay(ctx: BotContext): Card {
  const { legalMoves, currentTrick } = ctx;

  if (currentTrick.length === 0) {
    // Lead from a suit with many remaining high cards opponent must have
    const nonHearts = legalMoves.filter(c => c.suit !== Suit.HEARTS);
    const pool = nonHearts.length > 0 ? nonHearts : legalMoves;
    // Lead low to flush out high cards
    return pool.sort((a, b) => a.rank - b.rank)[0];
  }

  const ledSuit = currentTrick[0].card.suit;
  const followingSuit = legalMoves.some(c => c.suit === ledSuit);
  const isLast = currentTrick.length === 3;

  if (followingSuit) {
    const currentMax = Math.max(
      ...currentTrick.filter(tc => tc.card.suit === ledSuit).map(tc => tc.card.rank)
    );

    if (isLast) {
      // Last to play — check if trick has points
      const trickHasPoints = currentTrick.some(tc =>
        tc.card.suit === Suit.HEARTS || isQueenOfSpades(tc.card)
      );
      if (!trickHasPoints) {
        // Safe to play high
        return legalMoves.sort((a, b) => b.rank - a.rank)[0];
      }
    }

    // Try to duck
    const canDuck = legalMoves.filter(c => c.rank < currentMax);
    if (canDuck.length > 0) return canDuck.sort((a, b) => b.rank - a.rank)[0];
    return legalMoves.sort((a, b) => a.rank - b.rank)[0];
  }

  // Void — prioritized dump
  const qs = legalMoves.find(c => isQueenOfSpades(c));
  if (qs) return qs;

  const highHearts = legalMoves.filter(c => c.suit === Suit.HEARTS).sort((a, b) => b.rank - a.rank);
  if (highHearts.length > 0) return highHearts[0];

  const highSpades = legalMoves.filter(c => c.suit === Suit.SPADES && c.rank >= Rank.KING)
    .sort((a, b) => b.rank - a.rank);
  if (highSpades.length > 0) return highSpades[0];

  return legalMoves.sort((a, b) => b.rank - a.rank)[0];
}

/**
 * Get a random bot thinking delay.
 */
export function getBotDelay(difficulty: BotDifficulty): number {
  switch (difficulty) {
    case BotDifficulty.EASY: return 1000 + Math.random() * 1500;
    case BotDifficulty.MEDIUM: return 800 + Math.random() * 1000;
    case BotDifficulty.HARD: return 1200 + Math.random() * 1800;
    default: return 1000;
  }
}
