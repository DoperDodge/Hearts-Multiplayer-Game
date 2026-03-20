// ============================================================
// PIXEL HEARTS — Client Connection Wrapper
// ============================================================

import WebSocket from 'ws';
import { generateId } from '../utils/id-generator';
import { logger } from '../utils/logger';
import { MAX_MESSAGES_PER_SECOND, WS_HEARTBEAT_INTERVAL } from '@shared/constants';

export class ClientConnection {
  readonly id: string;
  readonly ws: WebSocket;
  name: string;
  avatar: number;
  private alive: boolean = true;
  private messageCount: number = 0;
  private messageResetTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(ws: WebSocket) {
    this.id = generateId();
    this.ws = ws;
    this.name = '';
    this.avatar = 0;

    // Rate limiting reset
    this.messageResetTimer = setInterval(() => {
      this.messageCount = 0;
    }, 1000);

    // Ping/pong heartbeat
    this.alive = true;
    ws.on('pong', () => {
      this.alive = true;
    });

    this.pingInterval = setInterval(() => {
      if (!this.alive) {
        logger.warn('Client heartbeat failed, terminating', { clientId: this.id });
        this.terminate();
        return;
      }
      this.alive = false;
      try {
        ws.ping();
      } catch {
        // ignore ping errors
      }
    }, WS_HEARTBEAT_INTERVAL);
  }

  /**
   * Send a message to this client.
   */
  send(message: any): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (err) {
        logger.error('Failed to send message', { clientId: this.id, error: String(err) });
      }
    }
  }

  /**
   * Check rate limit. Returns true if message is allowed.
   */
  checkRateLimit(): boolean {
    this.messageCount++;
    return this.messageCount <= MAX_MESSAGES_PER_SECOND;
  }

  /**
   * Terminate the connection.
   */
  terminate(): void {
    this.cleanup();
    try {
      this.ws.terminate();
    } catch {
      // already closed
    }
  }

  /**
   * Clean up timers.
   */
  cleanup(): void {
    if (this.messageResetTimer) {
      clearInterval(this.messageResetTimer);
      this.messageResetTimer = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  isConnected(): boolean {
    return this.ws.readyState === WebSocket.OPEN;
  }
}
