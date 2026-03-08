# ── Quizzy API — production multi-stage build ──
# Monorepo-aware: copies workspace deps for pnpm install

# ── Stage 1: Build ──
FROM node:20-slim AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# 1. Workspace root files (for pnpm install to resolve workspaces)
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./

# 2. Internal packages (workspace:* dependencies)
COPY packages/ ./packages/

# 3. API source
COPY apps/api/ ./apps/api/

# 4. Install all deps (workspace-aware, pruned to what api needs)
RUN pnpm install --frozen-lockfile

# 5. Build NestJS (compiles TS + copies data/*.json via nest-cli assets)
RUN pnpm --filter @quizzy/api build

# ── Stage 2: Production ──
FROM node:20-slim AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy compiled output (includes data/*.json thanks to nest-cli assets)
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

# Copy node_modules (monorepo hoisted + local)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./api_modules

# Non-root user
RUN groupadd -r quizzy && useradd -r -g quizzy quizzy
USER quizzy

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/questions/categories').then(r=>{if(!r.ok)throw r;process.exit(0)}).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
