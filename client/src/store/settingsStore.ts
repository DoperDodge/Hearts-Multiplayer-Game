// ============================================================
// PIXEL HEARTS — Settings Store
// ============================================================

import { create } from 'zustand';

interface SettingsStore {
  // Audio
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;

  // Gameplay
  animationSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  autoSortHand: boolean;
  cardSize: 'small' | 'medium' | 'large';
  confirmPlay: boolean;

  // Display
  showTrickHistory: boolean;
  screenShake: boolean;
  particleEffects: boolean;

  // Accessibility
  colorBlindMode: boolean;
  highContrast: boolean;
  largeText: boolean;

  // Player info
  playerName: string;
  playerAvatar: number;

  // Actions
  setMasterVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  toggleMute: () => void;
  setAnimationSpeed: (s: 'slow' | 'normal' | 'fast' | 'instant') => void;
  setAutoSortHand: (v: boolean) => void;
  setCardSize: (s: 'small' | 'medium' | 'large') => void;
  setConfirmPlay: (v: boolean) => void;
  setShowTrickHistory: (v: boolean) => void;
  setScreenShake: (v: boolean) => void;
  setParticleEffects: (v: boolean) => void;
  setColorBlindMode: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setLargeText: (v: boolean) => void;
  setPlayerName: (n: string) => void;
  setPlayerAvatar: (a: number) => void;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(`pixelhearts_${key}`);
    if (val === null) return fallback;
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: any): void {
  try {
    localStorage.setItem(`pixelhearts_${key}`, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  masterVolume: loadFromStorage('masterVolume', 0.7),
  sfxVolume: loadFromStorage('sfxVolume', 0.8),
  musicVolume: loadFromStorage('musicVolume', 0.5),
  muted: loadFromStorage('muted', false),
  animationSpeed: loadFromStorage('animationSpeed', 'normal'),
  autoSortHand: loadFromStorage('autoSortHand', true),
  cardSize: loadFromStorage('cardSize', 'medium'),
  confirmPlay: loadFromStorage('confirmPlay', false),
  showTrickHistory: loadFromStorage('showTrickHistory', true),
  screenShake: loadFromStorage('screenShake', true),
  particleEffects: loadFromStorage('particleEffects', true),
  colorBlindMode: loadFromStorage('colorBlindMode', false),
  highContrast: loadFromStorage('highContrast', false),
  largeText: loadFromStorage('largeText', false),
  playerName: loadFromStorage('name', ''),
  playerAvatar: loadFromStorage('avatar', 0),

  setMasterVolume: (v) => { saveToStorage('masterVolume', v); set({ masterVolume: v }); },
  setSfxVolume: (v) => { saveToStorage('sfxVolume', v); set({ sfxVolume: v }); },
  setMusicVolume: (v) => { saveToStorage('musicVolume', v); set({ musicVolume: v }); },
  toggleMute: () => set((s) => { const m = !s.muted; saveToStorage('muted', m); return { muted: m }; }),
  setAnimationSpeed: (s) => { saveToStorage('animationSpeed', s); set({ animationSpeed: s }); },
  setAutoSortHand: (v) => { saveToStorage('autoSortHand', v); set({ autoSortHand: v }); },
  setCardSize: (s) => { saveToStorage('cardSize', s); set({ cardSize: s }); },
  setConfirmPlay: (v) => { saveToStorage('confirmPlay', v); set({ confirmPlay: v }); },
  setShowTrickHistory: (v) => { saveToStorage('showTrickHistory', v); set({ showTrickHistory: v }); },
  setScreenShake: (v) => { saveToStorage('screenShake', v); set({ screenShake: v }); },
  setParticleEffects: (v) => { saveToStorage('particleEffects', v); set({ particleEffects: v }); },
  setColorBlindMode: (v) => { saveToStorage('colorBlindMode', v); set({ colorBlindMode: v }); },
  setHighContrast: (v) => { saveToStorage('highContrast', v); set({ highContrast: v }); },
  setLargeText: (v) => { saveToStorage('largeText', v); set({ largeText: v }); },
  setPlayerName: (n) => { saveToStorage('name', n); set({ playerName: n }); },
  setPlayerAvatar: (a) => { saveToStorage('avatar', a); set({ playerAvatar: a }); },
}));
