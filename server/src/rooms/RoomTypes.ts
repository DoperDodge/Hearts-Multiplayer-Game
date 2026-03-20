// ============================================================
// PIXEL HEARTS — Room Types
// ============================================================

import { GameSettings, BotDifficulty } from '@shared/game-types';

export type RoomStatus = 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'FINISHED';

export interface RoomConfig {
  name: string;
  password?: string;
  maxPlayers: number;
  settings: GameSettings;
  botBackfill: boolean;
  botDifficulty: BotDifficulty;
}

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: number;
  isReady: boolean;
  isHost: boolean;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  ws?: any; // WebSocket reference (typed loosely to avoid circular deps)
  disconnectedAt?: number;
}
