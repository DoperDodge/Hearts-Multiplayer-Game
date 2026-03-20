// ============================================================
// PIXEL HEARTS — Easy Bot ("Bumbling Bill")
// Random legal play with minimal awareness
// ============================================================

import { Card, BotDifficulty } from '@shared/game-types';
import { BotPlayer, BotDecisionContext, BotPassContext } from './BotPlayer';

export class EasyBot extends BotPlayer {
  readonly difficulty = BotDifficulty.EASY;
  readonly name: string;

  constructor(name?: string) {
    super();
    this.name = name || 'Bumbling Bill';
  }

  choosePassCards(ctx: BotPassContext): Card[] {
    // Pick 3 random cards
    const shuffled = [...ctx.hand].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  choosePlay(ctx: BotDecisionContext): Card {
    // Pick a random legal move
    const idx = Math.floor(Math.random() * ctx.legalMoves.length);
    return ctx.legalMoves[idx];
  }
}
