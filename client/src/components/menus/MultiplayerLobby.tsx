import React, { useState, useEffect } from 'react';
import { PixelButton } from '../shared/PixelButton';
import { PixelPanel } from '../shared/PixelPanel';
import { PixelInput } from '../shared/PixelInput';
import { useLobbyStore } from '../../store/lobbyStore';
import { wsClient } from '../../network/WebSocketClient';
import { BotDifficulty, MoonScoringVariant } from '@shared/game-types';
import { DEFAULT_SCORE_LIMIT } from '@shared/constants';
import { useSettingsStore } from '../../store/settingsStore';

interface MultiplayerLobbyProps {
  onBack: () => void;
  onGameStart: () => void;
}

export function MultiplayerLobby({ onBack, onGameStart }: MultiplayerLobbyProps) {
  const { connected, rooms, currentRoomId, currentRoomPlayers, hostId, myPlayerId, chatMessages } = useLobbyStore();
  const { playerName, playerAvatar } = useSettingsStore();
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [chatText, setChatText] = useState('');

  useEffect(() => {
    if (!wsClient.isConnected()) {
      wsClient.connect();
    }

    const unsub1 = wsClient.on('LOBBY_STATE', (msg: any) => {
      useLobbyStore.getState().setRooms(msg.rooms);
    });
    const unsub2 = wsClient.on('ROOM_JOINED', (msg: any) => {
      useLobbyStore.getState().joinRoom(msg.roomId, msg.players, msg.settings, msg.yourPlayerId);
    });
    const unsub3 = wsClient.on('ROOM_UPDATED', (msg: any) => {
      useLobbyStore.getState().updateRoom(msg.players, msg.hostId);
    });
    const unsub4 = wsClient.on('GAME_STARTED', () => {
      onGameStart();
    });
    const unsub5 = wsClient.on('CHAT_BROADCAST', (msg: any) => {
      useLobbyStore.getState().addChatMessage(msg);
    });

    const unsubConnect = wsClient.onConnect(() => {
      useLobbyStore.getState().setConnected(true);
      wsClient.send({ type: 'SET_PLAYER_INFO', name: playerName || 'Player', avatar: playerAvatar });
      wsClient.send({ type: 'JOIN_LOBBY' });
    });
    const unsubDisconnect = wsClient.onDisconnect(() => {
      useLobbyStore.getState().setConnected(false);
    });

    if (wsClient.isConnected()) {
      useLobbyStore.getState().setConnected(true);
      wsClient.send({ type: 'SET_PLAYER_INFO', name: playerName || 'Player', avatar: playerAvatar });
      wsClient.send({ type: 'JOIN_LOBBY' });
    }

    return () => {
      unsub1(); unsub2(); unsub3(); unsub4(); unsub5();
      unsubConnect(); unsubDisconnect();
    };
  }, []);

  const handleCreateRoom = () => {
    wsClient.send({
      type: 'CREATE_ROOM',
      roomName: roomName || `${playerName}'s Room`,
      password: password || undefined,
      settings: {
        scoreLimit: DEFAULT_SCORE_LIMIT,
        jackOfDiamonds: false,
        moonScoringVariant: MoonScoringVariant.ADD_TO_OTHERS,
        noPointsOnFirstTrick: false,
        queenBreaksHearts: true,
        botDifficulty: BotDifficulty.MEDIUM,
        turnTimeout: 60000,
        animationSpeed: 'normal',
      },
      botBackfill: true,
    });
    setShowCreate(false);
  };

  const handleJoinRoom = (roomId: string) => {
    wsClient.send({ type: 'JOIN_ROOM', roomId });
  };

  const handleLeaveRoom = () => {
    wsClient.send({ type: 'LEAVE_ROOM' });
    useLobbyStore.getState().leaveRoom();
  };

  const handleReady = () => {
    const me = currentRoomPlayers.find(p => p.id === myPlayerId);
    wsClient.send({ type: 'SET_READY', ready: !me?.isReady });
  };

  const handleStartGame = () => {
    wsClient.send({ type: 'START_GAME' });
  };

  const handleSendChat = () => {
    if (!chatText.trim()) return;
    wsClient.send({ type: 'CHAT_MESSAGE', text: chatText.trim() });
    setChatText('');
  };

  // ── In a Room ──────────────────────────────────────────
  if (currentRoomId) {
    const isHost = hostId === myPlayerId;
    const allReady = currentRoomPlayers.filter(p => !p.isBot).every(p => p.isReady);
    const me = currentRoomPlayers.find(p => p.id === myPlayerId);

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
        <PixelPanel className="w-full max-w-[500px]" title="Game Room">
          {/* Player seats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[0, 1, 2, 3].map(i => {
              const player = currentRoomPlayers[i];
              return (
                <div key={i} className={`pixel-panel border-2 px-3 py-2 flex items-center gap-2 ${
                  player ? (player.isReady ? 'border-pixel-green' : 'border-pixel-panel') : 'border-pixel-bg opacity-50'
                }`}>
                  {player ? (
                    <>
                      <span className="text-[14px]">{player.isBot ? '🤖' : '👤'}</span>
                      <div>
                        <div className="font-pixel text-[8px] text-pixel-text truncate max-w-[100px]">
                          {player.name}
                          {player.isHost && ' 👑'}
                        </div>
                        <div className={`font-pixel text-[7px] ${player.isReady ? 'text-pixel-green' : 'text-pixel-muted'}`}>
                          {player.isReady ? 'Ready' : 'Not Ready'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="font-pixel text-[8px] text-pixel-muted animate-pulse-slow">
                      Waiting...
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chat */}
          <div className="mb-4">
            <div className="bg-pixel-bg border-2 border-pixel-panel h-[80px] overflow-y-auto p-2 mb-2">
              {chatMessages.map((msg, i) => (
                <div key={i} className="font-pixel text-[6px] mb-1">
                  <span className="text-pixel-gold">{msg.fromName}: </span>
                  <span className="text-pixel-text">{msg.text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <PixelInput value={chatText} onChange={setChatText} placeholder="Chat..."
                className="flex-1" />
              <PixelButton variant="secondary" size="sm" onClick={handleSendChat}>
                SEND
              </PixelButton>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-between">
            <PixelButton variant="secondary" size="sm" onClick={handleLeaveRoom}>
              LEAVE
            </PixelButton>
            <div className="flex gap-2">
              <PixelButton
                variant={me?.isReady ? 'green' : 'secondary'}
                size="sm"
                onClick={handleReady}
              >
                {me?.isReady ? '✓ READY' : 'READY UP'}
              </PixelButton>
              {isHost && (
                <PixelButton variant="primary" size="sm" onClick={handleStartGame}
                  disabled={!allReady}>
                  START
                </PixelButton>
              )}
            </div>
          </div>
        </PixelPanel>
      </div>
    );
  }

  // ── Room List ──────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
      {/* Connection status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-pixel-green' : 'bg-pixel-accent'}`} />
        <span className="font-pixel text-[7px] text-pixel-muted">
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      <PixelPanel className="w-full max-w-[500px]" title="Multiplayer Lobby">
        {/* Room create dialog */}
        {showCreate ? (
          <div className="mb-4">
            <div className="flex flex-col gap-2 mb-3">
              <PixelInput value={roomName} onChange={setRoomName} placeholder="Room name..." />
              <PixelInput value={password} onChange={setPassword} placeholder="Password (optional)" />
            </div>
            <div className="flex gap-2">
              <PixelButton variant="secondary" size="sm" onClick={() => setShowCreate(false)}>
                CANCEL
              </PixelButton>
              <PixelButton variant="gold" size="sm" onClick={handleCreateRoom}>
                CREATE
              </PixelButton>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mb-4">
            <PixelButton variant="gold" size="sm" onClick={() => setShowCreate(true)}>
              + CREATE ROOM
            </PixelButton>
          </div>
        )}

        {/* Room list */}
        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2">
          {rooms.length === 0 ? (
            <div className="font-pixel text-[8px] text-pixel-muted text-center py-6">
              No rooms available. Create one!
            </div>
          ) : (
            rooms.map(room => (
              <div key={room.id} className="pixel-panel flex items-center justify-between px-3 py-2 border-2 border-pixel-bg">
                <div>
                  <div className="font-pixel text-[8px] text-pixel-text">{room.name}</div>
                  <div className="font-pixel text-[7px] text-pixel-muted">
                    {room.playerCount}/{room.maxPlayers} players
                    {room.hasPassword ? ' 🔒' : ''}
                    {room.status !== 'WAITING' ? ` (${room.status})` : ''}
                  </div>
                </div>
                <PixelButton variant="green" size="sm"
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.playerCount >= room.maxPlayers || room.status !== 'WAITING'}>
                  JOIN
                </PixelButton>
              </div>
            ))
          )}
        </div>
      </PixelPanel>

      <PixelButton variant="secondary" size="sm" onClick={onBack}>
        ← BACK
      </PixelButton>
    </div>
  );
}
