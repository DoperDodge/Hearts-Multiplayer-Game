// ============================================================
// PIXEL HEARTS — Scoring
// ============================================================

import {
  Card, Suit, Rank, Trick, MoonScoringVariant,
  isQueenOfSpades, isJackOfDiamonds,
} from '@shared/game-types';
import { TOTAL_PENALTY_POINTS } from '@shared/constants';

export interface HandScoreResult {
  scores: Record<string, number>;     // playerId → points this hand
  moonShooter: string | null;          // playerId who shot the moon, or null
  details: Record<string, { hearts: number; queenOfSpades: boolean; jackOfDiamonds: boolean }>;
}

/**
 * Score a completed hand.
 * @param tricksByPlayer Map of playerId → array of tricks won
 * @param playerIds All player IDs in order
 * @param jackOfDiamondsRule Whether Jack of Diamonds is worth -10
 */
export function scoreHand(
  tricksByPlayer: Map<string, Trick[]>,
  playerIds: string[],
  jackOfDiamondsRule: boolean = false,
): HandScoreResult {
  const scores: Record<string, number> = {};
  const details: Record<string, { hearts: number; queenOfSpades: boolean; jackOfDiamonds: boolean }> = {};

  for (const playerId of playerIds) {
    const tricks = tricksByPlayer.get(playerId) || [];
    const allCards = tricks.flatMap(t => t.cards.map(tc => tc.card));

    let hearts = 0;
    let hasQueenOfSpades = false;
    let hasJackOfDiamonds = false;

    for (const card of allCards) {
      if (card.suit === Suit.HEARTS) hearts++;
      if (isQueenOfSpades(card)) hasQueenOfSpades = true;
      if (isJackOfDiamonds(card)) hasJackOfDiamonds = true;
    }

    let points = hearts + (hasQueenOfSpades ? 13 : 0);
    if (jackOfDiamondsRule && hasJackOfDiamonds) {
      points -= 10;
    }

    scores[playerId] = points;
    details[playerId] = { hearts, queenOfSpades: hasQueenOfSpades, jackOfDiamonds: hasJackOfDiamonds };
  }

  // Check for Shoot the Moon
  const moonShooter = detectShootTheMoon(details, playerIds);

  return { scores, moonShooter, details };
}

/**
 * Detect if any player has shot the moon.
 * Must have all 13 hearts AND the Queen of Spades.
 */
function detectShootTheMoon(
  details: Record<string, { hearts: number; queenOfSpades: boolean }>,
  playerIds: string[],
): string | null {
  for (const playerId of playerIds) {
    const d = details[playerId];
    if (d.hearts === 13 && d.queenOfSpades) {
      return playerId;
    }
  }
  return null;
}

/**
 * Apply moon scoring to the hand results.
 */
export function applyMoonScoring(
  scores: Record<string, number>,
  moonShooterId: string,
  variant: MoonScoringVariant,
  totalScores: Record<string, number>,
  scoreLimit: number,
): Record<string, number> {
  const adjustedScores = { ...scores };

  if (variant === MoonScoringVariant.ADD_TO_OTHERS) {
    // Check if adding 26 to others would end the game unfavorably for the shooter
    const wouldEndGame = Object.entries(totalScores).some(([id, score]) => {
      return id !== moonShooterId && (score + TOTAL_PENALTY_POINTS) >= scoreLimit;
    });

    const shooterWouldWin = Object.entries(totalScores).every(([id, score]) => {
      if (id === moonShooterId) return true;
      return (score + TOTAL_PENALTY_POINTS) >= totalScores[moonShooterId];
    });

    // If adding would end game and shooter wouldn't win, use subtract instead
    if (wouldEndGame && !shooterWouldWin) {
      adjustedScores[moonShooterId] = -TOTAL_PENALTY_POINTS;
      for (const id of Object.keys(adjustedScores)) {
        if (id !== moonShooterId) adjustedScores[id] = 0;
      }
    } else {
      adjustedScores[moonShooterId] = 0;
      for (const id of Object.keys(adjustedScores)) {
        if (id !== moonShooterId) adjustedScores[id] = TOTAL_PENALTY_POINTS;
      }
    }
  } else if (variant === MoonScoringVariant.SUBTRACT_FROM_SELF) {
    adjustedScores[moonShooterId] = -TOTAL_PENALTY_POINTS;
    for (const id of Object.keys(adjustedScores)) {
      if (id !== moonShooterId) adjustedScores[id] = 0;
    }
  }
  // PLAYER_CHOICE handled externally — return unadjusted for now

  return adjustedScores;
}

/**
 * Check if the game is over (any player at or above score limit).
 */
export function isGameOver(totalScores: Record<string, number>, scoreLimit: number): boolean {
  return Object.values(totalScores).some(score => score >= scoreLimit);
}

/**
 * Get the winner(s) — player(s) with the lowest total score.
 */
export function getWinner(totalScores: Record<string, number>): string[] {
  const entries = Object.entries(totalScores);
  const minScore = Math.min(...entries.map(([, s]) => s));
  return entries.filter(([, s]) => s === minScore).map(([id]) => id);
}
