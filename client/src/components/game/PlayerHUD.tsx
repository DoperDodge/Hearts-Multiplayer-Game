import React from 'react';
import { PlayerPosition } from '@shared/game-types';
import { PlayerData } from '../../store/gameStore';

interface PlayerHUDProps {
  player: PlayerData;
  isCurrentTurn: boolean;
  position: PlayerPosition;
}

const AVATARS = ['🧙', '🤠', '🦊', '🐸', '🌟', '🎭', '🦉', '🐺', '🌙', '🔥', '💎', '🃏'];

export function PlayerHUD({ player, isCurrentTurn, position }: PlayerHUDProps) {
  const positionClasses: Record<PlayerPosition, string> = {
    [PlayerPosition.SOUTH]: 'bottom-[115px] left-1/2 -translate-x-1/2',
    [PlayerPosition.WEST]: 'left-2 top-1/2 -translate-y-1/2',
    [PlayerPosition.NORTH]: 'top-2 left-1/2 -translate-x-1/2',
    [PlayerPosition.EAST]: 'right-2 top-1/2 -translate-y-1/2',
  };

  const isHorizontal = position === PlayerPosition.NORTH || position === PlayerPosition.SOUTH;

  return (
    <div className={`absolute ${positionClasses[position]} z-10`}>
      <div className={`
        flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center gap-2
        px-3 py-1.5 bg-pixel-surface/90 border-2
        transition-all duration-300
        ${isCurrentTurn ? 'border-pixel-gold shadow-[0_0_12px_rgba(245,197,66,0.5)] animate-pulse-slow' : 'border-pixel-panel'}
      `}>
        {/* Avatar */}
        <div className={`text-[16px] ${isCurrentTurn ? 'animate-bounce-gentle' : ''}`}>
          {AVATARS[player.avatar % AVATARS.length]}
        </div>

        {/* Info */}
        <div className="text-center">
          <div className={`font-pixel text-[7px] truncate max-w-[80px] ${
            player.isBot ? 'text-pixel-muted' : 'text-pixel-text'
          }`}>
            {player.name}
          </div>
          <div className="font-pixel text-[8px] text-pixel-accent">
            {player.totalScore} pts
          </div>
        </div>

        {/* Card count (for opponents) */}
        {position !== PlayerPosition.SOUTH && (
          <div className="font-pixel text-[7px] text-pixel-muted">
            🃏{player.cardCount}
          </div>
        )}
      </div>
    </div>
  );
}
