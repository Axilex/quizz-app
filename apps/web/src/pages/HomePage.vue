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
      <div class="home__badge">✦ Quiz &amp; Culture</div>

      <div class="home__title-group">
        <h1 class="home__title">
          <em class="home__title-q">Q</em><span class="home__title-rest">uizzy</span>
        </h1>
        <p class="home__subtitle">Le quiz qui pique le cerveau</p>
      </div>

      <div class="home__actions">
        <BaseButton size="lg" full-width @click="startSolo">
          <span class="btn-inner">
            <span class="btn-icon">▶</span>
            Jouer en solo
          </span>
        </BaseButton>
        <BaseButton variant="secondary" size="lg" full-width @click="startMulti">
          <span class="btn-inner">
            <span class="btn-icon">👥</span>
            Multijoueur
          </span>
        </BaseButton>
      </div>

      <div class="home__features">
        <div class="feature-pill">
          <span class="feature-pill__icon">⚡</span>
          <span>Timer adaptatif</span>
        </div>
        <div class="feature-pill">
          <span class="feature-pill__icon">🎯</span>
          <span>170+ questions</span>
        </div>
        <div class="feature-pill">
          <span class="feature-pill__icon">✂️</span>
          <span>Images coupées</span>
        </div>
        <div class="feature-pill">
          <span class="feature-pill__icon">🧮</span>
          <span>Calcul mental</span>
        </div>
        <div class="feature-pill">
          <span class="feature-pill__icon">🗺️</span>
          <span>Géographie</span>
        </div>
        <div class="feature-pill">
          <span class="feature-pill__icon">🔄</span>
          <span>Rejeu des erreurs</span>
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
    padding: 2.5rem 0;
    min-height: calc(100vh - 60px);
  }

  .home__hero {
    max-width: 400px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.25rem;
  }

  /* Badge */
  .home__badge {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, var(--bg-secondary));
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    padding: 0.3rem 0.85rem;
    border-radius: 100px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    animation: badge-pulse 3s ease-in-out infinite;
  }

  @keyframes badge-pulse {
    0%,
    100% {
      opacity: 0.7;
    }
    50% {
      opacity: 1;
    }
  }

  /* Title */
  .home__title-group {
    text-align: center;
  }

  .home__title {
    font-family: var(--font-display);
    font-size: 5rem;
    font-weight: 400;
    color: var(--text-primary);
    margin: 0;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .home__title-q {
    color: var(--accent);
    font-style: italic;
    font-weight: 400;
    filter: drop-shadow(0 0 20px var(--accent-glow));
  }

  .home__title-rest {
    font-weight: 200;
    letter-spacing: 0.04em;
  }

  .home__subtitle {
    margin: 0.6rem 0 0;
    font-size: 1rem;
    color: var(--text-secondary);
    font-weight: 400;
    letter-spacing: 0.01em;
  }

  /* Actions */
  .home__actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .btn-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
  }

  .btn-icon {
    font-size: 0.9em;
    opacity: 0.8;
  }

  /* Feature pills */
  .home__features {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 380px;
  }

  .feature-pill {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.38rem 0.7rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: 100px;
    font-size: 0.78rem;
    color: var(--text-muted);
    font-weight: 500;
    transition:
      border-color 0.2s,
      color 0.2s;
  }

  .feature-pill:hover {
    border-color: var(--border);
    color: var(--text-secondary);
  }

  .feature-pill__icon {
    font-size: 0.85rem;
  }

  @media (max-width: 640px) {
    .home__title {
      font-size: 3.8rem;
    }
    .home {
      padding: 1.5rem 0;
      min-height: auto;
    }
  }
</style>
