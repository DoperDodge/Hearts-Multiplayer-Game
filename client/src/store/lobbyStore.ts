// ============================================================
// PIXEL HEARTS — Lobby Store
// ============================================================

import { create } from 'zustand';
import { GameSettings, BotDifficulty, MoonScoringVariant } from '@shared/game-types';
import { DEFAULT_SCORE_LIMIT } from '@shared/constants';

export interface RoomListItem {
  id: string;
  code: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
  hasPassword: boolean;
  createdAt: number;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  avatar: number;
  isReady: boolean;
  isHost: boolean;
  isBot: boolean;
}

interface LobbyStore {
  connected: boolean;
  rooms: RoomListItem[];
  currentRoomId: string | null;
  currentRoomPlayers: LobbyPlayer[];
  currentRoomSettings: GameSettings | null;
  myPlayerId: string | null;
  hostId: string | null;
  chatMessages: { from: string; fromName: string; text: string; timestamp: number }[];

  setConnected: (v: boolean) => void;
  setRooms: (rooms: RoomListItem[]) => void;
  joinRoom: (roomId: string, players: LobbyPlayer[], settings: GameSettings, myId: string) => void;
  updateRoom: (players: LobbyPlayer[], hostId: string) => void;
  leaveRoom: () => void;
  addChatMessage: (msg: { from: string; fromName: string; text: string; timestamp: number }) => void;
  clearChat: () => void;
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  connected: false,
  rooms: [],
  currentRoomId: null,
  currentRoomPlayers: [],
  currentRoomSettings: null,
  myPlayerId: null,
  hostId: null,
  chatMessages: [],

  setConnected: (v) => set({ connected: v }),
  setRooms: (rooms) => set({ rooms }),
  joinRoom: (roomId, players, settings, myId) => set({
    currentRoomId: roomId,
    currentRoomPlayers: players,
    currentRoomSettings: settings,
    myPlayerId: myId,
    hostId: players.find(p => p.isHost)?.id || null,
  }),
  updateRoom: (players, hostId) => set({
    currentRoomPlayers: players,
    hostId,
  }),
  leaveRoom: () => set({
    currentRoomId: null,
    currentRoomPlayers: [],
    currentRoomSettings: null,
    myPlayerId: null,
    hostId: null,
    chatMessages: [],
  }),
  addChatMessage: (msg) => set((s) => ({
    chatMessages: [...s.chatMessages.slice(-50), msg],
  })),
  clearChat: () => set({ chatMessages: [] }),
}));
