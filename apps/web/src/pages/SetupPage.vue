<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useGameStore, useSessionStore } from '@/stores';
  import GameSettingsPanel from '@/components/lobby/GameSettingsPanel.vue';
  import BaseButton from '@/components/ui/BaseButton.vue';

  const router = useRouter();
  const gameStore = useGameStore();
  const session = useSessionStore();

  const isStarting = ref(false);
  const startError = ref<string | null>(null);

  async function handleStart() {
    isStarting.value = true;
    startError.value = null;

    const success = await gameStore.startGame(session.gameConfig);

    if (success) {
      router.push('/play');
    } else {
      startError.value = gameStore.loadingError ?? 'Impossible de charger les questions';
      isStarting.value = false;
    }
  }
</script>

<template>
  <div class="setup-page">
    <div class="setup-page__container">
      <div class="setup-page__header">
        <BaseButton variant="ghost" size="sm" @click="router.push('/')">← Retour</BaseButton>
        <h1 class="setup-page__title">Configuration</h1>
        <p class="setup-page__desc">Personnalisez votre partie avant de commencer</p>
      </div>

      <!-- Loading -->
      <div v-if="isStarting" class="setup-page__loading">
        <div class="loader" />
        <p>Préparation des questions…</p>
      </div>

      <!-- Error -->
      <div v-if="startError" class="setup-page__error">
        <p>{{ startError }}</p>
        <BaseButton variant="ghost" size="sm" @click="startError = null">Réessayer</BaseButton>
      </div>

      <GameSettingsPanel v-if="!isStarting" @start="handleStart" />
    </div>
  </div>
</template>

<style scoped>
  .setup-page {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: var(--space-lg) 0;
  }

  .setup-page__container {
    max-width: var(--max-narrow);
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  .setup-page__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .setup-page__title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 800;
    color: var(--text-primary);
    margin: var(--space-xs) 0 0;
  }

  .setup-page__desc {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    margin: 0;
  }

  .setup-page__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-2xl) 0;
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }

  .loader {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border-strong);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .setup-page__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md);
    background: var(--error-soft);
    border: 1px solid rgba(239, 107, 107, 0.2);
    border-radius: var(--radius-md);
    color: var(--error);
    font-size: var(--text-sm);
    text-align: center;
  }
</style>
