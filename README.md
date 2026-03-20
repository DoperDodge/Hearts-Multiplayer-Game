# Pixel Hearts ♥

A browser-based multiplayer Hearts card game with pixel art aesthetics, smooth animations, bot AI opponents, and real-time multiplayer via WebSockets.

## Quick Start

### Prerequisites
- Node.js 20+ (LTS)
- npm 9+

### Development

```bash
# Install all dependencies
npm run install:all

# Start both server and client in dev mode
npm run dev
```

- Client runs at: http://localhost:5173
- Server runs at: http://localhost:3001

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
pixel-hearts/
├── shared/          # Shared types between client & server
├── server/          # Node.js + Express + WebSocket server
│   └── src/
│       ├── game/    # Hearts game engine (server-authoritative)
│       ├── bots/    # Bot AI (Easy, Medium, Hard)
│       ├── rooms/   # Room management
│       └── websocket/ # WebSocket connection handling
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/ # React UI components
│       ├── game-logic/ # Client-side game rules (mirrors server)
│       ├── store/      # Zustand state management
│       └── network/    # WebSocket client
├── Dockerfile       # Railway deployment
└── railway.json     # Railway config
```

## Game Features

- **Full Hearts Rules**: Standard 4-player Hearts with all official rules
- **Three Bot Difficulties**: Easy (random), Medium (avoidance), Hard (card counting)
- **Solo Mode**: Play against configurable bot opponents
- **Multiplayer**: Real-time WebSocket-based multiplayer with lobby system
- **Pixel Art Style**: Retro aesthetic with custom card designs
- **Variant Rules**: Jack of Diamonds, configurable score limits, moon scoring options
- **Responsive**: Works on desktop and mobile

## Deploying to Railway

1. Create a Railway account at [railway.app](https://railway.app)
2. Link your GitHub repository
3. Railway auto-detects the Dockerfile
4. Set environment variables:
   - `NODE_ENV=production`
   - `MAX_ROOMS=50`
5. Deploy!

The app uses a single port for both HTTP and WebSocket (Railway requirement).

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Zustand, Tailwind CSS
- **Backend**: Node.js, Express, ws (WebSocket), TypeScript
- **Deployment**: Docker, Railway

## License

MIT
