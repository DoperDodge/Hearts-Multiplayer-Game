// ============================================================
// PIXEL HEARTS — Room (Single room lifecycle)
// ============================================================

import { EventEmitter } from 'events';
import { GameSettings, BotDifficulty, PassDirection, Card } from '@shared/game-types';
import { NUM_PLAYERS, BOT_NAMES } from '@shared/constants';
import { HeartsGame, GamePlayer } from '../game/HeartsGame';
import { EasyBot } from '../bots/EasyBot';
import { MediumBot } from '../bots/MediumBot';
import { HardBot } from '../bots/HardBot';
import { BotPlayer, BotDecisionContext, BotPassContext } from '../bots/BotPlayer';
import { RoomStatus, RoomConfig, RoomPlayer } from './RoomTypes';
import { generateId, generateRoomCode } from '../utils/id-generator';
import { logger } from '../utils/logger';

export class Room extends EventEmitter {
  readonly id: string;
  readonly code: string;
  readonly config: RoomConfig;

  private players: Map<string, RoomPlayer> = new Map();
  private status: RoomStatus = 'WAITING';
  private game: HeartsGame | null = null;
  private bots: Map<string, BotPlayer> = new Map();
  private botNameIndex: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
  readonly createdAt: number;

  constructor(config: RoomConfig) {
    super();
    this.id = generateId();
    this.code = generateRoomCode();
    this.config = config;
    this.createdAt = Date.now();
  }

  // ── Getters ────────────────────────────────────────────

  getStatus(): RoomStatus { return this.status; }
  getGame(): HeartsGame | null { return this.game; }
  getPlayerCount(): number { return this.players.size; }
  getHumanCount(): number { return Array.from(this.players.values()).filter(p => !p.isBot).length; }

  getPlayers(): RoomPlayer[] {
    return Array.from(this.players.values());
  }

  getPlayer(playerId: string): RoomPlayer | undefined {
    return this.players.get(playerId);
  }

  getHostId(): string | undefined {
    for (const p of this.players.values()) {
      if (p.isHost) return p.id;
    }
    return undefined;
  }

  hasPassword(): boolean {
    return !!this.config.password;
  }

  isFull(): boolean {
    return this.players.size >= this.config.maxPlayers;
  }

  isEmpty(): boolean {
    return this.getHumanCount() === 0;
  }

  // ── Player Management ──────────────────────────────────

  addPlayer(id: string, name: string, avatar: number, ws: any): { success: boolean; error?: string } {
    if (this.status !== 'WAITING') {
      return { success: false, error: 'Game already in progress' };
    }
    if (this.isFull()) {
      return { success: false, error: 'Room is full' };
    }
    if (this.players.has(id)) {
      return { success: false, error: 'Already in room' };
    }

    const isHost = this.players.size === 0;
    this.players.set(id, { id, name, avatar, isReady: false, isHost, isBot: false, ws });

    this.emit('playerJoined', { playerId: id, name });
    return { success: true };
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    this.players.delete(playerId);

    // If they were host, migrate
    if (player.isHost) {
      const remaining = Array.from(this.players.values()).filter(p => !p.isBot);
      if (remaining.length > 0) {
        remaining[0].isHost = true;
      }
    }

    this.emit('playerLeft', { playerId, name: player.name });

    // Clean up empty rooms
    if (this.isEmpty()) {
      this.emit('roomEmpty');
    }
  }

  setReady(playerId: string, ready: boolean): void {
    const player = this.players.get(playerId);
    if (player) {
      player.isReady = ready;
      this.emit('readyChanged', { playerId, ready });
    }
  }

  // ── Bot Management ─────────────────────────────────────

  addBot(difficulty: BotDifficulty): string {
    const names = BOT_NAMES[difficulty];
    const idx = this.botNameIndex[difficulty] % names.length;
    this.botNameIndex[difficulty]++;
    const name = names[idx];

    const botId = `bot_${generateId().slice(0, 8)}`;
    const avatar = Math.floor(Math.random() * 12);

    let bot: BotPlayer;
    switch (difficulty) {
      case BotDifficulty.EASY: bot = new EasyBot(name); break;
      case BotDifficulty.MEDIUM: bot = new MediumBot(name); break;
      case BotDifficulty.HARD: bot = new HardBot(name); break;
      default: bot = new MediumBot(name);
    }
    this.bots.set(botId, bot);

    this.players.set(botId, {
      id: botId,
      name,
      avatar,
      isReady: true,
      isHost: false,
      isBot: true,
      botDifficulty: difficulty,
    });

    return botId;
  }

