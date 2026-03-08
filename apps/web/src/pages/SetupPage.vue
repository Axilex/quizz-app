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
        <BaseButton variant="ghost" size="sm" @click="router.push('/')"> ← Retour </BaseButton>
        <h1 class="setup-page__title">Configuration</h1>
        <p class="setup-page__desc">Personnalisez votre partie avant de commencer</p>
      </div>

      <!-- Loading overlay -->
      <div v-if="isStarting" class="setup-page__loading">
        <div class="loader" />
        <p>Préparation des questions…</p>
      </div>

      <!-- Error message -->
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

  .setup-page__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  .loader {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border);
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
    gap: 0.5rem;
    padding: 1rem;
    background: color-mix(in srgb, var(--error) 10%, var(--bg-secondary));
    border: 1px solid var(--error);
    border-radius: 10px;
    color: var(--error);
    font-size: 0.9rem;
    text-align: center;
  }
</style>
