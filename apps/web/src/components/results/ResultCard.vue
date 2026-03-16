<script setup lang="ts">
  import type { AnswerResult } from '@/types';
  import DifficultyBadge from '@/components/ui/DifficultyBadge.vue';

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
      <div class="result-card__top">
        <p class="result-card__question">{{ result.question.label }}</p>
        <DifficultyBadge :difficulty="result.question.difficulty" />
      </div>
      <div class="result-card__answers">
        <span v-if="!result.isCorrect && result.userAnswer" class="result-card__user">
          {{ result.timedOut ? 'Temps écoulé' : result.userAnswer }}
        </span>
        <span class="result-card__correct">{{ result.correctAnswer }}</span>
      </div>
    </div>
    <div class="result-card__right">
      <div class="result-card__icon">{{ result.isCorrect ? '✓' : '✗' }}</div>
      <span v-if="result.isCorrect" class="result-card__pts"
        >+{{ result.points }}pt{{ result.points > 1 ? 's' : '' }}</span
      >
    </div>
  </div>
</template>

<style scoped>
  .result-card {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    transition:
      transform 0.2s var(--ease-out-expo),
      box-shadow 0.2s;
  }

  .result-card:hover {
    transform: translateX(4px);
    box-shadow: var(--shadow-sm);
  }

  .result-card__number {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    min-width: 2ch;
  }

  .result-card__content {
    flex: 1;
    min-width: 0;
  }

  .result-card__top {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    margin-bottom: 0.25rem;
  }

  .result-card__question {
    font-size: var(--text-sm);
    color: var(--text-primary);
    margin: 0;
    font-weight: 500;
    flex: 1;
    line-height: 1.4;
  }

  .result-card__answers {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--text-sm);
  }

  .result-card__user {
    color: var(--error);
    text-decoration: line-through;
    opacity: 0.65;
  }

  .result-card__correct {
    color: var(--success);
    font-weight: 600;
  }

  .result-card__right {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    flex-shrink: 0;
  }

  .result-card__icon {
    font-weight: 900;
    font-size: 1.1rem;
    width: 2.2rem;
    height: 2.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .result-card--correct .result-card__icon {
    color: var(--success);
    background: var(--success-soft);
  }

  .result-card--wrong .result-card__icon {
    color: var(--error);
    background: var(--error-soft);
  }

  .result-card__pts {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--accent);
  }

  @media (hover: none) {
    .result-card:hover {
      transform: none;
    }
  }
</style>
