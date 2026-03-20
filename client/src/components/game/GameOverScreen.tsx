import React from 'react';
import { PixelButton } from '../shared/PixelButton';
import { PixelPanel } from '../shared/PixelPanel';
import { PlayerData } from '../../store/gameStore';

interface GameOverScreenProps {
  players: PlayerData[];
  winnerId: string;
  humanPlayerId: string;
  onRematch: () => void;
  onMainMenu: () => void;
}

export function GameOverScreen({ players, winnerId, humanPlayerId, onRematch, onMainMenu }: GameOverScreenProps) {
  const sorted = [...players].sort((a, b) => a.totalScore - b.totalScore);
  const isWinner = winnerId === humanPlayerId;

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40 animate-fade-in">
      <PixelPanel className="max-w-[400px] w-full mx-4">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-[40px] mb-2">{isWinner ? '🏆' : '💔'}</div>
          <h2 className={`font-pixel text-[16px] ${isWinner ? 'text-pixel-gold' : 'text-pixel-accent'}`}>
            {isWinner ? 'YOU WIN!' : 'GAME OVER'}
          </h2>
          {!isWinner && (
            <div className="font-pixel text-[8px] text-pixel-muted mt-1">
              {sorted[0].name} wins!
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="flex flex-col gap-1.5 mb-6">
          {sorted.map((player, idx) => (
            <div key={player.id}
              className={`flex items-center justify-between px-3 py-2 border-2 ${
                idx === 0 ? 'border-pixel-gold bg-pixel-panel' : 'border-pixel-bg'
              } ${player.id === humanPlayerId ? 'bg-pixel-panel/50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className={`font-pixel text-[10px] ${
                  idx === 0 ? 'text-pixel-gold' : idx === 1 ? 'text-pixel-spades' : 'text-pixel-muted'
                }`}>
                  #{idx + 1}
                </span>
                <span className="font-pixel text-[8px] text-pixel-text truncate max-w-[120px]">
                  {player.name}
                  {player.id === humanPlayerId ? ' (you)' : ''}
                </span>
              </div>
              <span className={`font-pixel text-[10px] ${
                idx === 0 ? 'text-pixel-gold' : 'text-pixel-accent'
              }`}>
                {player.totalScore} pts
              </span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          <PixelButton variant="primary" size="md" onClick={onRematch}>
            ♥ REMATCH
          </PixelButton>
          <PixelButton variant="secondary" size="md" onClick={onMainMenu}>
            MENU
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
