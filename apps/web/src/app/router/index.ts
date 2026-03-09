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
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('@/pages/ResultsPage.vue'),
  },
  {
    path: '/review',
    name: 'review',
    component: () => import('@/pages/ReviewPage.vue'),
  },
  {
    path: '/play-multi',
    name: 'play-multi',
    component: () => import('@/pages/PlayMultiPage.vue'),
  },
  {
    path: '/results-multi',
    name: 'results-multi',
    component: () => import('@/pages/ResultsMultiPage.vue'),
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
