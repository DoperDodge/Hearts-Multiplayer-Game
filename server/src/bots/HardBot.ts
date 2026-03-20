// ============================================================
// PIXEL HEARTS — Hard Bot ("Ruthless Rick")
// Card counting + positional play + moon awareness
// ============================================================

import {
  Card, Suit, Rank, BotDifficulty, TrickCard,
  isQueenOfSpades, isPenaltyCard, isTwoOfClubs, SUIT_ORDER,
} from '@shared/game-types';
import { BotPlayer, BotDecisionContext, BotPassContext } from './BotPlayer';
import { TOTAL_PENALTY_POINTS } from '@shared/constants';

export class HardBot extends BotPlayer {
  readonly difficulty = BotDifficulty.HARD;
  readonly name: string;

  // Card tracking state (reset each hand)
  private playedCards: Set<string> = new Set();
  private voidSuits: Map<string, Set<Suit>> = new Map(); // playerId → suits they're void in
  private pointsTaken: Map<string, number> = new Map();

  constructor(name?: string) {
    super();
    this.name = name || 'Ruthless Rick';
  }

  resetTracking(): void {
    this.playedCards.clear();
    this.voidSuits.clear();
    this.pointsTaken.clear();
  }

  trackCardPlayed(card: Card, playedBy: string, ledSuit: Suit): void {
    this.playedCards.add(card.id);

    // Track void suits
    if (card.suit !== ledSuit) {
      if (!this.voidSuits.has(playedBy)) {
        this.voidSuits.set(playedBy, new Set());
      }
      this.voidSuits.get(playedBy)!.add(ledSuit);
    }

    // Track points
    let points = 0;
    if (card.suit === Suit.HEARTS) points = 1;
    if (isQueenOfSpades(card)) points = 13;
    // We'd need trick context for accurate point tracking per player
  }

  choosePassCards(ctx: BotPassContext): Card[] {
    this.resetTracking();
    const hand = [...ctx.hand];

    // Evaluate: can we shoot the moon?
    if (this.canAttemptMoon(hand)) {
      return this.passForMoon(hand);
    }

    return this.passForSafety(hand);
  }

  private canAttemptMoon(hand: Card[]): boolean {
    const hearts = hand.filter(c => c.suit === Suit.HEARTS);
    const highHearts = hearts.filter(c => c.rank >= Rank.QUEEN);
    const hasQS = hand.some(c => isQueenOfSpades(c));
    const highSpades = hand.filter(c => c.suit === Suit.SPADES && c.rank >= Rank.QUEEN);

    // Need most high hearts + control cards
    return hearts.length >= 8 && highHearts.length >= 3 && (hasQS || highSpades.length >= 2);
  }

  private passForMoon(hand: Card[]): Card[] {
    // Keep hearts and high cards, pass low off-suit cards
    const sorted = [...hand].sort((a, b) => {
      if (isPenaltyCard(a) && !isPenaltyCard(b)) return 1; // keep penalty
      if (!isPenaltyCard(a) && isPenaltyCard(b)) return -1; // pass non-penalty
      return a.rank - b.rank;
    });
    return sorted.slice(0, 3);
  }

  private passForSafety(hand: Card[]): Card[] {
    const toPass: Card[] = [];
    const remaining = [...hand];

    // Pass Queen of Spades if held
    const qs = remaining.find(c => isQueenOfSpades(c));
    if (qs) {
      toPass.push(qs);
      remaining.splice(remaining.indexOf(qs), 1);
    }

    // Try to void a suit for dump opportunities
    const suitCounts = new Map<Suit, number>();
    for (const suit of SUIT_ORDER) {
      suitCounts.set(suit, remaining.filter(c => c.suit === suit).length);
    }

    // Find suit with fewest cards (but > 0) to void — prefer non-hearts
    const voidCandidates = SUIT_ORDER
      .filter(s => s !== Suit.HEARTS)
      .filter(s => (suitCounts.get(s) || 0) > 0 && (suitCounts.get(s) || 0) <= 3 - toPass.length)
      .sort((a, b) => (suitCounts.get(a) || 0) - (suitCounts.get(b) || 0));

    if (voidCandidates.length > 0 && toPass.length < 3) {
      const voidSuit = voidCandidates[0];
      const suitCards = remaining.filter(c => c.suit === voidSuit);
      for (const card of suitCards) {
        if (toPass.length >= 3) break;
        toPass.push(card);
        remaining.splice(remaining.indexOf(card), 1);
      }
    }

    // Pass high spades (A, K)
    for (const rank of [Rank.ACE, Rank.KING]) {
      if (toPass.length >= 3) break;
      const card = remaining.find(c => c.suit === Suit.SPADES && c.rank === rank);
      if (card) {
        toPass.push(card);
        remaining.splice(remaining.indexOf(card), 1);
      }
    }

    // Pass high hearts
    const highHearts = remaining
      .filter(c => c.suit === Suit.HEARTS)
      .sort((a, b) => b.rank - a.rank);
    for (const card of highHearts) {
      if (toPass.length >= 3) break;
      toPass.push(card);
      remaining.splice(remaining.indexOf(card), 1);
    }

    // Fill remaining with highest cards
    const highCards = remaining.sort((a, b) => b.rank - a.rank);
    for (const card of highCards) {
      if (toPass.length >= 3) break;
      toPass.push(card);
    }

    return toPass.slice(0, 3);
  }

