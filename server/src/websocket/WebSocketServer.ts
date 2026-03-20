// ============================================================
// PIXEL HEARTS — WebSocket Server
// ============================================================

import { Server as HttpServer } from 'http';
import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { ClientConnection } from './ClientConnection';
import { MessageRouter } from './MessageRouter';
import { logger } from '../utils/logger';

export class WebSocketServerWrapper {
  private wss: WSServer;
  private clients: Map<string, ClientConnection> = new Map();
  private router: MessageRouter;

  constructor(server: HttpServer, router: MessageRouter) {
    this.router = router;

    this.wss = new WSServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error', { error: String(error) });
    });

    logger.info('WebSocket server initialized');
  }

  private handleConnection(ws: WebSocket): void {
    const client = new ClientConnection(ws);
    this.clients.set(client.id, client);

    logger.info('Client connected', { clientId: client.id, total: this.clients.size });

    ws.on('message', (data: Buffer | string) => {
      try {
        const message = JSON.parse(data.toString());
        this.router.handleMessage(client, message);
      } catch (err) {
        client.send({
          type: 'ERROR',
          message: 'Invalid message format',
          code: 'PARSE_ERROR',
        });
      }
    });

    ws.on('close', () => {
      logger.info('Client disconnected', { clientId: client.id, name: client.name });
      this.router.handleDisconnect(client);
      this.clients.delete(client.id);
    });

    ws.on('error', (error) => {
      logger.error('Client WebSocket error', { clientId: client.id, error: String(error) });
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }

  close(): void {
    for (const client of this.clients.values()) {
      client.terminate();
    }
    this.clients.clear();
    this.wss.close();
  }
}
