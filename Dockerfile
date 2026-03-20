# ============================================================
# PIXEL HEARTS — Dockerfile (Railway Deployment)
# ============================================================

FROM node:20-alpine AS base
WORKDIR /app

# ── Install dependencies ─────────────────────────────────
FROM base AS deps
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN cd client && npm install
RUN cd server && npm install

# ── Build client ─────────────────────────────────────────
FROM deps AS build-client
COPY shared/ ./shared/
COPY client/ ./client/
RUN cd client && npm run build

# ── Build server ─────────────────────────────────────────
FROM deps AS build-server
COPY shared/ ./shared/
COPY server/ ./server/
RUN cd server && npm run build

# ── Production image ─────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps /app/server/node_modules ./server/node_modules
COPY --from=build-server /app/server/dist ./server/dist
COPY --from=build-server /app/shared ./shared
COPY --from=build-client /app/client/dist ./client/dist

WORKDIR /app/server

EXPOSE ${PORT:-3001}

CMD ["node", "dist/server/src/index.js"]
