// ============================================================
// PIXEL HEARTS — Room Manager
// ============================================================

import { Room } from './Room';
import { RoomConfig } from './RoomTypes';
import { GameSettings, BotDifficulty, MoonScoringVariant } from '@shared/game-types';
import { MAX_ROOMS, ROOM_CLEANUP_TIMEOUT, DEFAULT_SCORE_LIMIT, DEFAULT_TURN_TIMEOUT, NUM_PLAYERS } from '@shared/constants';
import { logger } from '../utils/logger';

const DEFAULT_SETTINGS: GameSettings = {
  scoreLimit: DEFAULT_SCORE_LIMIT,
  jackOfDiamonds: false,
  moonScoringVariant: MoonScoringVariant.ADD_TO_OTHERS,
  noPointsOnFirstTrick: false,
  queenBreaksHearts: true,
  botDifficulty: BotDifficulty.MEDIUM,
  turnTimeout: DEFAULT_TURN_TIMEOUT,
  animationSpeed: 'normal',
};

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private roomsByCode: Map<string, Room> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId → roomId
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup timer
    this.cleanupInterval = setInterval(() => this.cleanupStaleRooms(), 30000);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  // ── Room CRUD ──────────────────────────────────────────

  createRoom(
    hostId: string,
    hostName: string,
    hostAvatar: number,
    hostWs: any,
    config?: Partial<RoomConfig>,
  ): { room?: Room; error?: string } {
    if (this.rooms.size >= MAX_ROOMS) {
      return { error: 'Server is full, try again later' };
    }

    if (this.playerRooms.has(hostId)) {
      return { error: 'Already in a room' };
    }

    const roomConfig: RoomConfig = {
      name: config?.name || `Room #${this.rooms.size + 1}`,
      password: config?.password,
      maxPlayers: config?.maxPlayers || NUM_PLAYERS,
      settings: { ...DEFAULT_SETTINGS, ...config?.settings },
      botBackfill: config?.botBackfill ?? true,
      botDifficulty: config?.botDifficulty || BotDifficulty.MEDIUM,
    };

    const room = new Room(roomConfig);

    const result = room.addPlayer(hostId, hostName, hostAvatar, hostWs);
    if (!result.success) {
      return { error: result.error };
    }

    this.rooms.set(room.id, room);
    this.roomsByCode.set(room.code, room);
    this.playerRooms.set(hostId, room.id);

    room.on('roomEmpty', () => {
      this.removeRoom(room.id);
    });

    logger.info('Room created', { roomId: room.id, code: room.code, host: hostName });
    return { room };
  }

  joinRoom(
    playerId: string,
    playerName: string,
    playerAvatar: number,
    playerWs: any,
    roomId: string,
    password?: string,
  ): { room?: Room; error?: string } {
    const room = this.rooms.get(roomId) || this.roomsByCode.get(roomId);
    if (!room) {
      return { error: 'Room not found' };
    }

    if (room.hasPassword() && room.config.password !== password) {
      return { error: 'Incorrect password' };
    }

    if (this.playerRooms.has(playerId)) {
      return { error: 'Already in a room' };
    }

    const result = room.addPlayer(playerId, playerName, playerAvatar, playerWs);
    if (!result.success) {
      return { error: result.error };
    }

    this.playerRooms.set(playerId, room.id);
    logger.info('Player joined room', { playerId, roomId: room.id });
    return { room };
  }

  leaveRoom(playerId: string): void {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (room) {
      room.removePlayer(playerId);
    }

    this.playerRooms.delete(playerId);
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId) || this.roomsByCode.get(roomId);
  }

  getRoomForPlayer(playerId: string): Room | undefined {
    const roomId = this.playerRooms.get(playerId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  listRooms(): any[] {
    return Array.from(this.rooms.values())
      .map(r => r.toRoomInfo())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  getPlayerCount(): number {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.getHumanCount();
    }
    return count;
  }

  /**
   * Find first available room for quick play.
   */
  findQuickPlayRoom(): Room | undefined {
    for (const room of this.rooms.values()) {
      if (
        room.getStatus() === 'WAITING' &&
        !room.isFull() &&
        !room.hasPassword()
      ) {
        return room;
      }
    }
    return undefined;
  }

  // ── Cleanup ────────────────────────────────────────────

  private removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Remove all player mappings
    for (const player of room.getPlayers()) {
      this.playerRooms.delete(player.id);
    }

    this.rooms.delete(roomId);
    this.roomsByCode.delete(room.code);
    room.removeAllListeners();

    logger.info('Room removed', { roomId, code: room.code });
  }

  private cleanupStaleRooms(): void {
    const now = Date.now();
    for (const [roomId, room] of this.rooms) {
      if (room.isEmpty() && (now - room.createdAt) > ROOM_CLEANUP_TIMEOUT) {
        this.removeRoom(roomId);
      }
    }
  }
}
