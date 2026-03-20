// ============================================================
// PIXEL HEARTS — WebSocket Protocol
// ============================================================

import { Card, GameSettings, GamePhase, PassDirection, PlayerInfo, RoomInfo, Trick } from './game-types';

// ── Client → Server Messages ──────────────────────────────

export interface JoinLobbyMsg {
  type: 'JOIN_LOBBY';
}

export interface CreateRoomMsg {
  type: 'CREATE_ROOM';
  roomName: string;
  password?: string;
  settings: GameSettings;
  botBackfill: boolean;
}

export interface JoinRoomMsg {
  type: 'JOIN_ROOM';
  roomId: string;
  password?: string;
}

export interface LeaveRoomMsg {
  type: 'LEAVE_ROOM';
}

export interface SetReadyMsg {
  type: 'SET_READY';
  ready: boolean;
}

export interface StartGameMsg {
  type: 'START_GAME';
}

export interface PassCardsMsg {
  type: 'PASS_CARDS';
  cardIds: string[];
}

export interface PlayCardMsg {
  type: 'PLAY_CARD';
  cardId: string;
}

export interface ChatMessageMsg {
  type: 'CHAT_MESSAGE';
  text: string;
}

export interface RematchMsg {
  type: 'REMATCH';
}

export interface SetPlayerInfoMsg {
  type: 'SET_PLAYER_INFO';
  name: string;
  avatar: number;
}

export interface PingMsg {
  type: 'PING';
}

export type ClientMessage =
  | JoinLobbyMsg
  | CreateRoomMsg
  | JoinRoomMsg
  | LeaveRoomMsg
  | SetReadyMsg
  | StartGameMsg
  | PassCardsMsg
  | PlayCardMsg
  | ChatMessageMsg
  | RematchMsg
  | SetPlayerInfoMsg
  | PingMsg;

// ── Server → Client Messages ──────────────────────────────

export interface LobbyStateMsg {
  type: 'LOBBY_STATE';
  rooms: RoomInfo[];
}

export interface RoomJoinedMsg {
  type: 'ROOM_JOINED';
  roomId: string;
  players: PlayerInfo[];
  settings: GameSettings;
  yourPlayerId: string;
}

export interface RoomUpdatedMsg {
  type: 'ROOM_UPDATED';
  players: PlayerInfo[];
  hostId: string;
}

export interface GameStartedMsg {
  type: 'GAME_STARTED';
  hand: Card[];
  passDirection: PassDirection;
  playerPositions: { id: string; name: string; position: string; avatar: number }[];
  roundNumber: number;
}

export interface PassReceivedMsg {
  type: 'PASS_RECEIVED';
  newCards: Card[];
  newHand: Card[];
}

export interface WaitingForPassMsg {
  type: 'WAITING_FOR_PASS';
  passDirection: PassDirection;
}

export interface YourTurnMsg {
  type: 'YOUR_TURN';
  legalMoves: string[]; // card IDs
  currentTrick: Trick;
  trickNumber: number;
}

export interface CardPlayedMsg {
  type: 'CARD_PLAYED';
  playerId: string;
  card: Card;
  trickComplete: boolean;
}

export interface TrickCompleteMsg {
  type: 'TRICK_COMPLETE';
  winnerId: string;
  trick: Trick;
  points: number;
  heartsBroken: boolean;
}

export interface HandCompleteMsg {
  type: 'HAND_COMPLETE';
  scores: Record<string, number>;
  totalScores: Record<string, number>;
  moonShooter?: string;
  moonChoice?: 'ADD_TO_OTHERS' | 'SUBTRACT_FROM_SELF';
}

export interface GameOverMsg {
  type: 'GAME_OVER';
  finalScores: Record<string, number>;
  winnerId: string;
  winnerName: string;
}

export interface ChatBroadcastMsg {
  type: 'CHAT_BROADCAST';
  from: string;
  fromName: string;
  text: string;
  timestamp: number;
}

export interface PlayerDisconnectedMsg {
  type: 'PLAYER_DISCONNECTED';
  playerId: string;
  playerName: string;
}

export interface PlayerReconnectedMsg {
  type: 'PLAYER_RECONNECTED';
  playerId: string;
  playerName: string;
}

export interface ErrorMsg {
  type: 'ERROR';
  message: string;
  code: string;
}

export interface PongMsg {
  type: 'PONG';
}

export interface GameStateSnapshotMsg {
  type: 'GAME_STATE_SNAPSHOT';
  hand: Card[];
  phase: GamePhase;
  passDirection: PassDirection;
  currentTrick: Trick;
  trickNumber: number;
  heartsBroken: boolean;
  isYourTurn: boolean;
  legalMoves: string[];
  scores: Record<string, number>;
  totalScores: Record<string, number>;
  roundNumber: number;
  playerPositions: { id: string; name: string; position: string; avatar: number; cardCount: number }[];
}

export type ServerMessage =
  | LobbyStateMsg
  | RoomJoinedMsg
  | RoomUpdatedMsg
  | GameStartedMsg
  | PassReceivedMsg
  | WaitingForPassMsg
  | YourTurnMsg
  | CardPlayedMsg
  | TrickCompleteMsg
  | HandCompleteMsg
  | GameOverMsg
  | ChatBroadcastMsg
  | PlayerDisconnectedMsg
  | PlayerReconnectedMsg
  | ErrorMsg
  | PongMsg
  | GameStateSnapshotMsg;
