# ── Quizzy API — production build ──
FROM node:20-slim AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy everything needed for install + build
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install deps (workspace-aware)
RUN pnpm install --frozen-lockfile

# Build the API
RUN pnpm --filter @quizzy/api build

# ── Production image ──
FROM node:20-slim
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./api_node_modules

# NestJS needs reflect-metadata at runtime
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
