<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { useGameStore, useSessionStore } from '@/stores';
  import GameSettingsPanel from '@/components/lobby/GameSettingsPanel.vue';
  import BaseButton from '@/components/ui/BaseButton.vue';

  const router = useRouter();
  const gameStore = useGameStore();
  const session = useSessionStore();

  function handleStart() {
    gameStore.startGame(session.gameConfig);
    router.push('/play');
  }
</script>

<template>
  <div class="setup-page">
    <div class="setup-page__container">
      <div class="setup-page__header">
        <BaseButton variant="ghost" size="sm" @click="router.push('/')">
          ← Retour
        </BaseButton>
        <h1 class="setup-page__title">Configuration</h1>
        <p class="setup-page__desc">Personnalisez votre partie avant de commencer</p>
      </div>

      <GameSettingsPanel @start="handleStart" />
    </div>
  </div>
</template>

<style scoped>
  .setup-page {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 1rem 0;
  }

  .setup-page__container {
    max-width: 480px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .setup-page__header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .setup-page__title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0.5rem 0 0;
  }

  .setup-page__desc {
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin: 0;
  }
</style>
