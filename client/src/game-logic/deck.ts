// ============================================================
// Client-side Deck (browser-safe, no Node crypto)
// ============================================================

import { Card, Suit, Rank, SUIT_ORDER, cardId } from '@shared/game-types';

const ALL_RANKS: Rank[] = [
  Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN,
  Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE,
];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUIT_ORDER) {
    for (const rank of ALL_RANKS) {
      deck.push({ suit, rank, id: cardId(suit, rank) });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], numPlayers: number = 4): Card[][] {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  for (let i = 0; i < deck.length; i++) {
    hands[i % numPlayers].push(deck[i]);
  }
  for (const hand of hands) sortHand(hand);
  return hands;
}

export function sortHand(hand: Card[]): void {
  const suitOrder = { [Suit.CLUBS]: 0, [Suit.DIAMONDS]: 1, [Suit.SPADES]: 2, [Suit.HEARTS]: 3 };
  hand.sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
    return a.rank - b.rank;
  });
}

export function findCard(hand: Card[], cid: string): Card | undefined {
  return hand.find(c => c.id === cid);
}

export function removeCard(hand: Card[], cid: string): Card | null {
  const idx = hand.findIndex(c => c.id === cid);
  if (idx === -1) return null;
  return hand.splice(idx, 1)[0];
}
