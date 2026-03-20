import React, { useState } from 'react';
import { PixelButton } from '../shared/PixelButton';
import { SUIT_SYMBOL, Suit } from '@shared/game-types';

interface MainMenuProps {
  onPlay: () => void;
  onSettings: () => void;
  onHowToPlay: () => void;
}

const FLOATING_SUITS = [
  { symbol: SUIT_SYMBOL[Suit.HEARTS], x: 10, y: 15, delay: 0, size: 24 },
  { symbol: SUIT_SYMBOL[Suit.SPADES], x: 80, y: 25, delay: 1.2, size: 20 },
  { symbol: SUIT_SYMBOL[Suit.DIAMONDS], x: 25, y: 70, delay: 0.8, size: 18 },
  { symbol: SUIT_SYMBOL[Suit.CLUBS], x: 70, y: 65, delay: 2, size: 22 },
  { symbol: SUIT_SYMBOL[Suit.HEARTS], x: 50, y: 85, delay: 0.4, size: 16 },
  { symbol: SUIT_SYMBOL[Suit.SPADES], x: 90, y: 80, delay: 1.6, size: 14 },
];

export function MainMenu({ onPlay, onSettings, onHowToPlay }: MainMenuProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background floating suit symbols */}
      {FLOATING_SUITS.map((s, i) => (
        <div
          key={i}
          className="absolute text-pixel-accent opacity-10 animate-float pointer-events-none"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${3 + i * 0.5}s`,
          }}
        >
          {s.symbol}
        </div>
      ))}

      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />

      {/* Title */}
      <div className="relative mb-12 animate-slide-up">
        <h1 className="font-pixel text-[28px] sm:text-[36px] text-pixel-accent leading-tight text-center"
          style={{
            textShadow: '3px 3px 0 #1a1a2e, -1px -1px 0 rgba(233,69,96,0.3), 0 0 30px rgba(233,69,96,0.2)',
          }}
        >
          PIXEL
        </h1>
        <h1 className="font-pixel text-[28px] sm:text-[36px] text-pixel-gold leading-tight text-center"
          style={{
            textShadow: '3px 3px 0 #1a1a2e, 0 0 30px rgba(245,197,66,0.2)',
          }}
        >
          HEARTS
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-pixel-hearts text-[18px]">♥</span>
          <span className="text-pixel-spades text-[18px]">♠</span>
          <span className="text-pixel-hearts text-[18px]">♦</span>
          <span className="text-pixel-clubs text-[18px]">♣</span>
        </div>
      </div>

      {/* Menu buttons */}
      <div className="flex flex-col gap-4 items-center animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <PixelButton variant="primary" size="lg" onClick={onPlay}>
          ♥ PLAY ♥
        </PixelButton>

        <PixelButton variant="secondary" size="md" onClick={onSettings}>
          ⚙ SETTINGS
        </PixelButton>

        <PixelButton variant="secondary" size="md" onClick={onHowToPlay}>
          ? HOW TO PLAY
        </PixelButton>
      </div>

      {/* Version */}
      <div className="absolute bottom-4 right-4 text-[7px] font-pixel text-pixel-muted opacity-50">
        v1.0.0
      </div>
    </div>
  );
}
