<script setup lang="ts">
  import type { Player } from '@/types';

  interface Props {
    players: Player[];
  }

  defineProps<Props>();
</script>

<template>
  <div class="players-list">
    <div v-for="player in players" :key="player.id" class="player-item">
      <div class="player-item__avatar" :class="{ 'player-item__avatar--host': player.isHost }">
        {{ player.name.charAt(0).toUpperCase() }}
      </div>
      <div class="player-item__info">
        <span class="player-item__name">{{ player.name }}</span>
        <span v-if="player.isHost" class="player-item__badge">Hôte</span>
      </div>
      <span class="player-item__status" :class="`player-item__status--${player.status}`" />
    </div>
  </div>
</template>

<style scoped>
  .players-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .player-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 10px;
  }

  .player-item__avatar {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
  }

  .player-item__avatar--host {
    background: var(--accent);
    color: var(--bg-primary);
  }

  .player-item__info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .player-item__name {
    font-weight: 600;
    color: var(--text-primary);
  }

  .player-item__badge {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }

  .player-item__status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .player-item__status--connected {
    background: var(--success);
  }

  .player-item__status--disconnected {
    background: var(--error);
  }

  .player-item__status--answering {
    background: var(--warning);
    animation: blink 1s infinite;
  }

  .player-item__status--waiting,
  .player-item__status--finished {
    background: var(--text-muted);
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
</style>
