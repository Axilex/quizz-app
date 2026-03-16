<script setup lang="ts">
  import type { AnswerResult } from '@/types';

  interface Props {
    result: AnswerResult;
  }

  defineProps<Props>();
</script>

<template>
  <Transition name="feedback">
    <div class="feedback" :class="result.isCorrect ? 'feedback--correct' : 'feedback--wrong'">
      <div class="feedback__icon">
        {{ result.isCorrect ? '✓' : '✗' }}
      </div>
      <div class="feedback__text">
        <p class="feedback__status">
          {{
            result.timedOut
              ? 'Temps écoulé !'
              : result.isCorrect
                ? 'Bonne réponse !'
                : 'Mauvaise réponse'
          }}
          <span v-if="result.isCorrect && result.points > 0" class="feedback__points">
            +{{ result.points }} pt{{ result.points > 1 ? 's' : '' }}
          </span>
        </p>
        <p v-if="!result.isCorrect && result.correctAnswer" class="feedback__answer">
          Réponse : <strong>{{ result.correctAnswer }}</strong>
        </p>
        <p v-if="result.explanation" class="feedback__explanation">
          {{ result.explanation }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
  .feedback {
    display: flex;
    align-items: flex-start;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    border-radius: var(--radius-lg);
    animation: slide-up 0.3s var(--ease-out-expo);
  }

  .feedback--correct {
    background: var(--success-soft);
    border: 1px solid rgba(86, 214, 123, 0.2);
  }

  .feedback--wrong {
    background: var(--error-soft);
    border: 1px solid rgba(239, 107, 107, 0.2);
  }

  .feedback__icon {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    font-weight: 900;
    flex-shrink: 0;
  }

  .feedback--correct .feedback__icon {
    background: var(--success);
    color: white;
    box-shadow: 0 4px 16px rgba(86, 214, 123, 0.25);
  }

  .feedback--wrong .feedback__icon {
    background: var(--error);
    color: white;
    box-shadow: 0 4px 16px rgba(239, 107, 107, 0.25);
  }

  .feedback__text {
    flex: 1;
    min-width: 0;
  }

  .feedback__status {
    font-weight: 700;
    font-size: var(--text-base);
    margin: 0 0 0.15rem;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .feedback__points {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--accent);
    background: var(--accent-soft);
    padding: 0.15rem 0.5rem;
    border-radius: 5px;
  }

  .feedback__answer {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin: 0 0 0.15rem;
  }

  .feedback__answer strong {
    color: var(--accent);
  }

  .feedback__explanation {
    font-size: var(--text-sm);
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
    font-style: italic;
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .feedback-enter-active {
    animation: slide-up 0.3s var(--ease-out-expo);
  }
  .feedback-leave-active {
    animation: slide-up 0.2s ease reverse;
  }
</style>
