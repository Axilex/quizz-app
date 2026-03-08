# ── Quizzy Frontend — build static files ──
# Output: /app/apps/web/dist (copied to Caddy volume)

FROM node:20-slim AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Build arg: API URL baked into the JS bundle at build time
# Empty string = same origin (Caddy proxies /questions/* to API)
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

# 1. Workspace root files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./

# 2. Internal packages
COPY packages/ ./packages/

# 3. Frontend source
COPY apps/web/ ./apps/web/

# 4. Install deps
RUN pnpm install --frozen-lockfile

# 5. Build Vue 3 (vite build → dist/)
RUN pnpm --filter @quizzy/web build

# ── Stage 2: Tiny output (just the static files) ──
FROM alpine:3.20 AS output
COPY --from=builder /app/apps/web/dist /dist

# This container doesn't run — Caddy serves these files via a shared volume.
# It just copies dist/ to the volume at startup.
CMD ["cp", "-r", "/dist/.", "/output/"]
