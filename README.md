# 🧠 Quizzy

**Le quiz entre amis qui pique le cerveau.**

Quizzy est une application de quiz multijoueur en temps réel avec 15 types de questions différents, un système de scoring basé sur la vitesse, et une architecture conçue pour scaler.

---

## Fonctionnalités

### Modes de jeu

- **Solo** — Joue seul, améliore ton score, rejoue les questions ratées
- **Multijoueur** — Crée une room, partage un code, joue en temps réel avec des amis via WebSocket

### 15 types de questions

| Type           | Description                                                                       |
| -------------- | --------------------------------------------------------------------------------- |
| Texte          | Question ouverte, réponse libre                                                   |
| Nombre         | Réponse numérique avec tolérance configurable                                     |
| Image          | Identifier un lieu, animal, plat… à partir d'une photo (Unsplash)                 |
| QCM            | Choix multiples classique                                                         |
| Rébus          | Deviner un mot à partir de pictogrammes SVG                                       |
| 4 Images 1 Mot | Trouver le mot commun à 4 images                                                  |
| Chronologie    | Remettre des événements dans l'ordre                                              |
| Blind Test     | Deviner ce qui se cache derrière un flou progressif                               |
| Carte Géo      | Identifier un pays par sa silhouette                                              |
| Géo Click      | Cliquer sur un pays sur une carte du monde                                        |
| Intrus         | Trouver l'intrus parmi 4 images                                                   |
| Silhouette     | Reconnaître un monument par sa silhouette SVG                                     |
| Image Coupée   | Deviner un mot-valise à partir de 2 moitiés d'images                              |
| Math Max       | Arranger des tuiles (nombres, opérateurs, parenthèses) pour maximiser un résultat |
| Calcul Mental  | Résoudre une opération mathématique générée dynamiquement                         |

### Scoring

- Points basés sur la vitesse : plus tu réponds vite, plus tu gagnes
- Barème par difficulté : facile (500 pts max), moyen (750), difficile (1000)
- Flash rounds en multijoueur : le premier à répondre correctement gagne 1500 pts bonus

### Timer intelligent

Le timer s'adapte à la difficulté et au type de question :

```
Timer = base(difficulté) + modificateur(type)

Exemples :
  facile + texte     = 15s + 0s  = 15s
  moyen + nombre     = 25s + 5s  = 30s
  difficile + image  = 35s + 8s  = 43s
  moyen + chronologie = 25s + 15s = 40s
  difficile + mathMax = 35s + 20s = 55s
```

---

## Stack technique

| Couche      | Technologie                                   |
| ----------- | --------------------------------------------- |
| Frontend    | Vue 3 + Composition API + TypeScript          |
| Build       | Vite 6                                        |
| State       | Pinia                                         |
| Routing     | Vue Router 4                                  |
| UI          | CSS custom (design system avec variables CSS) |
| Backend     | NestJS 10                                     |
| Temps réel  | Socket.IO 4                                   |
| Monorepo    | pnpm workspaces + Turborepo                   |
| Qualité     | ESLint + Prettier + Commitlint                |
| Tests       | Vitest + Vue Test Utils                       |
| Déploiement | Docker Compose + Caddy (HTTPS auto)           |

---

## Architecture

