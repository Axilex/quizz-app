# Quizzos

> Quiz interactif moderne — testez vos connaissances, défiez vos amis.

## Stack

| Layer    | Tech                         |
| -------- | ---------------------------- |
| Frontend | Vue 3 + Composition API + TS |
| Build    | Vite                         |
| State    | Pinia                        |
| Routing  | Vue Router                   |
| Styling  | Custom CSS (design tokens)   |
| Monorepo | pnpm workspaces + Turborepo  |
| Tests    | Vitest + Vue Test Utils      |
| Quality  | ESLint + Prettier + Husky    |
| CI       | GitHub Actions               |
| Backend  | NestJS (planned V2)          |
| Realtime | Socket.IO (planned V2)       |

## Quick Start

```bash
# Prerequisites: Node.js >= 20, pnpm >= 9

# Clone and install
git clone <repo-url> quizzos
cd quizzos
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Lint & format
pnpm lint
pnpm format

# Type check
pnpm typecheck

# Build for production
pnpm build
```

## Project Structure

```
quizzos/
├── apps/
│   ├── web/                  # Vue 3 frontend
│   │   └── src/
│   │       ├── app/router/   # Vue Router config
│   │       ├── components/   # UI components
│   │       │   ├── game/     # Quiz gameplay
│   │       │   ├── lobby/    # Multiplayer lobby
│   │       │   ├── results/  # Score & review
│   │       │   └── ui/       # Base components
│   │       ├── composables/  # Vue composables
│   │       ├── data/         # Local JSON questions
│   │       ├── pages/        # Route pages
│   │       ├── services/     # Business logic
│   │       │   ├── game/     # Timer, Score, Engine
│   │       │   ├── multiplayer/  # Gateway (mock)
│   │       │   └── questions/    # Repository
│   │       ├── stores/       # Pinia stores
│   │       ├── types/        # TypeScript types
│   │       └── utils/        # Helpers
│   └── api/                  # NestJS placeholder (V2)
├── packages/
│   ├── eslint-config/        # Shared ESLint
│   ├── prettier-config/      # Shared Prettier
│   └── typescript-config/    # Shared TSConfig
├── .github/workflows/        # CI pipeline
└── .husky/                   # Git hooks
```

## Architecture Decisions

### Services over components

All business logic lives in services (`TimerService`, `ScoreService`, `GameEngineService`). Components are purely presentational + store bindings.

### Multiplayer-ready

The `MultiplayerGateway` interface is defined in types. V1 uses `MockMultiplayerGateway`. Swapping to a real Socket.IO implementation requires no component changes.

### Timer system

Timer duration = `DIFFICULTY_TIMERS[difficulty] + TYPE_MODIFIERS[type]`, overridden by `question.baseTimer` if set.

| Difficulty | Base | +text | +number | +image | +qcm |
| ---------- | ---- | ----- | ------- | ------ | ---- |
| easy       | 15s  | 15s   | 20s     | 23s    | 15s  |
| medium     | 25s  | 25s   | 30s     | 33s    | 25s  |
| hard       | 35s  | 35s   | 40s     | 43s    | 35s  |

## V2 Roadmap

- [ ] NestJS backend with question API
- [ ] Socket.IO multiplayer rooms
- [ ] Player authentication
- [ ] Question editor admin panel
- [ ] Leaderboards & stats
- [ ] Image question assets
- [ ] Sound effects & haptics

## License

Private — All rights reserved.
