<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    remaining: number; // seconds
    total: number; // seconds
  }

  const props = defineProps<Props>();

  const percentage = computed(() => {
    if (props.total <= 0) return 100;
    return Math.max(0, (props.remaining / props.total) * 100);
  });

  const urgency = computed(() => {
    if (percentage.value > 50) return 'normal';
    if (percentage.value > 25) return 'warning';
    return 'critical';
  });
</script>

<template>
  <div class="timer" :class="`timer--${urgency}`">
    <div class="timer__bar-track">
      <div class="timer__bar-fill" :style="{ width: `${percentage}%` }" />
    </div>
    <span class="timer__label">{{ remaining }}s</span>
  </div>
</template>

<style scoped>
  .timer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .timer__bar-track {
    flex: 1;
    height: 7px;
    background: var(--bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.03);
  }

  .timer__bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.15s linear;
    will-change: width;
  }

  .timer--normal .timer__bar-fill {
    background: linear-gradient(
      90deg,
      var(--accent),
      color-mix(in srgb, var(--accent) 80%, #6ec87a)
    );
  }

  .timer--warning .timer__bar-fill {
    background: linear-gradient(90deg, var(--warning), #d4942c);
  }

  .timer--critical .timer__bar-fill {
    background: var(--error);
    animation: pulse-bar 0.6s ease-in-out infinite;
  }

  .timer__label {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 700;
    min-width: 3.2ch;
    text-align: right;
    color: var(--text-primary);
    transition: color 0.3s;
  }

  .timer--warning .timer__label {
    color: var(--warning);
  }

  .timer--critical .timer__label {
    color: var(--error);
    animation: pulse-text 0.6s ease-in-out infinite;
  }

  @keyframes pulse-bar {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.55;
    }
  }

  @keyframes pulse-text {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
</style>