```
quizzy/
├── apps/
│   ├── web/                    # Frontend Vue 3
│   │   ├── src/
│   │   │   ├── app/router/     # Routes + guards
│   │   │   ├── components/
│   │   │   │   ├── game/       # QuizCard, TimerBar, AnswerInput, renderers/
│   │   │   │   ├── lobby/      # GameSettingsPanel, LobbyPlayersList, RoomCodeCard
│   │   │   │   ├── results/    # ResultCard
│   │   │   │   └── ui/         # AppShell, BaseButton, DifficultyBadge
│   │   │   ├── pages/          # HomePage, SetupPage, PlayPage, ResultsPage, LobbyPage...
│   │   │   ├── services/
│   │   │   │   ├── api/        # ApiClient (HTTP vers le backend)
│   │   │   │   ├── game/       # GameEngineService, TimerService, ScoreService
│   │   │   │   ├── multiplayer/# SocketIOMultiplayerGateway
│   │   │   │   └── questions/  # QuestionRepository
│   │   │   ├── stores/         # gameStore, timerStore, feedbackStore, lobbyStore, sessionStore
│   │   │   ├── types/          # TypeScript types (question, game, multiplayer)
│   │   │   └── utils/          # Logger, helpers
│   │   ├── Dockerfile
│   │   └── vite.config.ts
│   │
│   └── api/                    # Backend NestJS
│       ├── src/
│       │   ├── data/           # 14 fichiers JSON de questions (~270+)
│       │   ├── modules/
│       │   │   ├── game/       # GameScoringService, DTOs
│       │   │   ├── questions/  # QuestionsController, QuestionsService
│       │   │   └── rooms/      # RoomsGateway (WebSocket), RoomsService
│       │   └── common/         # Types partagés, guards
│       └── Dockerfile
│
├── packages/
│   ├── eslint-config/          # Config ESLint partagée
│   ├── prettier-config/        # Config Prettier partagée
│   └── typescript-config/      # Config TS partagée (base, vue, node)
│
├── docker-compose.yml          # Production stack (Caddy + API + Frontend build)
├── Caddyfile                   # Reverse proxy, HTTPS auto, compression
├── deploy.sh                   # Script de déploiement
└── turbo.json                  # Pipeline Turborepo
```

### Principes d'architecture

- **Séparation UI / logique métier** — Les composants Vue ne contiennent aucune logique de jeu. Tout passe par les services et les stores.
- **Backend = source de vérité** — Les réponses sont validées côté serveur. Le frontend ne connaît jamais la bonne réponse avant soumission.
- **Questions prêtes à l'emploi** — Le backend transforme les questions (`toPublic()`) pour retirer les réponses et préparer les données. Le frontend les affiche telles quelles.
- **Extensibilité multijoueur** — L'architecture est conçue pour remplacer `MockMultiplayerGateway` par une vraie implémentation Socket.IO sans refactoring.

---

## Développement local

### Prérequis

- Node.js >= 20
- pnpm >= 9

### Installation

```bash
# Cloner le repo
git clone https://github.com/ton-user/quizzy.git
cd quizzy

# Installer les dépendances
pnpm install
```

### Lancer en développement

```bash
# Lancer tout (frontend + backend) via Turborepo
pnpm dev

# Ou séparément :
pnpm start:front    # http://localhost:5173
pnpm start:back     # http://localhost:3000
```

### Variables d'environnement

**Frontend** (`apps/web/.env`) :

```env
VITE_API_URL=http://localhost:3000
```

**Backend** (`apps/api/.env`) :

```env
PORT=3000
CORS_ORIGINS=http://localhost:5173
```

### Scripts disponibles

```bash
pnpm dev              # Dev (front + back)
pnpm build            # Build production
pnpm lint             # Lint tous les packages
pnpm lint:fix         # Lint + fix automatique
pnpm format           # Format avec Prettier
pnpm typecheck        # Vérification TypeScript
pnpm test             # Tests unitaires
pnpm test:watch       # Tests en mode watch
pnpm clean            # Nettoyer dist/ et node_modules
```

---

## Déploiement en production

### Architecture Docker

Le stack Docker Compose inclut 3 services :

