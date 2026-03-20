// ============================================================
// Client-side Hearts Rules (mirrors server/src/game/HeartsRules.ts)
// ============================================================

import {
  Card, Suit, Rank, TrickCard, PassDirection,
  isPenaltyCard, isQueenOfSpades, isTwoOfClubs,
} from '@shared/game-types';

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

export function getPassTargetIndex(fromIndex: number, direction: PassDirection, numPlayers: number = 4): number {
  switch (direction) {
    case PassDirection.LEFT: return (fromIndex + 1) % numPlayers;
    case PassDirection.RIGHT: return (fromIndex + numPlayers - 1) % numPlayers;
    case PassDirection.ACROSS: return (fromIndex + numPlayers / 2) % numPlayers;
    case PassDirection.NONE: return fromIndex;
    default: return fromIndex;
  }
}

export function validatePass(selectedCardIds: string[], hand: Card[]): boolean {
  if (selectedCardIds.length !== 3) return false;
  const handIds = new Set(hand.map(c => c.id));
  return selectedCardIds.every(id => handIds.has(id)) && new Set(selectedCardIds).size === 3;
}

export function findStartingPlayer(hands: Card[][]): number {
  for (let i = 0; i < hands.length; i++) {
    if (hands[i].some(c => isTwoOfClubs(c))) return i;
  }
  return 0;
}

export function getLegalMoves(
  hand: Card[],
  currentTrick: TrickCard[],
  isFirstTrick: boolean,
  heartsBroken: boolean,
): Card[] {
  if (hand.length === 0) return [];

  if (currentTrick.length === 0) {
    if (isFirstTrick) {
      const twoOfClubs = hand.find(c => isTwoOfClubs(c));
      if (twoOfClubs) return [twoOfClubs];
    }
    if (!heartsBroken) {
      const nonHearts = hand.filter(c => c.suit !== Suit.HEARTS);
      if (nonHearts.length > 0) return nonHearts;
    }
    return [...hand];
  }

  const ledSuit = currentTrick[0].card.suit;
  const suitCards = hand.filter(c => c.suit === ledSuit);
  if (suitCards.length > 0) return suitCards;

  if (isFirstTrick) {
    const nonPenalty = hand.filter(c => !isPenaltyCard(c));
    if (nonPenalty.length > 0) return nonPenalty;
  }

  return [...hand];
}

export function isLegalMove(
  card: Card, hand: Card[], currentTrick: TrickCard[],
  isFirstTrick: boolean, heartsBroken: boolean,
): boolean {
  return getLegalMoves(hand, currentTrick, isFirstTrick, heartsBroken).some(c => c.id === card.id);
}

export function getTrickWinner(trick: TrickCard[]): TrickCard {
  const ledSuit = trick[0].card.suit;
  let winner = trick[0];
  for (let i = 1; i < trick.length; i++) {
    if (trick[i].card.suit === ledSuit && trick[i].card.rank > winner.card.rank) {
      winner = trick[i];
    }
  }
  return winner;
}

export function doesCardBreakHearts(card: Card): boolean {
  return card.suit === Suit.HEARTS || isQueenOfSpades(card);
}

export function calculateTrickPoints(cards: Card[], jackOfDiamonds: boolean = false): number {
  let points = 0;
  for (const card of cards) {
    if (card.suit === Suit.HEARTS) points += 1;
    if (isQueenOfSpades(card)) points += 13;
    if (jackOfDiamonds && card.suit === Suit.DIAMONDS && card.rank === Rank.JACK) points -= 10;
  }
  return points;
}
