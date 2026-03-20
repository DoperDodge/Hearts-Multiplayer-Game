// ============================================================
// PIXEL HEARTS — Deck: Create, Shuffle, Deal
// ============================================================

import { Card, Suit, Rank, SUIT_ORDER, cardId } from '@shared/game-types';
import { CARDS_PER_HAND, NUM_PLAYERS, TOTAL_CARDS } from '@shared/constants';
import crypto from 'crypto';

const ALL_RANKS: Rank[] = [
  Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN,
  Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE,
];

/**
 * Create a standard 52-card deck.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUIT_ORDER) {
    for (const rank of ALL_RANKS) {
      deck.push({
        suit,
        rank,
        id: cardId(suit, rank),
      });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle with cryptographically secure random.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomBytes = crypto.randomBytes(4);
    const j = randomBytes.readUInt32BE(0) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal cards evenly to N players.
 * Returns an array of hands (one per player).
 */
export function dealCards(deck: Card[], numPlayers: number = NUM_PLAYERS): Card[][] {
  if (deck.length !== TOTAL_CARDS) {
    throw new Error(`Expected ${TOTAL_CARDS} cards, got ${deck.length}`);
  }
  if (TOTAL_CARDS % numPlayers !== 0) {
    throw new Error(`Cannot deal ${TOTAL_CARDS} cards evenly to ${numPlayers} players`);
  }

  const cardsPerPlayer = Math.floor(TOTAL_CARDS / numPlayers);
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);

  // Deal one card at a time clockwise
  for (let i = 0; i < deck.length; i++) {
    hands[i % numPlayers].push(deck[i]);
  }

  // Sort each hand by suit then rank
  for (const hand of hands) {
    sortHand(hand);
  }

  return hands;
}

/**
 * Sort a hand by suit order (Clubs, Diamonds, Spades, Hearts) then rank ascending.
 */
export function sortHand(hand: Card[]): void {
  const suitOrder = { [Suit.CLUBS]: 0, [Suit.DIAMONDS]: 1, [Suit.SPADES]: 2, [Suit.HEARTS]: 3 };
  hand.sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return a.rank - b.rank;
  });
}

/**
 * Find a card in a hand by ID.
 */
export function findCard(hand: Card[], cardId: string): Card | undefined {
  return hand.find(c => c.id === cardId);
}

/**
 * Remove a card from a hand by ID. Returns the removed card.
 */
export function removeCard(hand: Card[], cardId: string): Card | null {
  const index = hand.findIndex(c => c.id === cardId);
  if (index === -1) return null;
  return hand.splice(index, 1)[0];
}
