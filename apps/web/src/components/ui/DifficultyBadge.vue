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
    :class="[`badge--${difficulty}`, { 'badge--interactive': interactive, 'badge--active': active }]"
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
    padding: 0.3rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-radius: 6px;
    border: 2px solid transparent;
    transition: all 0.2s;
  }

  .badge--easy {
    color: var(--success);
    background: color-mix(in srgb, var(--success) 12%, transparent);
    border-color: color-mix(in srgb, var(--success) 25%, transparent);
  }

  .badge--medium {
    color: var(--warning);
    background: color-mix(in srgb, var(--warning) 12%, transparent);
    border-color: color-mix(in srgb, var(--warning) 25%, transparent);
  }

  .badge--hard {
    color: var(--error);
    background: color-mix(in srgb, var(--error) 12%, transparent);
    border-color: color-mix(in srgb, var(--error) 25%, transparent);
  }

  .badge--interactive {
    cursor: pointer;
    opacity: 0.5;
  }

  .badge--interactive:hover {
    opacity: 0.8;
  }

  .badge--interactive.badge--active {
    opacity: 1;
    transform: scale(1.05);
  }
</style>
