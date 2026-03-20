// ============================================================
// PIXEL HEARTS — Hearts Rules Engine
// ============================================================
// This is the authoritative rules implementation. Every game
// logic decision flows through this module.

import {
  Card, Suit, Rank, Trick, TrickCard, PassDirection,
  isPenaltyCard, isQueenOfSpades, isTwoOfClubs,
} from '@shared/game-types';
import { PASS_CARD_COUNT, NUM_PLAYERS } from '@shared/constants';

// ── Pass Direction ─────────────────────────────────────────

/**
 * Get pass direction for the given round number (1-indexed).
 * Cycle: LEFT, RIGHT, ACROSS, NONE, LEFT, RIGHT, ...
 */
export function getPassDirection(roundNumber: number): PassDirection {
  const cycle = (roundNumber - 1) % 4;
  switch (cycle) {
    case 0: return PassDirection.LEFT;
    case 1: return PassDirection.RIGHT;
    case 2: return PassDirection.ACROSS;
    case 3: return PassDirection.NONE;
    default: return PassDirection.LEFT;
  }
}

/**
 * Get the index of the player receiving the passed cards.
 * @param fromIndex The index of the passing player (0-3)
 * @param direction The pass direction
 * @param numPlayers Total players (default 4)
 */
export function getPassTargetIndex(
  fromIndex: number,
  direction: PassDirection,
  numPlayers: number = NUM_PLAYERS
): number {
  switch (direction) {
    case PassDirection.LEFT:
      return (fromIndex + 1) % numPlayers;
    case PassDirection.RIGHT:
      return (fromIndex + numPlayers - 1) % numPlayers;
    case PassDirection.ACROSS:
      return (fromIndex + numPlayers / 2) % numPlayers;
    case PassDirection.NONE:
      return fromIndex; // no pass
    default:
      return fromIndex;
  }
}

/**
 * Validate that a pass selection is legal.
 */
export function validatePass(selectedCardIds: string[], hand: Card[]): { valid: boolean; error?: string } {
  if (selectedCardIds.length !== PASS_CARD_COUNT) {
    return { valid: false, error: `Must select exactly ${PASS_CARD_COUNT} cards to pass` };
  }

  // Check all selected cards are in hand
  const handIds = new Set(hand.map(c => c.id));
  for (const id of selectedCardIds) {
    if (!handIds.has(id)) {
      return { valid: false, error: `Card ${id} is not in your hand` };
    }
  }

  // Check no duplicates
  if (new Set(selectedCardIds).size !== selectedCardIds.length) {
    return { valid: false, error: 'Cannot pass duplicate cards' };
  }

  return { valid: true };
}

// ── Starting Player ────────────────────────────────────────

/**
 * Find which player holds the 2 of Clubs.
 * @returns The player index (0-based)
 */
export function findStartingPlayer(hands: Card[][]): number {
  for (let i = 0; i < hands.length; i++) {
    if (hands[i].some(c => isTwoOfClubs(c))) {
      return i;
    }
  }
  throw new Error('No player has the 2 of Clubs — deck is invalid');
}

// ── Legal Move Validation ──────────────────────────────────

/**
 * Get all legal moves for a player given the current game state.
 */
export function getLegalMoves(
  hand: Card[],
  currentTrick: TrickCard[],
  isFirstTrick: boolean,
  heartsBroken: boolean,
  noPointsOnFirstTrick: boolean = false,
): Card[] {
  if (hand.length === 0) return [];

  // If this player is leading (first card of the trick)
  if (currentTrick.length === 0) {
    return getLegalLeadMoves(hand, isFirstTrick, heartsBroken);
  }

  // Following suit
  return getLegalFollowMoves(hand, currentTrick, isFirstTrick, noPointsOnFirstTrick);
}

/**
 * Get legal cards when leading a trick.
 */
