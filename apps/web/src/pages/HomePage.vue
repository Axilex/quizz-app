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
    <!-- Ambient glow -->
    <div class="home__glow" />

    <div class="home__hero">
      <div class="home__badge">
        <span class="home__badge-dot" />
        Quiz &amp; Culture
      </div>

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
        <div
          class="feature-pill"
          v-for="feat in [
            { icon: '⚡', label: 'Timer adaptatif' },
            { icon: '🎯', label: '270+ questions' },
            { icon: '✂️', label: 'Images coupées' },
            { icon: '🧮', label: 'Calcul mental' },
            { icon: '🗺️', label: 'Géographie' },
            { icon: '🔄', label: 'Rejeu erreurs' },
          ]"
          :key="feat.label"
        >
          <span class="feature-pill__icon">{{ feat.icon }}</span>
          <span>{{ feat.label }}</span>
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
    padding: var(--space-xl) 0;
    min-height: calc(100dvh - var(--header-height));
    position: relative;
    overflow: hidden;
  }

  .home__glow {
    position: absolute;
    width: min(500px, 90vw);
    height: min(500px, 90vw);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(232, 178, 80, 0.06) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: glow-breathe 6s ease-in-out infinite;
  }

  @keyframes glow-breathe {
    0%,
    100% {
      opacity: 0.5;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.15);
    }
  }

  .home__hero {
    max-width: min(420px, 100%);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xl);
    position: relative;
    z-index: 1;
  }

  /* Badge */
  .home__badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid rgba(232, 178, 80, 0.18);
    padding: 0.4rem 1rem;
    border-radius: var(--radius-full);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .home__badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    animation: dot-pulse 2s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%,
    100% {
      opacity: 0.4;
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
    font-size: var(--text-hero);
    font-weight: 400;
    color: var(--text-primary);
    margin: 0;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .home__title-q {
    color: var(--accent);
    font-style: italic;
    font-weight: 700;
    filter: drop-shadow(0 0 24px var(--accent-glow));
  }

  .home__title-rest {
    font-weight: 300;
    letter-spacing: 0.05em;
  }

  .home__subtitle {
    margin: var(--space-sm) 0 0;
    font-size: var(--text-base);
    color: var(--text-secondary);
    font-weight: 400;
    letter-spacing: 0.02em;
  }

  /* Actions */
  .home__actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .btn-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
  }

  .btn-icon {
    font-size: 0.95em;
    opacity: 0.85;
  }

  /* Feature pills */
  .home__features {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
    justify-content: center;
    max-width: 400px;
  }

  .feature-pill {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-weight: 500;
    transition:
      border-color 0.2s,
      color 0.2s;
  }

  .feature-pill:hover {
    border-color: var(--border-strong);
    color: var(--text-secondary);
  }

  .feature-pill__icon {
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    .home {
      padding: var(--space-lg) 0;
    }
    .home__hero {
      gap: var(--space-lg);
    }
    .home__features {
      gap: 0.35rem;
    }
    .feature-pill {
      padding: 0.35rem 0.6rem;
    }
  }
</style>
