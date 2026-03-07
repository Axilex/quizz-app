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
        </p>
        <p v-if="!result.isCorrect" class="feedback__answer">
          Réponse : <strong>{{ result.question.answer }}</strong>
        </p>
        <p v-if="result.question.explanation" class="feedback__explanation">
          {{ result.question.explanation }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
  .feedback {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    border-radius: 14px;
    animation: slide-up 0.3s ease;
  }

  .feedback--correct {
    background: color-mix(in srgb, var(--success) 12%, var(--bg-secondary));
    border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
  }

  .feedback--wrong {
    background: color-mix(in srgb, var(--error) 12%, var(--bg-secondary));
    border: 1px solid color-mix(in srgb, var(--error) 30%, transparent);
  }

  .feedback__icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    font-weight: 900;
    flex-shrink: 0;
  }

  .feedback--correct .feedback__icon {
    background: var(--success);
    color: white;
  }

  .feedback--wrong .feedback__icon {
    background: var(--error);
    color: white;
  }

  .feedback__text {
    flex: 1;
    min-width: 0;
  }

  .feedback__status {
    font-weight: 700;
    font-size: 1rem;
    margin: 0 0 0.25rem;
    color: var(--text-primary);
  }

  .feedback__answer {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin: 0 0 0.25rem;
  }

  .feedback__answer strong {
    color: var(--accent);
  }

  .feedback__explanation {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .feedback-enter-active {
    animation: slide-up 0.3s ease;
  }
  .feedback-leave-active {
    animation: slide-up 0.2s ease reverse;
  }
</style>
