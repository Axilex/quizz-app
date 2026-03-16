<script setup lang="ts"></script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header__inner">
        <router-link to="/" class="logo-link">
          <span class="logo-q">Q</span>
          <span class="logo-text">uizzy</span>
        </router-link>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
  .app-shell {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(12, 13, 16, 0.8);
    backdrop-filter: blur(20px) saturate(1.4);
    -webkit-backdrop-filter: blur(20px) saturate(1.4);
    border-bottom: 1px solid var(--border);
    padding-top: var(--safe-top);
  }

  .app-header__inner {
    height: var(--header-height);
    display: flex;
    align-items: center;
    padding: 0 var(--space-lg);
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .logo-link {
    text-decoration: none;
    display: flex;
    align-items: baseline;
    font-family: var(--font-display);
    transition: opacity 0.2s;
    user-select: none;
  }

  .logo-link:hover {
    opacity: 0.8;
  }

  .logo-q {
    font-size: clamp(1.6rem, 1.4rem + 0.8vw, 2.2rem);
    font-weight: 900;
    font-style: italic;
    color: var(--accent);
    line-height: 1;
    filter: drop-shadow(0 0 12px var(--accent-glow));
  }

  .logo-text {
    font-size: clamp(1.1rem, 0.9rem + 0.6vw, 1.5rem);
    font-weight: 300;
    color: var(--text-primary);
    letter-spacing: 0.06em;
  }

  .app-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 var(--space-lg);
    padding-bottom: max(var(--space-lg), var(--safe-bottom));
    padding-left: max(var(--space-lg), var(--safe-left));
    padding-right: max(var(--space-lg), var(--safe-right));
  }
</style>
