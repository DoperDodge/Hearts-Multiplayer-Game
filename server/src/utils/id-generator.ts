// ============================================================
// PIXEL HEARTS — ID Generator
// ============================================================

import crypto from 'crypto';
import { ROOM_CODE_LENGTH } from '@shared/constants';

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a short room code (e.g., "ABCD").
 */
export function generateRoomCode(length: number = ROOM_CODE_LENGTH): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid confusing chars
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Generate a player-friendly room name.
 */
export function generateRoomName(): string {
  const adjectives = ['Cozy', 'Wild', 'Lucky', 'Golden', 'Silver', 'Royal', 'Secret', 'Hidden'];
  const nouns = ['Table', 'Room', 'Den', 'Lodge', 'Parlor', 'Club', 'Lounge', 'Hall'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj} ${noun} #${num}`;
}
