import React from 'react';
import { PixelButton } from '../shared/PixelButton';

interface ModeSelectProps {
  onSolo: () => void;
  onMultiplayer: () => void;
  onBack: () => void;
}

export function ModeSelect({ onSolo, onMultiplayer, onBack }: ModeSelectProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-6">
      <h2 className="font-pixel text-[14px] text-pixel-gold mb-4">CHOOSE MODE</h2>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Solo Mode Card */}
        <button
          onClick={onSolo}
          className="pixel-panel w-[200px] h-[180px] flex flex-col items-center justify-center gap-3
            border-pixel-green hover:border-pixel-gold hover:shadow-[0_0_20px_rgba(78,204,163,0.3)]
            transition-all duration-200 cursor-pointer group"
        >
          <div className="text-[32px] group-hover:scale-110 transition-transform">🤖</div>
          <div className="font-pixel text-[12px] text-pixel-green">SOLO</div>
          <div className="font-pixel text-[7px] text-pixel-muted text-center leading-relaxed">
            Play against<br />bot opponents
          </div>
        </button>

        {/* Multiplayer Mode Card */}
        <button
          onClick={onMultiplayer}
          className="pixel-panel w-[200px] h-[180px] flex flex-col items-center justify-center gap-3
            border-pixel-accent hover:border-pixel-gold hover:shadow-[0_0_20px_rgba(233,69,96,0.3)]
            transition-all duration-200 cursor-pointer group"
        >
          <div className="text-[32px] group-hover:scale-110 transition-transform">👥</div>
          <div className="font-pixel text-[12px] text-pixel-accent">MULTIPLAYER</div>
          <div className="font-pixel text-[7px] text-pixel-muted text-center leading-relaxed">
            Play with friends<br />online
          </div>
        </button>
      </div>

      <PixelButton variant="secondary" size="sm" onClick={onBack}>
        ← BACK
      </PixelButton>
    </div>
  );
}
