<script setup lang="ts">
  import type { Difficulty } from '@/types';

  interface Props {
    difficulty: Difficulty;
    interactive?: boolean;
    active?: boolean;
  }

  withDefaults(defineProps<Props>(), {
    interactive: false,
    active: false,
  });

  const labels: Record<Difficulty, string> = {
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
  };
</script>

<template>
  <span
    class="badge"
    :class="[
      `badge--${difficulty}`,
      { 'badge--interactive': interactive, 'badge--active': active },
    ]"
    role="button"
    :tabindex="interactive ? 0 : undefined"
  >
    {{ labels[difficulty] }}
  </span>
</template>

<style scoped>
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.28rem 0.7rem;
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-radius: var(--radius-sm);
    border: 1.5px solid transparent;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .badge--easy {
    color: var(--success);
    background: var(--success-soft);
    border-color: rgba(86, 214, 123, 0.18);
  }

  .badge--medium {
    color: var(--warning);
    background: rgba(232, 178, 80, 0.1);
    border-color: rgba(232, 178, 80, 0.18);
  }

  .badge--hard {
    color: var(--error);
    background: var(--error-soft);
    border-color: rgba(239, 107, 107, 0.18);
  }

  .badge--interactive {
    cursor: pointer;
    opacity: 0.45;
  }

  .badge--interactive:hover {
    opacity: 0.75;
  }

  .badge--interactive.badge--active {
    opacity: 1;
    transform: scale(1.05);
  }
</style>
