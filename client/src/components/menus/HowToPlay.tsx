import React, { useState } from 'react';
import { PixelButton } from '../shared/PixelButton';
import { PixelPanel } from '../shared/PixelPanel';

interface HowToPlayProps {
  onBack: () => void;
}

const PAGES = [
  {
    title: 'OBJECTIVE',
    icon: '🎯',
    content: 'Hearts is a trick-avoidance game. Your goal is to finish with the LOWEST score. Each Heart card is worth 1 point, and the Queen of Spades is worth 13 points. When any player reaches 100 points, the game ends — lowest score wins!'
  },
  {
    title: 'THE PASS',
    icon: '🔄',
    content: 'Before each hand, you select 3 cards to pass to another player. The direction rotates: Left → Right → Across → No Pass. Choose wisely — get rid of dangerous cards like high Spades and Hearts!'
  },
  {
    title: 'PLAYING TRICKS',
    icon: '🃏',
    content: 'The player with the 2 of Clubs leads the first trick. You MUST follow suit if you can. If you can\'t, you may play any card. The highest card of the led suit wins the trick. There is no trump suit.'
  },
  {
    title: 'BREAKING HEARTS',
    icon: '💔',
    content: 'Hearts cannot be led until they are "broken." Hearts break when someone discards a Heart (or Queen of Spades) because they can\'t follow suit. After that, Hearts can be led freely.'
  },
  {
    title: 'SCORING',
    icon: '📊',
    content: 'Each Heart = 1 point. Queen of Spades = 13 points. All other cards = 0 points. Total penalty per hand is always 26 points. Points are BAD — avoid them!'
  },
  {
    title: 'SHOOT THE MOON',
    icon: '🌙',
    content: 'If you capture ALL 13 Hearts AND the Queen of Spades in one hand, you "Shoot the Moon!" Instead of getting 26 points, every OTHER player gets 26 points and you get 0. A risky but powerful strategy!'
  },
  {
    title: 'STRATEGY TIPS',
    icon: '💡',
    content: 'Pass the Queen of Spades and high Spades early. Try to void a suit to create discard opportunities. Watch for players collecting all the Hearts — they might be shooting the moon! Keep low cards as safe leads.'
  },
];

export function HowToPlay({ onBack }: HowToPlayProps) {
  const [page, setPage] = useState(0);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <PixelPanel className="w-full max-w-[440px]" title="How to Play">
        <div className="min-h-[220px] flex flex-col items-center text-center">
          <div className="text-[36px] mb-3">{PAGES[page].icon}</div>
          <h3 className="font-pixel text-[11px] text-pixel-gold mb-3">{PAGES[page].title}</h3>
          <p className="font-pixel text-[7px] text-pixel-text leading-[14px] max-w-[360px]">
            {PAGES[page].content}
          </p>
        </div>

        {/* Page dots */}
        <div className="flex justify-center gap-2 my-4">
          {PAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-2.5 h-2.5 transition-all ${
                i === page ? 'bg-pixel-accent scale-125' : 'bg-pixel-panel hover:bg-pixel-muted'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <PixelButton variant="secondary" size="sm" onClick={onBack}>
            ← BACK
          </PixelButton>
          <div className="flex gap-2">
            <PixelButton variant="secondary" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              ◄ PREV
            </PixelButton>
            <PixelButton variant="secondary" size="sm" onClick={() => setPage(Math.min(PAGES.length - 1, page + 1))} disabled={page === PAGES.length - 1}>
              NEXT ►
            </PixelButton>
          </div>
        </div>
      </PixelPanel>
    </div>
  );
}
