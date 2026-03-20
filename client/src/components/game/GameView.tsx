// ============================================================
// PIXEL HEARTS — Game View (Main Game Table)
// ============================================================

import React, { useMemo } from 'react';
import { useGameStore, PlayerData } from '../../store/gameStore';
import {
  GamePhase, PlayerPosition, Card, Suit, TrickCard,
  SUIT_SYMBOL, RANK_SHORT, PassDirection,
} from '@shared/game-types';
import { CardDisplay } from './CardDisplay';
import { PlayerHUD } from './PlayerHUD';
import { ScoreOverlay } from './ScoreOverlay';
import { GameOverScreen } from './GameOverScreen';
import { PixelButton } from '../shared/PixelButton';

interface GameViewProps {
  onMainMenu: () => void;
}

export function GameView({ onMainMenu }: GameViewProps) {
  const {
    phase, players, humanPlayerIndex, currentPlayerIndex,
    currentTrick, trickNumber, heartsBroken, isFirstTrick,
    legalMoves, selectedPassCards, passDirection, roundNumber,
    lastTrick, lastTrickWinner, moonShooter, handScores, gameWinner, message,
    selectPassCard, confirmPass, playCard, reset, startSoloGame,
  } = useGameStore();

  const humanPlayer = players[humanPlayerIndex];
  const isHumanTurn = currentPlayerIndex === humanPlayerIndex && phase === GamePhase.PLAYING;

  const passDirectionLabel: Record<PassDirection, string> = {
    [PassDirection.LEFT]: '← Pass Left',
    [PassDirection.RIGHT]: 'Pass Right →',
    [PassDirection.ACROSS]: '↕ Pass Across',
    [PassDirection.NONE]: 'No Pass',
  };

  const handleCardClick = (cardId: string) => {
    if (phase === GamePhase.PASSING) {
      selectPassCard(cardId);
    } else if (phase === GamePhase.PLAYING && isHumanTurn) {
      playCard(cardId);
    }
  };

  const handleRematch = () => {
    const difficulty = players[1]?.botDifficulty;
    const store = useGameStore.getState();
    reset();
    if (difficulty) {
      startSoloGame(difficulty, store.settings);
    }
  };

  const handleMainMenu = () => {
    reset();
    onMainMenu();
  };

  return (
    <div className="w-full h-full relative overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse at center, #1a3a2a 0%, #0d1f17 60%, #0a1510 100%)',
      }}>

      {/* Table felt texture overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Game status bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5
        bg-pixel-bg/80 border-b-2 border-pixel-panel">
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[7px] text-pixel-muted">
            Round {roundNumber}
          </span>
          <span className="font-pixel text-[7px] text-pixel-muted">
            Trick {Math.min(trickNumber, 13)}/13
          </span>
          {heartsBroken && (
            <span className="font-pixel text-[7px] text-pixel-accent">
              💔 Broken
            </span>
          )}
        </div>
        <button onClick={handleMainMenu}
          className="font-pixel text-[7px] text-pixel-muted hover:text-pixel-text px-2 py-1">
          ✕ EXIT
        </button>
      </div>

      {/* Player HUDs */}
      {players.map((player, idx) => (
        <PlayerHUD
          key={player.id}
          player={player}
          isCurrentTurn={idx === currentPlayerIndex && phase === GamePhase.PLAYING}
          position={player.position}
        />
      ))}

      {/* Opponent card backs (simplified) */}
      {players.filter((_, i) => i !== humanPlayerIndex).map(player => {
        const pos = player.position;
        const posClasses: Record<string, string> = {
          [PlayerPosition.NORTH]: 'top-[40px] left-1/2 -translate-x-1/2 flex-row',
          [PlayerPosition.WEST]: 'left-[50px] top-1/2 -translate-y-1/2 flex-col',
          [PlayerPosition.EAST]: 'right-[50px] top-1/2 -translate-y-1/2 flex-col',
        };
        return (
          <div key={player.id} className={`absolute ${posClasses[pos]} flex gap-[-8px] z-0`}>
            {Array.from({ length: Math.min(player.cardCount, 5) }).map((_, i) => (
              <CardDisplay key={i} faceDown small className={pos === PlayerPosition.NORTH ? '-mx-3' : '-my-3'} />
            ))}
          </div>
        );
      })}

      {/* Trick area (center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="relative w-[200px] h-[160px]">
          {/* Table center border */}
          <div className="absolute inset-0 border-2 border-pixel-green/20 rounded-lg" />

          {currentTrick.map((tc, idx) => {
            const trickPlayerIdx = players.findIndex(p => p.id === tc.playedBy);
            const pos = players[trickPlayerIdx]?.position || PlayerPosition.SOUTH;

            const offsets: Record<PlayerPosition, { x: number; y: number }> = {
              [PlayerPosition.SOUTH]: { x: 65, y: 90 },
              [PlayerPosition.WEST]: { x: 10, y: 45 },
              [PlayerPosition.NORTH]: { x: 65, y: 0 },
              [PlayerPosition.EAST]: { x: 120, y: 45 },
            };

            const off = offsets[pos];
            return (
              <div key={tc.card.id}
                className="absolute animate-slide-up"
                style={{ left: off.x, top: off.y, animationDuration: '0.2s' }}>
                <CardDisplay card={tc.card} small />
              </div>
            );
          })}

          {/* Last trick winner indicator */}
          {currentTrick.length === 0 && lastTrick && lastTrickWinner && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-pixel text-[8px] text-pixel-gold animate-fade-in">
                {players.find(p => p.id === lastTrickWinner)?.name} takes it
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pass phase UI */}
      {phase === GamePhase.PASSING && (
        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <div className="pixel-panel px-4 py-2">
            <div className="font-pixel text-[9px] text-pixel-gold text-center">
              {passDirectionLabel[passDirection]}
            </div>
            <div className="font-pixel text-[7px] text-pixel-muted text-center mt-1">
              Select 3 cards to pass ({selectedPassCards.length}/3)
            </div>
          </div>
          {selectedPassCards.length === 3 && (
            <PixelButton variant="gold" size="sm" onClick={confirmPass}>
              CONFIRM PASS
            </PixelButton>
          )}
        </div>
      )}

      {/* Message display */}
      {message && phase === GamePhase.PLAYING && (
        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 z-20">
          <div className="pixel-panel px-4 py-2 animate-fade-in">
            <div className="font-pixel text-[8px] text-pixel-gold text-center">{message}</div>
          </div>
        </div>
      )}

      {/* Human player's hand */}
      {humanPlayer && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-end justify-center"
            style={{
              paddingBottom: '4px',
            }}>
            {humanPlayer.hand.map((card, idx) => {
              const isLegal = phase === GamePhase.PLAYING && isHumanTurn && legalMoves.includes(card.id);
              const isPassSelectable = phase === GamePhase.PASSING;
              const isSelected = selectedPassCards.includes(card.id);
              const isDisabled = phase === GamePhase.PLAYING && isHumanTurn && !isLegal;

              // Fan offset
              const totalCards = humanPlayer.hand.length;
              const maxOverlap = Math.min(52, Math.max(20, 300 / totalCards));
              const fanWidth = (totalCards - 1) * maxOverlap;
              const startX = -fanWidth / 2;
              const x = startX + idx * maxOverlap;

              // Slight arc
              const normalizedPos = totalCards > 1 ? (idx / (totalCards - 1)) * 2 - 1 : 0;
              const arcY = normalizedPos * normalizedPos * 8;
              const rotation = normalizedPos * 3;

              return (
                <div
                  key={card.id}
                  style={{
                    marginLeft: idx === 0 ? 0 : `-${72 - maxOverlap}px`,
                    transform: `translateY(${arcY}px) rotate(${rotation}deg)`,
                    zIndex: isSelected ? 50 : idx,
                  }}
                >
                  <CardDisplay
                    card={card}
                    selected={isSelected}
                    disabled={isDisabled && !isPassSelectable}
                    highlighted={isLegal}
                    onClick={() => handleCardClick(card.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score overlay */}
      {phase === GamePhase.SCORING && handScores && (
        <ScoreOverlay
          players={players}
          handScores={handScores}
          moonShooter={moonShooter}
          roundNumber={roundNumber}
        />
      )}

      {/* Game over screen */}
      {phase === GamePhase.GAME_OVER && gameWinner && (
        <GameOverScreen
          players={players}
          winnerId={gameWinner}
          humanPlayerId={humanPlayer?.id || 'human'}
          onRematch={handleRematch}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}