1. **Caddy** — Reverse proxy, HTTPS automatique (Let's Encrypt), compression, cache des assets
2. **Web** — Build du frontend Vue (conteneur one-shot qui copie `dist/` dans un volume partagé)
3. **API** — Backend NestJS + Socket.IO

### Déployer sur un VPS

```bash
# 1. Cloner le repo sur le serveur
git clone https://github.com/ton-user/quizzy.git
cd quizzy

# 2. Configurer l'environnement
cp .env.example .env
nano .env
# → Renseigner DOMAIN, CORS_ORIGINS, etc.

# 3. Lancer
docker compose up -d --build

# 4. Vérifier
docker compose ps
docker compose logs -f
```

### Script de déploiement

```bash
./deploy.sh              # Rebuild tout
./deploy.sh front        # Rebuild le frontend uniquement
./deploy.sh api          # Rebuild le backend uniquement
./deploy.sh logs         # Voir les logs
./deploy.sh status       # État des conteneurs
./deploy.sh stop         # Tout arrêter
```

### DNS

Chez ton registrar, crée ces enregistrements :

| Type | Nom | Valeur        |
| ---- | --- | ------------- |
| A    | @   | IP_DU_SERVEUR |
| A    | www | IP_DU_SERVEUR |

Caddy obtiendra automatiquement un certificat SSL Let's Encrypt.

### VPS recommandé

**Hetzner CX32** — 4 vCPU, 8 Go RAM, 80 Go SSD, ~6,80 €/mois HT. Largement suffisant pour le stack complet avec de la marge.

---

## Banque de questions

### Statistiques

| Type        | Nombre    | Catégories                                                                                                      |
| ----------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| Texte       | 138       | cinéma, musique, sport, séries, jeux vidéo, gastronomie, sciences, géographie, culture, technologie, célébrités |
| Nombre      | 40        | culture, sciences, sport, géographie, technologie                                                               |
| QCM         | 30        | cinéma, sciences, culture, sport, musique, géographie, technologie, histoire, séries, jeux vidéo, gastronomie   |
| Image       | 15        | géographie, sciences, gastronomie                                                                               |
| Chronologie | 10        | histoire, sciences, cinéma, jeux vidéo, musique, technologie, sport, culture, séries                            |
| Math Max    | 10        | mathématiques (avec support des parenthèses)                                                                    |
| Géo Click   | 10        | géographie                                                                                                      |
| Silhouette  | 10        | monuments                                                                                                       |
| Split Image | 5         | jeux de mots                                                                                                    |
| Intrus      | 1         | nature                                                                                                          |
| Blind Test  | 1         | culture                                                                                                         |
| Rébus       | 1         | culture                                                                                                         |
| 4 Images    | 1         | culture                                                                                                         |
| Géo Map     | 1         | géographie                                                                                                      |
| **Total**   | **~273+** | —                                                                                                               |

Les questions Calcul Mental (`mathSimple`) sont générées dynamiquement par le backend à chaque partie.

### Ajouter des questions

Les questions sont dans `apps/api/src/data/`. Chaque fichier JSON correspond à un type. Pour ajouter des questions, modifie le fichier JSON correspondant en suivant le schéma existant.

Exemple pour une question texte :

```json
{
  "id": "txt_200",
  "type": "text",
  "difficulty": "medium",
  "category": "cinéma",
  "label": "Ta question ici ?",
  "answer": "Réponse exacte",
  "acceptedAnswers": ["Réponse exacte", "variante", "autre variante"],
  "media": null,
  "explanation": "Explication affichée après la réponse.",
  "tags": ["cinéma"],
  "baseTimer": 25
}
```

Pour les images, utilise des URLs directes depuis des banques d'images gratuites (Unsplash, Pexels, Pixabay).

---

## Math Max — Support des parenthèses

Les questions Math Max supportent 3 types de tuiles :

- `number` — Un chiffre (0-9)
- `operator` — Un opérateur (+, -, ×, ÷)
- `parenthesis` — Une parenthèse ouvrante `(` ou fermante `)`

L'évaluation respecte les priorités mathématiques standard (multiplication avant addition) et gère les parenthèses correctement.

Exemple :

```json
{
  "tiles": [
    { "id": "t1", "value": "3", "tileType": "number" },
    { "id": "t2", "value": "5", "tileType": "number" },
    { "id": "t3", "value": "2", "tileType": "number" },
    { "id": "t4", "value": "+", "tileType": "operator" },
    { "id": "t5", "value": "×", "tileType": "operator" },
    { "id": "t6", "value": "(", "tileType": "parenthesis" },
    { "id": "t7", "value": ")", "tileType": "parenthesis" }
  ]
}
```

Avec ces tuiles, `(3 + 2) × 5 = 25` donne un meilleur résultat que `3 + 2 × 5 = 13`.

---

## Parcours utilisateur

```
Accueil
  ├── Jouer en solo
  │     └── Configuration (thèmes, nombre de questions)
  │           └── Partie en cours
  │                 └── Résultats
  │                       └── Rejouer les erreurs (optionnel)
  │
  └── Multijoueur
        └── Lobby (créer/rejoindre une room)
              └── Partie en cours (synchronisée)
                    └── Résultats multi (classement)
```

---

## Contribution

1. Fork le repo
2. Crée une branche feature (`git checkout -b feat/ma-feature`)
3. Commite avec [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.)
4. Push et ouvre une Pull Request

Le projet utilise Husky + Commitlint pour valider les messages de commit.

---

## Licence

Projet privé. Tous droits réservés.
