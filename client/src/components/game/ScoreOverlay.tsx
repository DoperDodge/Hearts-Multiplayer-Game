import React from 'react';
import { PixelPanel } from '../shared/PixelPanel';
import { PlayerData } from '../../store/gameStore';

interface ScoreOverlayProps {
  players: PlayerData[];
  handScores: Record<string, number>;
  moonShooter: string | null;
  roundNumber: number;
}

export function ScoreOverlay({ players, handScores, moonShooter, roundNumber }: ScoreOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 animate-fade-in">
      <PixelPanel className="max-w-[360px] w-full mx-4" title={`Hand ${roundNumber} Complete`}>
        {moonShooter && (
          <div className="text-center mb-4 animate-bounce-gentle">
            <div className="text-[28px]">🌙</div>
            <div className="font-pixel text-[10px] text-pixel-gold mt-1">
              {players.find(p => p.id === moonShooter)?.name} SHOT THE MOON!
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {players.map(player => {
            const handPts = handScores[player.id] || 0;
            return (
              <div key={player.id}
                className={`flex items-center justify-between px-3 py-2 border-2 ${
                  player.id === moonShooter ? 'border-pixel-gold bg-pixel-panel' : 'border-pixel-bg'
                }`}>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[8px] text-pixel-text truncate max-w-[100px]">
                    {player.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-pixel text-[9px] ${
                    handPts > 0 ? 'text-pixel-accent' : handPts < 0 ? 'text-pixel-green' : 'text-pixel-muted'
                  }`}>
                    {handPts > 0 ? '+' : ''}{handPts}
                  </span>
                  <span className="font-pixel text-[10px] text-pixel-gold">
                    {player.totalScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-3 font-pixel text-[7px] text-pixel-muted animate-pulse-slow">
          Next hand starting...
        </div>
      </PixelPanel>
    </div>
  );
}
