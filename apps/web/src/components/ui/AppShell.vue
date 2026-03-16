<script setup lang="ts"></script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <router-link to="/" class="logo-link">
        <span class="logo-q">Q</span>
        <span class="logo-text">uizzy</span>
      </router-link>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
  }

  .app-header {
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    z-index: 10;
  }

  .logo-link {
    text-decoration: none;
    display: flex;
    align-items: baseline;
    gap: 0;
    font-family: var(--font-display);
    transition: opacity 0.2s;
  }

  .logo-link:hover {
    opacity: 0.8;
  }

  .logo-q {
    font-size: 2.2rem;
    font-weight: 900;
    color: var(--accent);
    line-height: 1;
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 300;
    color: var(--text-primary);
    letter-spacing: 0.04em;
  }

  .app-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 2rem 2rem;
  }

  /* Page transitions */
  .page-enter-active,
  .page-leave-active {
    transition: all 0.25s ease;
  }

  .page-enter-from {
    opacity: 0;
    transform: translateY(12px);
  }

  .page-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }

  @media (max-width: 640px) {
    .app-header {
      padding: 0.75rem 1rem;
    }

    .app-main {
      padding: 0 1rem 1rem;
    }
  }
</style>
