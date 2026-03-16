import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/setup',
    name: 'setup',
    component: () => import('@/pages/SetupPage.vue'),
  },
  {
    path: '/lobby',
    name: 'lobby',
    component: () => import('@/pages/LobbyPage.vue'),
  },
  {
    // Direct join via shareable URL — code is pre-filled, player only enters pseudo
    path: '/join/:code',
    name: 'join',
    component: () => import('@/pages/LobbyPage.vue'),
    props: true,
  },
  {
    path: '/play',
    name: 'play',
    component: () => import('@/pages/PlayPage.vue'),
    meta: { requiresGame: true },
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('@/pages/ResultsPage.vue'),
    meta: { requiresGame: true },
  },
  {
    path: '/review',
    name: 'review',
    component: () => import('@/pages/ReviewPage.vue'),
    meta: { requiresGame: true },
  },
  {
    path: '/play-multi',
    name: 'play-multi',
    component: () => import('@/pages/PlayMultiPage.vue'),
    meta: { requiresLobby: true },
  },
  {
    path: '/results-multi',
    name: 'results-multi',
    component: () => import('@/pages/ResultsMultiPage.vue'),
    meta: { requiresLobby: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * Navigation guards — redirect to appropriate fallback
 * if the user accesses a protected page without the required state.
 * Stores are imported lazily inside the guard to avoid Pinia initialization issues.
 */
router.beforeEach(async (to) => {
  if (to.meta.requiresGame) {
    const { useGameStore } = await import('@/stores');
    const game = useGameStore();
    if (!game.session) {
      return { name: 'setup' };
    }
  }

  if (to.meta.requiresLobby) {
    const { useLobbyStore } = await import('@/stores');
    const lobby = useLobbyStore();
    if (!lobby.room && !lobby.finalScores) {
      return { name: 'lobby' };
    }
  }
});
