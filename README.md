# Quizzy

Le quiz entre amis qui pique le cerveau.

## Stack

- **Frontend** : Vue 3 + TypeScript + Vite + Pinia + Tailwind
- **Backend** : NestJS + Socket.IO
- **Monorepo** : pnpm workspaces + Turborepo

## Dev local

```bash
pnpm install
pnpm dev          # lance front + back
# ou séparément :
pnpm start:front  # http://localhost:5173
pnpm start:back   # http://localhost:3000
```

## Déploiement

### Frontend → Vercel

1. Importe le repo sur [vercel.com](https://vercel.com)
2. Framework Preset : **Vite**
3. Root Directory : **`.`** (racine du monorepo)
4. Env variable : `VITE_API_URL` = URL de ton backend Railway

### Backend → Railway

1. Crée un projet sur [railway.app](https://railway.app)
2. Connecte le repo GitHub
3. Env variables :
   - `PORT` = `3000` (auto-set par Railway)
   - `CORS_ORIGINS` = URL de ton frontend Vercel (ex: `https://quizzy.vercel.app`)
4. Railway détecte le `railway.toml` automatiquement

## Structure

```
apps/
  web/     → Frontend Vue (Vercel)
  api/     → Backend NestJS (Railway)
packages/
  typescript-config/
  eslint-config/
  prettier-config/
```
