import React, { useState } from 'react';
import { PixelButton } from '../shared/PixelButton';
import { PixelInput } from '../shared/PixelInput';
import { PixelPanel } from '../shared/PixelPanel';
import { useSettingsStore } from '../../store/settingsStore';
import { NAME_PREFIXES, NAME_SUFFIXES, MAX_USERNAME_LENGTH } from '@shared/constants';

interface UsernameInputProps {
  onContinue: () => void;
  onBack: () => void;
}

const AVATARS = ['🧙', '🤠', '🦊', '🐸', '🌟', '🎭', '🦉', '🐺', '🌙', '🔥', '💎', '🃏'];

function generateRandomName(): string {
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${prefix}${suffix}`.slice(0, MAX_USERNAME_LENGTH);
}

export function UsernameInput({ onContinue, onBack }: UsernameInputProps) {
  const { playerName, playerAvatar, setPlayerName, setPlayerAvatar } = useSettingsStore();
  const [name, setName] = useState(playerName || '');
  const [avatar, setAvatar] = useState(playerAvatar);

  const handleContinue = () => {
    const finalName = name.trim() || generateRandomName();
    setPlayerName(finalName);
    setPlayerAvatar(avatar);
    localStorage.setItem('pixelhearts_name', JSON.stringify(finalName));
    localStorage.setItem('pixelhearts_avatar', JSON.stringify(avatar));
    onContinue();
  };

  const handleRandomName = () => {
    setName(generateRandomName());
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <PixelPanel className="w-full max-w-[400px]" title="Who are you?">
        {/* Name input */}
        <div className="mb-6">
          <label className="block text-[8px] font-pixel text-pixel-muted mb-2 uppercase">
            Your Name
          </label>
          <div className="flex gap-2">
            <PixelInput
              value={name}
              onChange={(v) => setName(v.replace(/[^a-zA-Z0-9_]/g, '').slice(0, MAX_USERNAME_LENGTH))}
              placeholder="Enter name..."
              maxLength={MAX_USERNAME_LENGTH}
              className="flex-1"
            />
            <PixelButton variant="secondary" size="sm" onClick={handleRandomName}>
              🎲
            </PixelButton>
          </div>
          <div className="text-[7px] font-pixel text-pixel-muted mt-1">
            {name.length}/{MAX_USERNAME_LENGTH} characters
          </div>
        </div>

        {/* Avatar selector */}
        <div className="mb-6">
          <label className="block text-[8px] font-pixel text-pixel-muted mb-2 uppercase">
            Choose Avatar
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((av, i) => (
              <button
                key={i}
                onClick={() => setAvatar(i)}
                className={`
                  w-10 h-10 flex items-center justify-center text-[18px]
                  border-2 transition-all duration-100
                  ${avatar === i
                    ? 'border-pixel-gold bg-pixel-panel scale-110 shadow-[0_0_8px_var(--color-gold)]'
                    : 'border-pixel-panel bg-pixel-bg hover:border-pixel-muted'
                  }
                `}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-between">
          <PixelButton variant="secondary" size="sm" onClick={onBack}>
            ← BACK
          </PixelButton>
          <PixelButton variant="gold" size="md" onClick={handleContinue}>
            CONTINUE →
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