function getLegalLeadMoves(
  hand: Card[],
  isFirstTrick: boolean,
  heartsBroken: boolean,
): Card[] {
  // First trick: must lead 2 of Clubs
  if (isFirstTrick) {
    const twoOfClubs = hand.find(c => isTwoOfClubs(c));
    if (twoOfClubs) return [twoOfClubs];
    // Should never happen in a valid game
    throw new Error('First trick leader must have 2 of Clubs');
  }

  // Cannot lead hearts unless broken (or hand is ALL hearts)
  if (!heartsBroken) {
    const nonHearts = hand.filter(c => c.suit !== Suit.HEARTS);
    if (nonHearts.length > 0) {
      return nonHearts;
    }
    // Hand is all hearts — can lead hearts even if not broken
  }

  return [...hand];
}

/**
 * Get legal cards when following (not leading).
 */
function getLegalFollowMoves(
  hand: Card[],
  currentTrick: TrickCard[],
  isFirstTrick: boolean,
  noPointsOnFirstTrick: boolean,
): Card[] {
  const ledSuit = currentTrick[0].card.suit;

  // Must follow suit if possible
  const suitCards = hand.filter(c => c.suit === ledSuit);
  if (suitCards.length > 0) {
    return suitCards;
  }

  // Void in led suit — can play anything, BUT first trick has restrictions
  if (isFirstTrick) {
    // On the first trick, cannot play penalty cards UNLESS hand is all penalty cards
    const nonPenaltyCards = hand.filter(c => !isPenaltyCard(c));
    if (nonPenaltyCards.length > 0) {
      if (noPointsOnFirstTrick) {
        return nonPenaltyCards;
      }
      // Standard rule: can't play hearts or QS on first trick
      return nonPenaltyCards;
    }
    // Hand is ALL penalty cards — must play one (forced)
  }

  // Not first trick, void in led suit — any card is legal
  return [...hand];
}

/**
 * Check if a specific card is a legal move.
 */
export function isLegalMove(
  card: Card,
  hand: Card[],
  currentTrick: TrickCard[],
  isFirstTrick: boolean,
  heartsBroken: boolean,
  noPointsOnFirstTrick: boolean = false,
): boolean {
  const legalMoves = getLegalMoves(hand, currentTrick, isFirstTrick, heartsBroken, noPointsOnFirstTrick);
  return legalMoves.some(c => c.id === card.id);
}

// ── Trick Resolution ───────────────────────────────────────

/**
 * Determine the winner of a completed trick.
 * Winner is the player who played the highest card of the led suit.
 * @returns The TrickCard of the winner.
 */
export function getTrickWinner(trick: TrickCard[]): TrickCard {
  if (trick.length === 0) throw new Error('Trick is empty');

  const ledSuit = trick[0].card.suit;

  let winner = trick[0];
  for (let i = 1; i < trick.length; i++) {
    if (trick[i].card.suit === ledSuit && trick[i].card.rank > winner.card.rank) {
      winner = trick[i];
    }
  }

  return winner;
}

/**
 * Check if playing a card breaks hearts.
 * Hearts are broken when a heart or the Queen of Spades is discarded
 * (played when the player is void in the led suit).
 */
export function doesCardBreakHearts(
  card: Card,
  currentTrick: TrickCard[],
  queenBreaksHearts: boolean = true,
): boolean {
  if (card.suit === Suit.HEARTS) return true;
  if (queenBreaksHearts && isQueenOfSpades(card)) return true;
  return false;
}

/**
 * Calculate the penalty points in a set of cards.
 */
export function calculateTrickPoints(cards: Card[], jackOfDiamonds: boolean = false): number {
  let points = 0;
  for (const card of cards) {
    if (card.suit === Suit.HEARTS) {
      points += 1;
    }
    if (isQueenOfSpades(card)) {
      points += 13;
    }
    if (jackOfDiamonds && card.suit === Suit.DIAMONDS && card.rank === Rank.JACK) {
      points -= 10;
    }
  }
  return points;
}

/**
 * Get the next player index (clockwise).
 */
export function getNextPlayerIndex(currentIndex: number, numPlayers: number = NUM_PLAYERS): number {
  return (currentIndex + 1) % numPlayers;
}