  private fillWithBots(): void {
    if (!this.config.botBackfill) return;
    while (this.players.size < this.config.maxPlayers) {
      this.addBot(this.config.botDifficulty);
    }
  }

  // ── Game Lifecycle ─────────────────────────────────────

  canStart(): boolean {
    if (this.status !== 'WAITING') return false;
    const humans = Array.from(this.players.values()).filter(p => !p.isBot);
    const allReady = humans.every(p => p.isReady);
    return allReady && (this.players.size === this.config.maxPlayers || this.config.botBackfill);
  }

  startGame(): { success: boolean; error?: string } {
    if (this.status !== 'WAITING') {
      return { success: false, error: 'Not in waiting state' };
    }

    // Fill remaining seats with bots
    this.fillWithBots();

    if (this.players.size < NUM_PLAYERS) {
      return { success: false, error: `Need ${NUM_PLAYERS} players to start` };
    }

    this.status = 'STARTING';

    const playerList = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      isBot: p.isBot,
    }));

    this.game = new HeartsGame(playerList, this.config.settings);
    this.setupGameListeners();

    this.status = 'IN_PROGRESS';
    this.game.startNewHand();

    logger.info('Game started', { roomId: this.id, players: playerList.map(p => p.name) });
    return { success: true };
  }

  private setupGameListeners(): void {
    if (!this.game) return;

    this.game.on('deal', (data) => {
      this.emit('gameDeal', data);
    });

    this.game.on('passRequest', (data) => {
      this.emit('gamePassRequest', data);
      this.handleBotPasses();
    });

    this.game.on('passComplete', (data) => {
      this.emit('gamePassComplete', data);
    });

    this.game.on('turnStart', (data) => {
      this.emit('gameTurnStart', data);
      if (data.isBot) {
        this.handleBotTurn(data.playerId, data.legalMoves);
      }
    });

    this.game.on('cardPlayed', (data) => {
      this.emit('gameCardPlayed', data);
    });

    this.game.on('trickComplete', (data) => {
      this.emit('gameTrickComplete', data);
    });

    this.game.on('handComplete', (data) => {
      this.emit('gameHandComplete', data);
      // Start next hand after a delay
      setTimeout(() => {
        if (this.game && this.game.getPhase() !== 'GAME_OVER') {
          this.game.startNewHand();
        }
      }, 3000);
    });

    this.game.on('moonShot', (data) => {
      this.emit('gameMoonShot', data);
    });

    this.game.on('gameOver', (data) => {
      this.status = 'FINISHED';
      this.emit('gameOver', data);
    });
  }

  private async handleBotPasses(): Promise<void> {
    if (!this.game) return;

    for (const [botId, bot] of this.bots) {
      const hand = this.game.getPlayerHand(botId);
      if (hand.length === 0) continue;

      const ctx: BotPassContext = {
        hand,
        direction: this.game.getPassDirection(),
        playerId: botId,
      };

      const passCards = await bot.thinkAndChoosePass(ctx);
      this.game.submitPass(botId, passCards.map(c => c.id));
    }
  }

  private async handleBotTurn(botId: string, legalMoveIds: string[]): Promise<void> {
    if (!this.game) return;

    const bot = this.bots.get(botId);
    if (!bot) {
      this.game.autoPlay(botId);
      return;
    }

    const hand = this.game.getPlayerHand(botId);
    const legalMoves = hand.filter(c => legalMoveIds.includes(c.id));

    const ctx: BotDecisionContext = {
      hand,
      currentTrick: this.game.getCurrentTrick(),
      isFirstTrick: this.game.getIsFirstTrick(),
      heartsBroken: this.game.isHeartsBroken(),
      trickNumber: this.game.getTrickNumber(),
      legalMoves,
      scores: this.game.getTotalScores(),
      playerId: botId,
    };

    const chosen = await bot.thinkAndChoosePlay(ctx);
    this.game.playCard(botId, chosen.id);
  }

  // ── Serialization ──────────────────────────────────────

  toRoomInfo(): any {
    return {
      id: this.id,
      code: this.code,
      name: this.config.name,
      hostId: this.getHostId(),
      playerCount: this.players.size,
      maxPlayers: this.config.maxPlayers,
      status: this.status,
      hasPassword: this.hasPassword(),
      settings: this.config.settings,
      createdAt: this.createdAt,
    };
  }

  toPlayerList(): any[] {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isReady: p.isReady,
      isHost: p.isHost,
      isBot: p.isBot,
    }));
  }
}