  choosePlay(ctx: BotDecisionContext): Card {
    const { legalMoves, currentTrick, hand, isFirstTrick } = ctx;

    if (legalMoves.length === 1) return legalMoves[0];

    // Leading
    if (currentTrick.length === 0) {
      return this.chooseLead(legalMoves, ctx);
    }

    // Following
    return this.chooseFollow(legalMoves, currentTrick, ctx);
  }

  private chooseLead(legalMoves: Card[], ctx: BotDecisionContext): Card {
    // If someone might be shooting the moon, lead hearts to block
    if (this.shouldBlockMoon(ctx)) {
      const hearts = legalMoves.filter(c => c.suit === Suit.HEARTS);
      if (hearts.length > 0) {
        return hearts.sort((a, b) => a.rank - b.rank)[0];
      }
    }

    // Lead low in a suit where others still have cards (to flush out high cards)
    const nonHearts = legalMoves.filter(c => c.suit !== Suit.HEARTS);
    if (nonHearts.length > 0) {
      // Prefer leading from suits with many remaining cards
      const suitStrength = nonHearts.map(card => ({
        card,
        remainingInSuit: this.countRemainingInSuit(card.suit),
      }));

      // Lead the lowest card from the suit with the most remaining cards
      suitStrength.sort((a, b) => {
        if (b.remainingInSuit !== a.remainingInSuit) return b.remainingInSuit - a.remainingInSuit;
        return a.card.rank - b.card.rank;
      });

      return suitStrength[0].card;
    }

    // Must lead hearts — lead lowest
    return legalMoves.sort((a, b) => a.rank - b.rank)[0];
  }

  private chooseFollow(legalMoves: Card[], currentTrick: TrickCard[], ctx: BotDecisionContext): Card {
    const ledSuit = currentTrick[0].card.suit;
    const followingSuit = legalMoves.some(c => c.suit === ledSuit);

    if (followingSuit) {
      return this.chooseFollowSuit(legalMoves, currentTrick, ledSuit, ctx);
    }

    return this.chooseDiscard(legalMoves, currentTrick, ctx);
  }

  private chooseFollowSuit(
    legalMoves: Card[],
    currentTrick: TrickCard[],
    ledSuit: Suit,
    ctx: BotDecisionContext,
  ): Card {
    const suitCards = legalMoves.filter(c => c.suit === ledSuit).sort((a, b) => a.rank - b.rank);
    const currentHighest = Math.max(
      ...currentTrick.filter(tc => tc.card.suit === ledSuit).map(tc => tc.card.rank)
    );

    // If this is the last card of the trick
    const isLast = currentTrick.length === 3;
    if (isLast) {
      const trickPoints = currentTrick.reduce((pts, tc) => {
        if (tc.card.suit === Suit.HEARTS) return pts + 1;
        if (isQueenOfSpades(tc.card)) return pts + 13;
        return pts;
      }, 0);

      if (trickPoints === 0) {
        // No penalty cards — safe to play high
        return suitCards[suitCards.length - 1];
      }

      // Try to duck
      const canDuck = suitCards.filter(c => c.rank < currentHighest);
      if (canDuck.length > 0) {
        // Play highest possible duck
        return canDuck[canDuck.length - 1];
      }
    }

    // Advanced ducking: play highest card still under current winner
    const canDuck = suitCards.filter(c => c.rank < currentHighest);
    if (canDuck.length > 0) {
      return canDuck[canDuck.length - 1]; // highest duck
    }

    // Must win — play lowest winning card
    return suitCards[0];
  }

  private chooseDiscard(legalMoves: Card[], currentTrick: TrickCard[], ctx: BotDecisionContext): Card {
    // Priority: QS first, then high hearts, then high cards
    const qs = legalMoves.find(c => isQueenOfSpades(c));
    if (qs) return qs;

    // Discard highest heart
    const hearts = legalMoves.filter(c => c.suit === Suit.HEARTS).sort((a, b) => b.rank - a.rank);
    if (hearts.length > 0) return hearts[0];

    // Discard highest spade (especially A, K if QS still out)
    if (!this.playedCards.has('QS')) {
      const highSpades = legalMoves
        .filter(c => c.suit === Suit.SPADES && c.rank >= Rank.KING)
        .sort((a, b) => b.rank - a.rank);
      if (highSpades.length > 0) return highSpades[0];
    }

    // Discard highest off-suit card
    return legalMoves.sort((a, b) => b.rank - a.rank)[0];
  }

  private shouldBlockMoon(ctx: BotDecisionContext): boolean {
    // Check if any opponent might be shooting (has taken most penalty points)
    for (const [playerId, points] of Object.entries(ctx.scores)) {
      if (playerId !== ctx.playerId && points >= 20) {
        return true;
      }
    }
    return false;
  }

  private countRemainingInSuit(suit: Suit): number {
    let count = 0;
    for (let rank = Rank.TWO; rank <= Rank.ACE; rank++) {
      const id = this.makeCardId(suit, rank);
      if (!this.playedCards.has(id)) count++;
    }
    return count;
  }

  private makeCardId(suit: Suit, rank: Rank): string {
    const rankStr: Record<number, string> = {
      2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
      9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
    };
    const suitStr: Record<string, string> = {
      CLUBS: 'C', DIAMONDS: 'D', SPADES: 'S', HEARTS: 'H',
    };
    return `${rankStr[rank]}${suitStr[suit]}`;
  }
}
