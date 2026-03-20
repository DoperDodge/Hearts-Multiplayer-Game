// ============================================================
// PIXEL HEARTS — WebSocket Client
// ============================================================

import { ClientMessage, ServerMessage } from '@shared/protocol';
import { WS_HEARTBEAT_INTERVAL } from '@shared/constants';

type MessageHandler = (msg: ServerMessage) => void;
type ConnectionHandler = () => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private onConnectHandlers: ConnectionHandler[] = [];
  private onDisconnectHandlers: ConnectionHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;
  private isIntentionalClose = false;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = `${protocol}//${host}`;

    // In development, connect to local server
    if (import.meta.env.DEV) {
      this.url = 'ws://localhost:3001';
    }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.startPingPong();
        this.onConnectHandlers.forEach(h => h());
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as ServerMessage;
          this.dispatch(msg);
        } catch {
          console.error('Failed to parse message');
        }
      };

      this.ws.onclose = () => {
        this.stopPingPong();
        this.onDisconnectHandlers.forEach(h => h());

        if (!this.isIntentionalClose) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = () => {
        // onclose will fire after this
      };
    } catch {
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.stopPingPong();
    this.ws?.close();
    this.ws = null;
  }

  send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  on(type: string, handler: MessageHandler): () => void {
    const existing = this.handlers.get(type) || [];
    existing.push(handler);
    this.handlers.set(type, existing);

    return () => {
      const list = this.handlers.get(type) || [];
      this.handlers.set(type, list.filter(h => h !== handler));
    };
  }

  onConnect(handler: ConnectionHandler): () => void {
    this.onConnectHandlers.push(handler);
    return () => {
      this.onConnectHandlers = this.onConnectHandlers.filter(h => h !== handler);
    };
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.onDisconnectHandlers.push(handler);
    return () => {
      this.onDisconnectHandlers = this.onDisconnectHandlers.filter(h => h !== handler);
    };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private dispatch(msg: ServerMessage): void {
    // Type-specific handlers
    const typeHandlers = this.handlers.get(msg.type) || [];
    typeHandlers.forEach(h => h(msg));

    // Wildcard handlers
    const wildcardHandlers = this.handlers.get('*') || [];
    wildcardHandlers.forEach(h => h(msg));
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startPingPong(): void {
    this.pingInterval = window.setInterval(() => {
      this.send({ type: 'PING' });
    }, WS_HEARTBEAT_INTERVAL);
  }

  private stopPingPong(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
