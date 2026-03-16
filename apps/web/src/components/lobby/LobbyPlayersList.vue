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
    gap: var(--space-sm);
  }

  .player-item {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-md);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    min-height: 56px;
  }

  .player-item__avatar {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: var(--text-base);
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .player-item__avatar--host {
    background: linear-gradient(135deg, var(--accent), #d4a03a);
    color: var(--bg-base);
  }

  .player-item__info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
  }

  .player-item__name {
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .player-item__badge {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent);
    background: var(--accent-soft);
    padding: 0.15rem 0.55rem;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .player-item__status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
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
