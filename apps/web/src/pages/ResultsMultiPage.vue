<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useLobbyStore } from '@/stores';
  import BaseButton from '@/components/ui/BaseButton.vue';

  const router = useRouter();
  const lobby = useLobbyStore();

  const rankings = computed(() => {
    if (!lobby.finalScores) return [];
    return Object.entries(lobby.finalScores)
      .map(([id, data]) => ({
        id,
        name: (data as { name: string; score: number }).name,
        score: (data as { name: string; score: number }).score,
        isMe: id === lobby.playerId,
      }))
      .sort((a, b) => b.score - a.score);
  });

  function handleBackToLobby() {
    lobby.resetMultiGame();
    router.push('/lobby');
  }

  function handleHome() {
    lobby.leaveRoom();
    router.push('/');
  }
</script>

<template>
  <div class="results-multi">
    <div class="results-multi__container">
      <h1 class="results-multi__title">Résultats</h1>

      <div class="podium">
        <div
          v-for="(player, i) in rankings"
          :key="player.id"
          class="podium__item"
          :class="{ 'podium__item--winner': i === 0, 'podium__item--me': player.isMe }"
        >
          <span class="podium__rank">{{
            i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
          }}</span>
          <span class="podium__name">{{ player.name }}</span>
          <span class="podium__score">{{ player.score }}</span>
        </div>
      </div>

      <div class="results-multi__actions">
        <BaseButton size="lg" full-width @click="handleBackToLobby"> Rejouer </BaseButton>
        <BaseButton variant="ghost" size="sm" @click="handleHome"> Accueil </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .results-multi {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem 0;
  }
  .results-multi__container {
    max-width: 440px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    text-align: center;
  }
  .results-multi__title {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text-primary);
  }
  .podium {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .podium__item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1.2rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    border-radius: 12px;
    transition: all 0.2s;
  }
  .podium__item--winner {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--bg-secondary));
  }
  .podium__item--me {
    border-color: var(--accent);
  }
  .podium__rank {
    font-size: 1.3rem;
    min-width: 2rem;
    text-align: center;
  }
  .podium__name {
    flex: 1;
    text-align: left;
    font-weight: 600;
    color: var(--text-primary);
  }
  .podium__score {
    font-family: var(--font-mono);
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--accent);
  }
  .results-multi__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
</style>
