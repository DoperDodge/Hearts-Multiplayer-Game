// ============================================================
// PIXEL HEARTS — Medium Bot ("Careful Carol")
// Basic avoidance strategy
// ============================================================

import { Card, Suit, Rank, BotDifficulty, isQueenOfSpades, isPenaltyCard } from '@shared/game-types';
import { BotPlayer, BotDecisionContext, BotPassContext } from './BotPlayer';

export class MediumBot extends BotPlayer {
  readonly difficulty = BotDifficulty.MEDIUM;
  readonly name: string;

  constructor(name?: string) {
    super();
    this.name = name || 'Careful Carol';
  }

  choosePassCards(ctx: BotPassContext): Card[] {
    const hand = [...ctx.hand];
    const toPass: Card[] = [];

    // Priority 1: Pass Queen of Spades
    const qs = hand.find(c => isQueenOfSpades(c));
    if (qs) {
      toPass.push(qs);
      hand.splice(hand.indexOf(qs), 1);
    }

    // Priority 2: Pass Ace and King of Spades
    for (const rank of [Rank.ACE, Rank.KING]) {
      if (toPass.length >= 3) break;
      const card = hand.find(c => c.suit === Suit.SPADES && c.rank === rank);
      if (card) {
        toPass.push(card);
        hand.splice(hand.indexOf(card), 1);
      }
    }

    // Priority 3: Pass high hearts
    const hearts = hand.filter(c => c.suit === Suit.HEARTS).sort((a, b) => b.rank - a.rank);
    for (const card of hearts) {
      if (toPass.length >= 3) break;
      toPass.push(card);
      hand.splice(hand.indexOf(card), 1);
    }

    // Priority 4: Pass any high cards
    const remaining = hand.sort((a, b) => b.rank - a.rank);
    for (const card of remaining) {
      if (toPass.length >= 3) break;
      toPass.push(card);
    }

    return toPass.slice(0, 3);
  }

  choosePlay(ctx: BotDecisionContext): Card {
    const { legalMoves, currentTrick } = ctx;

    if (legalMoves.length === 1) return legalMoves[0];

    // Leading
    if (currentTrick.length === 0) {
      return this.chooseLead(legalMoves);
    }

    // Following
    return this.chooseFollow(legalMoves, currentTrick);
  }

  private chooseLead(legalMoves: Card[]): Card {
    // Lead with lowest non-heart card
    const nonHearts = legalMoves.filter(c => c.suit !== Suit.HEARTS);
    if (nonHearts.length > 0) {
      return nonHearts.sort((a, b) => a.rank - b.rank)[0];
    }
    // Must lead hearts
    return legalMoves.sort((a, b) => a.rank - b.rank)[0];
  }

  private chooseFollow(legalMoves: Card[], currentTrick: { card: Card; playedBy: string }[]): Card {
    const ledSuit = currentTrick[0].card.suit;
    const followingSuit = legalMoves.some(c => c.suit === ledSuit);

    if (followingSuit) {
      // Try to duck under the current highest
      const currentHighest = Math.max(
        ...currentTrick.filter(tc => tc.card.suit === ledSuit).map(tc => tc.card.rank)
      );
      const canDuck = legalMoves.filter(c => c.rank < currentHighest);
      if (canDuck.length > 0) {
        // Play the highest card that still ducks
        return canDuck.sort((a, b) => b.rank - a.rank)[0];
      }
      // Must win — play the highest (eat the loss, get rid of danger)
      return legalMoves.sort((a, b) => b.rank - a.rank)[0];
    }

    // Void in led suit — slough penalty cards
    // Priority: QS > High hearts > Low hearts > High off-suit
    const qs = legalMoves.find(c => isQueenOfSpades(c));
    if (qs) return qs;

    const hearts = legalMoves.filter(c => c.suit === Suit.HEARTS).sort((a, b) => b.rank - a.rank);
    if (hearts.length > 0) return hearts[0];

    // Slough highest non-penalty card
    return legalMoves.sort((a, b) => b.rank - a.rank)[0];
  }
}
