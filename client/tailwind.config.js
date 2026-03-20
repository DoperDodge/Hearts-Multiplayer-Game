/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        pixel: {
          bg: '#1a1a2e',
          surface: '#16213e',
          panel: '#0f3460',
          accent: '#e94560',
          gold: '#f5c542',
          green: '#4ecca3',
          text: '#eaeaea',
          muted: '#8b8b8b',
          hearts: '#e94560',
          diamonds: '#4ecdc4',
          clubs: '#45b7d1',
          spades: '#c5c6c7',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-8px) rotate(1deg)' },
          '66%': { transform: 'translateY(-4px) rotate(-1deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(233, 69, 96, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(233, 69, 96, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};
