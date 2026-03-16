<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    remaining: number;
    total: number;
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
    gap: var(--space-sm);
    width: 100%;
  }

  .timer__bar-track {
    flex: 1;
    height: 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }

  .timer__bar-track::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 3px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .timer__bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.15s linear;
    will-change: width;
    position: relative;
  }

  .timer--normal .timer__bar-fill {
    background: linear-gradient(90deg, var(--accent), rgba(86, 214, 123, 0.8));
    box-shadow: 0 0 12px rgba(232, 178, 80, 0.2);
  }

  .timer--warning .timer__bar-fill {
    background: linear-gradient(90deg, var(--accent), #d4942c);
    box-shadow: 0 0 12px rgba(232, 178, 80, 0.25);
  }

  .timer--critical .timer__bar-fill {
    background: var(--error);
    box-shadow: 0 0 12px rgba(239, 107, 107, 0.3);
    animation: pulse-bar 0.6s ease-in-out infinite;
  }

  .timer__label {
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 700;
    min-width: 3.5ch;
    text-align: right;
    color: var(--text-primary);
    transition: color 0.3s;
  }

  .timer--warning .timer__label {
    color: var(--accent);
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
      opacity: 0.5;
    }
  }
  @keyframes pulse-text {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.55;
    }
  }
</style>
