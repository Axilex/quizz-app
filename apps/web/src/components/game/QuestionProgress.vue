<script setup lang="ts">
  interface Props {
    current: number;
    total: number;
    percentage: number;
  }

  defineProps<Props>();
</script>

<template>
  <div class="progress">
    <span class="progress__count">
      <span class="progress__current">{{ current }}</span>
      <span class="progress__sep">/</span>
      <span class="progress__total">{{ total }}</span>
    </span>
    <div class="progress__track">
      <div class="progress__fill" :style="{ width: `${percentage}%` }" />
    </div>
  </div>
</template>

<style scoped>
  .progress {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .progress__count {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .progress__current {
    color: var(--accent);
    font-weight: 700;
  }

  .progress__sep {
    margin: 0 0.15em;
    opacity: 0.5;
  }

  .progress__track {
    flex: 1;
    height: 4px;
    background: var(--bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress__fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 0.4s ease;
  }
</style>
