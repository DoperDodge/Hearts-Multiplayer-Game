// ============================================================
// Client-side Scoring
// ============================================================

import { Card, Suit, Trick, MoonScoringVariant, isQueenOfSpades } from '@shared/game-types';
import { TOTAL_PENALTY_POINTS } from '@shared/constants';

export interface HandScoreResult {
  scores: Record<string, number>;
  moonShooter: string | null;
}

export function scoreHand(
  tricksByPlayer: Map<string, Trick[]>,
  playerIds: string[],
  jackOfDiamonds: boolean = false,
): HandScoreResult {
  const scores: Record<string, number> = {};
  let moonShooter: string | null = null;

  for (const playerId of playerIds) {
    const tricks = tricksByPlayer.get(playerId) || [];
    const allCards = tricks.flatMap(t => t.cards.map(tc => tc.card));
    let hearts = 0, hasQS = false, hasJD = false;

    for (const card of allCards) {
      if (card.suit === Suit.HEARTS) hearts++;
      if (isQueenOfSpades(card)) hasQS = true;
      if (card.suit === Suit.DIAMONDS && card.rank === 11) hasJD = true;
    }

    let points = hearts + (hasQS ? 13 : 0);
    if (jackOfDiamonds && hasJD) points -= 10;
    scores[playerId] = points;

    if (hearts === 13 && hasQS) moonShooter = playerId;
  }

  return { scores, moonShooter };
}

export function applyMoonScoring(
  scores: Record<string, number>,
  moonShooterId: string,
  variant: MoonScoringVariant,
): Record<string, number> {
  const adjusted = { ...scores };
  if (variant === MoonScoringVariant.ADD_TO_OTHERS) {
    adjusted[moonShooterId] = 0;
    for (const id of Object.keys(adjusted)) {
      if (id !== moonShooterId) adjusted[id] = TOTAL_PENALTY_POINTS;
    }
  } else if (variant === MoonScoringVariant.SUBTRACT_FROM_SELF) {
    adjusted[moonShooterId] = -TOTAL_PENALTY_POINTS;
    for (const id of Object.keys(adjusted)) {
      if (id !== moonShooterId) adjusted[id] = 0;
    }
  }
  return adjusted;
}

export function isGameOver(totalScores: Record<string, number>, scoreLimit: number): boolean {
  return Object.values(totalScores).some(s => s >= scoreLimit);
}

export function getWinner(totalScores: Record<string, number>): string[] {
  const min = Math.min(...Object.values(totalScores));
  return Object.entries(totalScores).filter(([, s]) => s === min).map(([id]) => id);
}
