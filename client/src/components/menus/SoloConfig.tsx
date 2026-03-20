import React, { useState } from 'react';
import { PixelButton } from '../shared/PixelButton';
import { PixelPanel } from '../shared/PixelPanel';
import { BotDifficulty, MoonScoringVariant } from '@shared/game-types';

interface SoloConfigProps {
  onStart: (difficulty: BotDifficulty, settings: any) => void;
  onBack: () => void;
}

export function SoloConfig({ onStart, onBack }: SoloConfigProps) {
  const [difficulty, setDifficulty] = useState<BotDifficulty>(BotDifficulty.MEDIUM);
  const [scoreLimit, setScoreLimit] = useState(100);
  const [jackOfDiamonds, setJackOfDiamonds] = useState(false);
  const [moonVariant, setMoonVariant] = useState<MoonScoringVariant>(MoonScoringVariant.ADD_TO_OTHERS);

  const difficulties: { value: BotDifficulty; label: string; desc: string; color: string }[] = [
    { value: BotDifficulty.EASY, label: 'EASY', desc: 'Random legal plays. Great for learning!', color: 'text-pixel-green border-pixel-green' },
    { value: BotDifficulty.MEDIUM, label: 'MEDIUM', desc: 'Avoids taking points. Moderate challenge.', color: 'text-pixel-gold border-pixel-gold' },
    { value: BotDifficulty.HARD, label: 'HARD', desc: 'Counts cards and plays strategically.', color: 'text-pixel-accent border-pixel-accent' },
  ];

  const scoreLimits = [50, 75, 100, 150, 200];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
      <PixelPanel className="w-full max-w-[420px]" title="Solo Game Setup">
        {/* Difficulty */}
        <div className="mb-5">
          <label className="block text-[8px] font-pixel text-pixel-muted mb-2 uppercase">
            Bot Difficulty
          </label>
          <div className="flex flex-col gap-2">
            {difficulties.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`pixel-panel text-left px-3 py-2 transition-all border-2 ${
                  difficulty === d.value
                    ? `${d.color} bg-pixel-panel`
                    : 'border-pixel-bg hover:border-pixel-muted'
                }`}
              >
                <div className={`font-pixel text-[10px] ${difficulty === d.value ? d.color.split(' ')[0] : 'text-pixel-text'}`}>
                  {d.label}
                </div>
                <div className="font-pixel text-[7px] text-pixel-muted mt-1">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Score Limit */}
        <div className="mb-5">
          <label className="block text-[8px] font-pixel text-pixel-muted mb-2 uppercase">
            Score Limit
          </label>
          <div className="flex gap-2 flex-wrap">
            {scoreLimits.map(limit => (
              <button
                key={limit}
                onClick={() => setScoreLimit(limit)}
                className={`font-pixel text-[9px] px-3 py-2 border-2 transition-all ${
                  scoreLimit === limit
                    ? 'border-pixel-gold text-pixel-gold bg-pixel-panel'
                    : 'border-pixel-panel text-pixel-muted hover:border-pixel-muted'
                }`}
              >
                {limit}
              </button>
            ))}
          </div>
        </div>

        {/* Variant Rules */}
        <div className="mb-5">
          <label className="block text-[8px] font-pixel text-pixel-muted mb-2 uppercase">
            Variants
          </label>
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={jackOfDiamonds}
              onChange={(e) => setJackOfDiamonds(e.target.checked)}
              className="w-4 h-4 accent-pixel-gold"
            />
            <span className="font-pixel text-[8px]">Jack of Diamonds (♦J = −10 pts)</span>
          </label>
        </div>

        {/* Quick Presets */}
        <div className="mb-5">
          <label className="block text-[8px] font-pixel text-pixel-muted mb-2 uppercase">
            Quick Start
          </label>
          <div className="flex gap-2 flex-wrap">
            <PixelButton variant="secondary" size="sm"
              onClick={() => { setScoreLimit(50); setDifficulty(BotDifficulty.EASY); }}>
              Quick (50)
            </PixelButton>
            <PixelButton variant="secondary" size="sm"
              onClick={() => { setScoreLimit(100); setDifficulty(BotDifficulty.MEDIUM); }}>
              Standard
            </PixelButton>
            <PixelButton variant="secondary" size="sm"
              onClick={() => { setScoreLimit(200); setDifficulty(BotDifficulty.HARD); }}>
              Marathon
            </PixelButton>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-between mt-4">
          <PixelButton variant="secondary" size="sm" onClick={onBack}>
            ← BACK
          </PixelButton>
          <PixelButton variant="primary" size="lg" onClick={() => onStart(difficulty, {
            scoreLimit,
            jackOfDiamonds,
            moonScoringVariant: moonVariant,
          })}>
            ♥ START ♥
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
