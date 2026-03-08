<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { useSessionStore } from '@/stores';
  import BaseButton from '@/components/ui/BaseButton.vue';

  const router = useRouter();
  const session = useSessionStore();

  function startSolo() {
    session.setMode('solo');
    router.push('/setup');
  }

  function startMulti() {
    session.setMode('multi');
    router.push('/lobby');
  }
</script>

<template>
  <div class="home">
    <div class="home__hero">
      <div class="home__title-group">
        <h1 class="home__title"><span class="home__title-q">Q</span>uizzy</h1>
        <p class="home__subtitle">Le quiz entre amis qui pique le cerveau</p>
      </div>

      <div class="home__actions">
        <BaseButton size="lg" full-width @click="startSolo"> Jouer en solo </BaseButton>
        <BaseButton variant="secondary" size="lg" full-width @click="startMulti">
          Multijoueur
        </BaseButton>
      </div>

      <div class="home__features">
        <div class="feature-card">
          <span class="feature-card__icon">⚡</span>
          <span class="feature-card__label">Timer adaptatif</span>
        </div>
        <div class="feature-card">
          <span class="feature-card__icon">🎯</span>
          <span class="feature-card__label">155+ questions</span>
        </div>
        <div class="feature-card">
          <span class="feature-card__icon">🔄</span>
          <span class="feature-card__label">Rejeu des erreurs</span>
        </div>
        <div class="feature-card">
          <span class="feature-card__icon">🧩</span>
          <span class="feature-card__label">11 types de questions</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .home {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 0;
  }

  .home__hero {
    max-width: 420px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
  }

  .home__title-group {
    text-align: center;
  }

  .home__title {
    font-family: var(--font-display);
    font-size: 4rem;
    font-weight: 200;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .home__title-q {
    font-weight: 900;
    color: var(--accent);
  }

  .home__subtitle {
    margin: 0.75rem 0 0;
    font-size: 1.05rem;
    color: var(--text-secondary);
    letter-spacing: 0.01em;
  }

  .home__actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .home__features {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .feature-card {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.9rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .feature-card__icon {
    font-size: 1rem;
  }

  .feature-card__label {
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .home__title {
      font-size: 3rem;
    }
  }
</style>
