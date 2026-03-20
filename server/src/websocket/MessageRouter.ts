// ============================================================
// PIXEL HEARTS — Message Router
// ============================================================

import { ClientMessage } from '@shared/protocol';
import { ClientConnection } from './ClientConnection';
import { RoomManager } from '../rooms/RoomManager';
import { Room } from '../rooms/Room';
import { logger } from '../utils/logger';

export class MessageRouter {
  private roomManager: RoomManager;
  private lobbySubscribers: Set<ClientConnection> = new Set();

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
  }

  /**
   * Route a message from a client to the appropriate handler.
   */
  handleMessage(client: ClientConnection, message: ClientMessage): void {
    if (!client.checkRateLimit()) {
      client.send({ type: 'ERROR', message: 'Rate limit exceeded', code: 'RATE_LIMIT' });
      return;
    }

    switch (message.type) {
      case 'PING':
        client.send({ type: 'PONG' });
        break;

      case 'SET_PLAYER_INFO':
        client.name = message.name;
        client.avatar = message.avatar;
        break;

      case 'JOIN_LOBBY':
        this.handleJoinLobby(client);
        break;

      case 'CREATE_ROOM':
        this.handleCreateRoom(client, message);
        break;

      case 'JOIN_ROOM':
        this.handleJoinRoom(client, message);
        break;

      case 'LEAVE_ROOM':
        this.handleLeaveRoom(client);
        break;

      case 'SET_READY':
        this.handleSetReady(client, message.ready);
        break;

      case 'START_GAME':
        this.handleStartGame(client);
        break;

      case 'PASS_CARDS':
        this.handlePassCards(client, message.cardIds);
        break;

      case 'PLAY_CARD':
        this.handlePlayCard(client, message.cardId);
        break;

      case 'CHAT_MESSAGE':
        this.handleChat(client, message.text);
        break;

      case 'REMATCH':
        this.handleRematch(client);
        break;

      default:
        client.send({ type: 'ERROR', message: 'Unknown message type', code: 'UNKNOWN_TYPE' });
    }
  }

  /**
   * Handle client disconnect.
   */
  handleDisconnect(client: ClientConnection): void {
    this.lobbySubscribers.delete(client);

    const room = this.roomManager.getRoomForPlayer(client.id);
    if (room) {
      if (room.getStatus() === 'WAITING') {
        this.roomManager.leaveRoom(client.id);
        this.broadcastRoomUpdate(room);
      } else {
        // In-game disconnect - notify others
        this.broadcastToRoom(room, {
          type: 'PLAYER_DISCONNECTED',
          playerId: client.id,
          playerName: client.name,
        }, client.id);
      }
    }

    this.broadcastLobbyState();
    client.cleanup();
  }

  // ── Lobby ──────────────────────────────────────────────

  private handleJoinLobby(client: ClientConnection): void {
    this.lobbySubscribers.add(client);
    client.send({
      type: 'LOBBY_STATE',
      rooms: this.roomManager.listRooms(),
    });
  }

  private broadcastLobbyState(): void {
    const rooms = this.roomManager.listRooms();
    for (const subscriber of this.lobbySubscribers) {
      if (subscriber.isConnected()) {
        subscriber.send({ type: 'LOBBY_STATE', rooms });
      } else {
        this.lobbySubscribers.delete(subscriber);
      }
    }
  }

  // ── Room Management ────────────────────────────────────

  private handleCreateRoom(client: ClientConnection, message: any): void {
    const { room, error } = this.roomManager.createRoom(
      client.id,
      client.name || 'Player',
      client.avatar,
      client,
      {
        name: message.roomName,
        password: message.password,
        settings: message.settings,
        botBackfill: message.botBackfill ?? true,
      },
    );

    if (error || !room) {
      client.send({ type: 'ERROR', message: error || 'Failed to create room', code: 'CREATE_FAILED' });
      return;
    }

    this.setupRoomListeners(room);
    this.lobbySubscribers.delete(client);

    client.send({
      type: 'ROOM_JOINED',
      roomId: room.id,
      players: room.toPlayerList(),
      settings: room.config.settings,
      yourPlayerId: client.id,
    });

    this.broadcastLobbyState();
  }

  private handleJoinRoom(client: ClientConnection, message: any): void {
    const { room, error } = this.roomManager.joinRoom(
      client.id,
      client.name || 'Player',
      client.avatar,
      client,
      message.roomId,
      message.password,
    );

    if (error || !room) {
      client.send({ type: 'ERROR', message: error || 'Failed to join room', code: 'JOIN_FAILED' });
      return;
    }

    this.lobbySubscribers.delete(client);

    client.send({
      type: 'ROOM_JOINED',
      roomId: room.id,
      players: room.toPlayerList(),
      settings: room.config.settings,
      yourPlayerId: client.id,
    });

    this.broadcastRoomUpdate(room);
    this.broadcastLobbyState();
  }

  private handleLeaveRoom(client: ClientConnection): void {
    const room = this.roomManager.getRoomForPlayer(client.id);
    this.roomManager.leaveRoom(client.id);

    if (room) {
      this.broadcastRoomUpdate(room);
    }
    this.broadcastLobbyState();
  }

  private handleSetReady(client: ClientConnection, ready: boolean): void {
    const room = this.roomManager.getRoomForPlayer(client.id);
    if (!room) return;

    room.setReady(client.id, ready);
    this.broadcastRoomUpdate(room);
  }

  private handleStartGame(client: ClientConnection): void {
    const room = this.roomManager.getRoomForPlayer(client.id);
    if (!room) return;

    const hostId = room.getHostId();
    if (hostId !== client.id) {
      client.send({ type: 'ERROR', message: 'Only the host can start', code: 'NOT_HOST' });
      return;
    }

    const result = room.startGame();
    if (!result.success) {
      client.send({ type: 'ERROR', message: result.error || 'Cannot start', code: 'START_FAILED' });
    }
    this.broadcastLobbyState();
  }

  // ── Gameplay ───────────────────────────────────────────

  private handlePassCards(client: ClientConnection, cardIds: string[]): void {
    const room = this.roomManager.getRoomForPlayer(client.id);
    const game = room?.getGame();
    if (!game) return;

    const result = game.submitPass(client.id, cardIds);
    if (!result.success) {
      client.send({ type: 'ERROR', message: result.error || 'Invalid pass', code: 'PASS_FAILED' });
    }
  }

  private handlePlayCard(client: ClientConnection, cardId: string): void {
    const room = this.roomManager.getRoomForPlayer(client.id);
    const game = room?.getGame();
    if (!game) return;

    const result = game.playCard(client.id, cardId);
    if (!result.success) {
      client.send({ type: 'ERROR', message: result.error || 'Invalid play', code: 'PLAY_FAILED' });
    }
  }

  private handleChat(client: ClientConnection, text: string): void {
    const room = this.roomManager.getRoomForPlayer(client.id);
    if (!room) return;

    const sanitized = text.slice(0, 200).trim();
    if (!sanitized) return;

    this.broadcastToRoom(room, {
      type: 'CHAT_BROADCAST',
      from: client.id,
      fromName: client.name,
      text: sanitized,
      timestamp: Date.now(),
    });
  }

  private handleRematch(client: ClientConnection): void {
    // For now, just signal readiness for a new game
    const room = this.roomManager.getRoomForPlayer(client.id);
    if (!room) return;
    room.setReady(client.id, true);
  }

  // ── Room Event Listeners ───────────────────────────────

  private setupRoomListeners(room: Room): void {
    room.on('gameDeal', (data) => {
      // Send each player only THEIR hand
      for (const handData of data.hands) {
        const player = room.getPlayer(handData.playerId);
        if (player && !player.isBot && player.ws) {
          const positions = room.getPlayers().map((p, i) => ({
            id: p.id,
            name: p.name,
            position: ['SOUTH', 'WEST', 'NORTH', 'EAST'][i],
            avatar: p.avatar,
          }));

          // Rotate positions so the current player is always SOUTH
          const playerIdx = room.getPlayers().findIndex(p => p.id === handData.playerId);
          const rotatedPositions = positions.map((pos, i) => ({
            ...pos,
            position: ['SOUTH', 'WEST', 'NORTH', 'EAST'][(i - playerIdx + 4) % 4],
          }));

          player.ws.send({
            type: 'GAME_STARTED',
            hand: handData.hand,
            passDirection: data.passDirection,
            playerPositions: rotatedPositions,
            roundNumber: data.roundNumber,
          });
        }
      }
    });

    room.on('gamePassRequest', (data) => {
      this.broadcastToHumansInRoom(room, {
        type: 'WAITING_FOR_PASS',
        passDirection: data.passDirection,
      });
    });

    room.on('gamePassComplete', (data) => {
      for (const [playerId, cards] of Object.entries(data.passedCards)) {
        const player = room.getPlayer(playerId);
        if (player && !player.isBot && player.ws) {
          const handData = data.hands.find((h: any) => h.playerId === playerId);
          player.ws.send({
            type: 'PASS_RECEIVED',
            newCards: cards,
            newHand: handData?.hand || [],
          });
        }
      }
    });

    room.on('gameTurnStart', (data) => {
      if (data.isBot) return;
      const player = room.getPlayer(data.playerId);
      if (player && player.ws) {
        player.ws.send({
          type: 'YOUR_TURN',
          legalMoves: data.legalMoves,
          currentTrick: data.currentTrick,
          trickNumber: data.trickNumber,
        });
      }
    });

    room.on('gameCardPlayed', (data) => {
      this.broadcastToRoom(room, {
        type: 'CARD_PLAYED',
        playerId: data.playerId,
        card: data.card,
        trickComplete: data.trickComplete,
      });
    });

    room.on('gameTrickComplete', (data) => {
      this.broadcastToRoom(room, {
        type: 'TRICK_COMPLETE',
        winnerId: data.winnerId,
        trick: data.trick,
        points: data.points,
        heartsBroken: data.heartsBroken,
      });
    });

    room.on('gameHandComplete', (data) => {
      this.broadcastToRoom(room, {
        type: 'HAND_COMPLETE',
        scores: data.scores,
        totalScores: data.totalScores,
        moonShooter: data.moonShooter,
      });
    });

    room.on('gameOver', (data) => {
      this.broadcastToRoom(room, {
        type: 'GAME_OVER',
        finalScores: data.finalScores,
        winnerId: data.winnerId,
        winnerName: data.winnerName,
      });
      this.broadcastLobbyState();
    });
  }

  // ── Broadcast Helpers ──────────────────────────────────

  private broadcastRoomUpdate(room: Room): void {
    const msg = {
      type: 'ROOM_UPDATED',
      players: room.toPlayerList(),
      hostId: room.getHostId(),
    };
    this.broadcastToRoom(room, msg);
  }

  private broadcastToRoom(room: Room, message: any, excludeId?: string): void {
    for (const player of room.getPlayers()) {
      if (player.isBot) continue;
      if (excludeId && player.id === excludeId) continue;
      if (player.ws && typeof player.ws.send === 'function') {
        try {
          // player.ws is a ClientConnection
          if (typeof player.ws.send === 'function') {
            player.ws.send(message);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  private broadcastToHumansInRoom(room: Room, message: any): void {
    this.broadcastToRoom(room, message);
  }
}
