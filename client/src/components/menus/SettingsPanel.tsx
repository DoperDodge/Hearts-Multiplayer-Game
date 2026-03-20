import React from 'react';
import { PixelButton } from '../shared/PixelButton';
import { PixelPanel } from '../shared/PixelPanel';
import { useSettingsStore } from '../../store/settingsStore';

interface SettingsPanelProps {
  onBack: () => void;
}

function Slider({ label, value, onChange, min = 0, max = 1, step = 0.1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <span className="font-pixel text-[7px] text-pixel-muted">{label}</span>
        <span className="font-pixel text-[7px] text-pixel-gold">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-pixel-bg rounded-none appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-pixel-accent
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-pixel-bg"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="font-pixel text-[7px]">{label}</span>
      <div
        onClick={() => onChange(!value)}
        className={`w-10 h-5 border-2 relative transition-colors cursor-pointer ${
          value ? 'bg-pixel-green border-pixel-green' : 'bg-pixel-bg border-pixel-panel'
        }`}
      >
        <div className={`absolute top-0.5 w-3 h-3 bg-pixel-text transition-all ${
          value ? 'left-5' : 'left-0.5'
        }`} />
      </div>
    </label>
  );
}

export function SettingsPanel({ onBack }: SettingsPanelProps) {
  const settings = useSettingsStore();

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-4 overflow-y-auto">
      <PixelPanel className="w-full max-w-[420px]" title="Settings">
        {/* Audio */}
        <div className="mb-5">
          <div className="text-[9px] font-pixel text-pixel-accent mb-2 border-b border-pixel-panel pb-1">AUDIO</div>
          <div className="flex flex-col gap-3">
            <Slider label="Master Volume" value={settings.masterVolume} onChange={settings.setMasterVolume} />
            <Slider label="Sound Effects" value={settings.sfxVolume} onChange={settings.setSfxVolume} />
            <Slider label="Music" value={settings.musicVolume} onChange={settings.setMusicVolume} />
            <Toggle label="Mute All" value={settings.muted} onChange={settings.toggleMute} />
          </div>
        </div>

        {/* Gameplay */}
        <div className="mb-5">
          <div className="text-[9px] font-pixel text-pixel-accent mb-2 border-b border-pixel-panel pb-1">GAMEPLAY</div>
          <div className="flex flex-col gap-2">
            <div>
              <span className="font-pixel text-[7px] text-pixel-muted">Animation Speed</span>
              <div className="flex gap-1 mt-1">
                {(['slow', 'normal', 'fast', 'instant'] as const).map(s => (
                  <button key={s} onClick={() => settings.setAnimationSpeed(s)}
                    className={`font-pixel text-[7px] px-2 py-1 border ${
                      settings.animationSpeed === s ? 'border-pixel-gold text-pixel-gold' : 'border-pixel-panel text-pixel-muted'
                    }`}>
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <Toggle label="Auto-sort Hand" value={settings.autoSortHand} onChange={settings.setAutoSortHand} />
            <Toggle label="Confirm Card Play" value={settings.confirmPlay} onChange={settings.setConfirmPlay} />
          </div>
        </div>

        {/* Display */}
        <div className="mb-5">
          <div className="text-[9px] font-pixel text-pixel-accent mb-2 border-b border-pixel-panel pb-1">DISPLAY</div>
          <div className="flex flex-col gap-2">
            <Toggle label="Show Trick History" value={settings.showTrickHistory} onChange={settings.setShowTrickHistory} />
            <Toggle label="Screen Shake" value={settings.screenShake} onChange={settings.setScreenShake} />
            <Toggle label="Particle Effects" value={settings.particleEffects} onChange={settings.setParticleEffects} />
          </div>
        </div>

        {/* Accessibility */}
        <div className="mb-5">
          <div className="text-[9px] font-pixel text-pixel-accent mb-2 border-b border-pixel-panel pb-1">ACCESSIBILITY</div>
          <div className="flex flex-col gap-2">
            <Toggle label="Color-blind Mode" value={settings.colorBlindMode} onChange={settings.setColorBlindMode} />
            <Toggle label="High Contrast" value={settings.highContrast} onChange={settings.setHighContrast} />
            <Toggle label="Large Text" value={settings.largeText} onChange={settings.setLargeText} />
          </div>
        </div>

        <PixelButton variant="secondary" size="sm" onClick={onBack}>
          ← BACK
        </PixelButton>
      </PixelPanel>
    </div>
  );
}
