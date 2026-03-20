// ============================================================
// PIXEL HEARTS — useMultiplayerGame Hook
// Bridges WebSocket server messages → Zustand game store
// ============================================================

import { useEffect, useRef } from 'react';
import { wsClient } from '../network/WebSocketClient';
import { useGameStore } from '../store/gameStore';
import { useLobbyStore } from '../store/lobbyStore';
import {
  Card, Trick, TrickCard, GamePhase, PassDirection,
  PlayerPosition,
} from '@shared/game-types';

export function useMultiplayerGame() {
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // ── GAME_STARTED ──────────────────────────────────────
    unsubs.push(wsClient.on('GAME_STARTED', (msg: any) => {
      const myId = useLobbyStore.getState().myPlayerId;

      // Build player list from server positions
        const existingPlayers = useGameStore.getState().players;
        const players = msg.playerPositions.map((p: any) => {
            const existing = existingPlayers.find((ep: any) => ep.id === p.id);
            return {
                id: p.id,
                name: p.name,
                position: p.position as PlayerPosition,
                hand: [] as Card[],
                tricksWon: [] as any[],
                score: 0,
                totalScore: existing?.totalScore || 0,
                isBot: false,
                avatar: p.avatar || 0,
                cardCount: 13,
            };
        });

      // Find our player index and set our hand
      const humanIdx = players.findIndex((p: any) => p.id === myId);
      if (humanIdx >= 0) {
        players[humanIdx].hand = msg.hand;
        players[humanIdx].cardCount = msg.hand.length;
      }

      const tricksByPlayer = new Map<string, any[]>();
      players.forEach((p: any) => tricksByPlayer.set(p.id, []));

      useGameStore.setState({
        phase: msg.passDirection === 'NONE' ? GamePhase.PLAYING : GamePhase.PASSING,
        players,
        humanPlayerIndex: humanIdx >= 0 ? humanIdx : 0,
        roundNumber: msg.roundNumber,
        passDirection: msg.passDirection as PassDirection,
        currentTrick: [],
        trickNumber: 1,
        heartsBroken: false,
        isFirstTrick: true,
        legalMoves: [],
        selectedPassCards: [],
        lastTrick: null,
        lastTrickWinner: null,
        moonShooter: null,
        handScores: null,
        gameWinner: null,
        message: msg.passDirection === 'NONE' ? '' : `Pass 3 cards ${msg.passDirection.toLowerCase()}`,
        isMultiplayer: true,
        tricksByPlayer,
      });
    }));

    // ── WAITING_FOR_PASS ──────────────────────────────────
    unsubs.push(wsClient.on('WAITING_FOR_PASS', (msg: any) => {
      useGameStore.setState({
        phase: GamePhase.PASSING,
        passDirection: msg.passDirection as PassDirection,
        message: `Pass 3 cards ${msg.passDirection.toLowerCase()}`,
      });
    }));

    // ── PASS_RECEIVED ─────────────────────────────────────
    unsubs.push(wsClient.on('PASS_RECEIVED', (msg: any) => {
      const store = useGameStore.getState();
      const players = store.players.map((p, i) => {
        if (i === store.humanPlayerIndex) {
          return { ...p, hand: msg.newHand, cardCount: msg.newHand.length };
        }
        return { ...p };
      });

      useGameStore.setState({
        players,
        selectedPassCards: [],
        message: '',
      });
    }));

    // ── YOUR_TURN ─────────────────────────────────────────
    unsubs.push(wsClient.on('YOUR_TURN', (msg: any) => {
      const store = useGameStore.getState();
      useGameStore.setState({
        phase: GamePhase.PLAYING,
        legalMoves: msg.legalMoves,
        currentPlayerIndex: store.humanPlayerIndex,
        trickNumber: msg.trickNumber || store.trickNumber,
        message: 'Your turn',
      });
    }));

    // ── CARD_PLAYED ───────────────────────────────────────
    unsubs.push(wsClient.on('CARD_PLAYED', (msg: any) => {
      const store = useGameStore.getState();

      const currentTrick: TrickCard[] = [
        ...store.currentTrick,
        { card: msg.card, playedBy: msg.playerId },
      ];

      // Update player card counts
      const players = store.players.map((p, i) => {
        if (p.id === msg.playerId) {
          if (i === store.humanPlayerIndex) {
            // Remove card from our hand
            return {
              ...p,
              hand: p.hand.filter(c => c.id !== msg.card.id),
              cardCount: p.hand.filter(c => c.id !== msg.card.id).length,
            };
          }
          return { ...p, cardCount: Math.max(0, p.cardCount - 1) };
        }
        return { ...p };
      });

      useGameStore.setState({
        currentTrick,
        players,
        legalMoves: [],
        message: '',
      });
    }));

    // ── TRICK_COMPLETE ────────────────────────────────────
    unsubs.push(wsClient.on('TRICK_COMPLETE', (msg: any) => {
      const store = useGameStore.getState();

      const trick: Trick = {
        cards: msg.trick.cards,
        ledSuit: msg.trick.ledSuit,
        winnerId: msg.winnerId,
      };

      const tricksByPlayer = new Map(store.tricksByPlayer);
      const existing = tricksByPlayer.get(msg.winnerId) || [];
      tricksByPlayer.set(msg.winnerId, [...existing, trick]);

      const winnerName = store.players.find(p => p.id === msg.winnerId)?.name || '?';

      useGameStore.setState({
        lastTrick: store.currentTrick,
        lastTrickWinner: msg.winnerId,
        heartsBroken: msg.heartsBroken,
        isFirstTrick: false,
        tricksByPlayer,
        message: `${winnerName} takes the trick`,
      });

      // Clear trick after delay
      setTimeout(() => {
        useGameStore.setState({
          currentTrick: [],
          trickNumber: useGameStore.getState().trickNumber + 1,
        });
      }, 1200);
    }));

    // ── HAND_COMPLETE ─────────────────────────────────────
    unsubs.push(wsClient.on('HAND_COMPLETE', (msg: any) => {
      const store = useGameStore.getState();
      const players = store.players.map(p => ({
        ...p,
        score: msg.scores[p.id] || 0,
        totalScore: (msg.totalScores[p.id] ?? p.totalScore) || 0,
      }));

      useGameStore.setState({
        phase: GamePhase.SCORING,
        players,
        handScores: msg.scores,
        moonShooter: msg.moonShooter || null,
        currentTrick: [],
        message: msg.moonShooter ? 'Shot the Moon!' : 'Hand complete',
      });
    }));

    // ── GAME_OVER ─────────────────────────────────────────
    unsubs.push(wsClient.on('GAME_OVER', (msg: any) => {
      const store = useGameStore.getState();
      const players = store.players.map(p => ({
        ...p,
        totalScore: msg.finalScores[p.id] ?? p.totalScore,
      }));

      useGameStore.setState({
        phase: GamePhase.GAME_OVER,
        players,
        gameWinner: msg.winnerId,
        message: '',
      });
    }));

    // ── ERROR ─────────────────────────────────────────────
    unsubs.push(wsClient.on('ERROR', (msg: any) => {
      console.error('Server error:', msg.message, msg.code);
    }));

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, []);
}
