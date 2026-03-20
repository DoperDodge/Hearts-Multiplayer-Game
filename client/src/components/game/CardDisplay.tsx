import React from 'react';
import { Card, Suit, SUIT_SYMBOL, RANK_SHORT } from '@shared/game-types';

interface CardDisplayProps {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  small?: boolean;
  onClick?: () => void;
  className?: string;
}

const SUIT_COLORS: Record<Suit, string> = {
  [Suit.HEARTS]: '#e94560',
  [Suit.DIAMONDS]: '#e94560',
  [Suit.CLUBS]: '#2d2d3d',
  [Suit.SPADES]: '#2d2d3d',
};

const SUIT_BG: Record<Suit, string> = {
  [Suit.HEARTS]: 'rgba(233, 69, 96, 0.08)',
  [Suit.DIAMONDS]: 'rgba(233, 69, 96, 0.08)',
  [Suit.CLUBS]: 'rgba(45, 45, 61, 0.05)',
  [Suit.SPADES]: 'rgba(45, 45, 61, 0.05)',
};

export function CardDisplay({
  card, faceDown = false, selected = false, disabled = false,
  highlighted = false, small = false, onClick, className = '',
}: CardDisplayProps) {
  const w = small ? 'w-[50px]' : 'w-[70px]';
  const h = small ? 'h-[72px]' : 'h-[100px]';
  const fontSize = small ? 'text-[10px]' : 'text-[14px]';
  const suitSize = small ? 'text-[16px]' : 'text-[22px]';

  if (faceDown || !card) {
    return (
      <div
        className={`${w} ${h} rounded border-2 border-pixel-panel flex items-center justify-center
          bg-gradient-to-br from-pixel-panel to-[#0a2540] ${className}`}
        style={{ imageRendering: 'pixelated' }}
      >
        <div className="w-[80%] h-[80%] rounded-sm opacity-30"
          style={{
            background: 'repeating-conic-gradient(var(--color-accent) 0% 25%, transparent 0% 50%) 50% / 10px 10px',
          }}
        />
      </div>
    );
  }

  const suitColor = SUIT_COLORS[card.suit];
  const suitSymbol = SUIT_SYMBOL[card.suit];
  const rankStr = RANK_SHORT[card.rank];
  const bgTint = SUIT_BG[card.suit];

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        ${w} ${h} rounded border-2 flex flex-col items-center justify-between p-1
        font-pixel transition-all duration-150 select-none relative
        ${disabled ? 'opacity-40 cursor-not-allowed border-gray-400' : 'cursor-pointer border-[#bbb]'}
        ${selected ? 'translate-y-[-16px] shadow-[0_0_0_3px_var(--color-gold)] z-20' : ''}
        ${highlighted ? 'shadow-[0_0_12px_var(--color-gold)]' : ''}
        ${!disabled && !selected ? 'hover:translate-y-[-8px] hover:shadow-lg hover:z-10' : ''}
        ${className}
      `}
      style={{
        backgroundColor: '#f5f0e8',
        background: `linear-gradient(135deg, #faf7f0, #f0ebe0)`,
        color: suitColor,
      }}
    >
      {/* Top-left rank + suit */}
      <div className="self-start leading-tight">
        <div className={`${fontSize} font-bold`}>{rankStr}</div>
        <div className={small ? 'text-[10px]' : 'text-[12px]'} style={{ marginTop: '-2px' }}>{suitSymbol}</div>
      </div>

      {/* Center suit */}
      <div className={`${suitSize} leading-none`}>
        {suitSymbol}
      </div>

      {/* Bottom-right rank + suit (inverted) */}
      <div className="self-end leading-tight rotate-180">
        <div className={`${fontSize} font-bold`}>{rankStr}</div>
        <div className={small ? 'text-[10px]' : 'text-[12px]'} style={{ marginTop: '-2px' }}>{suitSymbol}</div>
      </div>
    </div>
  );
}
