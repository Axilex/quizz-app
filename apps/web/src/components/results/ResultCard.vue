<script setup lang="ts">
  import type { AnswerResult } from '@/types';

  interface Props {
    result: AnswerResult;
    index: number;
  }

  defineProps<Props>();
</script>

<template>
  <div
    class="result-card"
    :class="result.isCorrect ? 'result-card--correct' : 'result-card--wrong'"
  >
    <div class="result-card__number">{{ index + 1 }}</div>
    <div class="result-card__content">
      <p class="result-card__question">{{ result.question.label }}</p>
      <div class="result-card__answers">
        <span v-if="!result.isCorrect && result.userAnswer" class="result-card__user">
          {{ result.timedOut ? 'Temps écoulé' : result.userAnswer }}
        </span>
        <span class="result-card__correct">{{ result.question.answer }}</span>
      </div>
    </div>
    <div class="result-card__icon">{{ result.isCorrect ? '✓' : '✗' }}</div>
  </div>
</template>

<style scoped>
  .result-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    transition: transform 0.2s;
  }

  .result-card:hover {
    transform: translateX(4px);
  }

  .result-card__number {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--text-muted);
    min-width: 2ch;
  }

  .result-card__content {
    flex: 1;
    min-width: 0;
  }

  .result-card__question {
    font-size: 0.92rem;
    color: var(--text-primary);
    margin: 0 0 0.3rem;
    font-weight: 500;
  }

  .result-card__answers {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
  }

  .result-card__user {
    color: var(--error);
    text-decoration: line-through;
    opacity: 0.7;
  }

  .result-card__correct {
    color: var(--success);
    font-weight: 600;
  }

  .result-card--correct .result-card__correct {
    color: var(--success);
  }

  .result-card__icon {
    font-weight: 900;
    font-size: 1.1rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .result-card--correct .result-card__icon {
    color: var(--success);
    background: color-mix(in srgb, var(--success) 15%, transparent);
  }

  .result-card--wrong .result-card__icon {
    color: var(--error);
    background: color-mix(in srgb, var(--error) 15%, transparent);
  }
</style>
