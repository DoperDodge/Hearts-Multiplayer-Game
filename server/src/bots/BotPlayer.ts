// ============================================================
// PIXEL HEARTS — Bot Player Base
// ============================================================

import { Card, TrickCard, PassDirection, BotDifficulty } from '@shared/game-types';
import { BOT_THINK_DELAY_EASY, BOT_THINK_DELAY_MEDIUM, BOT_THINK_DELAY_HARD } from '@shared/constants';

export interface BotDecisionContext {
  hand: Card[];
  currentTrick: TrickCard[];
  isFirstTrick: boolean;
  heartsBroken: boolean;
  trickNumber: number;
  legalMoves: Card[];
  scores: Record<string, number>;
  playerId: string;
}

export interface BotPassContext {
  hand: Card[];
  direction: PassDirection;
  playerId: string;
}

export abstract class BotPlayer {
  abstract readonly difficulty: BotDifficulty;
  abstract readonly name: string;

  abstract choosePassCards(ctx: BotPassContext): Card[];
  abstract choosePlay(ctx: BotDecisionContext): Card;

  /**
   * Get a random thinking delay based on difficulty.
   */
  getThinkDelay(): number {
    let range: { min: number; max: number };
    switch (this.difficulty) {
      case BotDifficulty.EASY:
        range = BOT_THINK_DELAY_EASY;
        break;
      case BotDifficulty.MEDIUM:
        range = BOT_THINK_DELAY_MEDIUM;
        break;
      case BotDifficulty.HARD:
        range = BOT_THINK_DELAY_HARD;
        break;
      default:
        range = BOT_THINK_DELAY_MEDIUM;
    }
    return range.min + Math.random() * (range.max - range.min);
  }

  /**
   * Async wrapper that adds a thinking delay.
   */
  async thinkAndChoosePlay(ctx: BotDecisionContext): Promise<Card> {
    const delay = this.getThinkDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.choosePlay(ctx);
  }

  async thinkAndChoosePass(ctx: BotPassContext): Promise<Card[]> {
    const delay = this.getThinkDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.choosePassCards(ctx);
  }
}
