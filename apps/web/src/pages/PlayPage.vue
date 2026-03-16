<script setup lang="ts">
  import { watch, onUnmounted } from 'vue';
  import { useRouter, onBeforeRouteLeave } from 'vue-router';
  import { useGameStore, useTimerStore } from '@/stores';
  import QuizCard from '@/components/game/QuizCard.vue';
  import TimerBar from '@/components/game/TimerBar.vue';
  import QuestionProgress from '@/components/game/QuestionProgress.vue';
  import AnswerInput from '@/components/game/AnswerInput.vue';
  import AnswerFeedback from '@/components/game/AnswerFeedback.vue';

  const router = useRouter();
  const game = useGameStore();
  const timerStore = useTimerStore();

  if (!game.session || !game.isPlaying) {
    router.replace('/setup');
  }

  watch(
    () => game.phase,
    (phase) => {
      if (phase === 'results') {
        router.push('/results');
      }
    },
  );

  function handleAnswer(answer: string) {
    game.submitAnswer(answer);
  }

  onBeforeRouteLeave(() => {
    if (game.isPlaying) {
      timerStore.stop();
    }
  });

  onUnmounted(() => {
    timerStore.stop();
  });
</script>

<template>
  <div v-if="game.currentQuestion" class="play-page">
    <div class="play-page__top">
      <QuestionProgress v-bind="game.progress" />
      <div class="play-page__score">
        <strong>{{ game.score }}</strong> pts
      </div>
    </div>

    <TimerBar :remaining="game.timerRemaining" :total="game.timerTotal" />

    <div class="play-page__card">
      <Transition name="card-swap" mode="out-in">
        <QuizCard
          :key="game.currentQuestion.id"
          :question="game.currentQuestion"
          :timer-total="game.timerTotal"
          :timer-remaining="game.timerRemaining"
        />
      </Transition>
    </div>

    <div v-if="game.showFeedback && game.lastAnswerResult" class="play-page__feedback">
      <AnswerFeedback :result="game.lastAnswerResult" />
    </div>

    <div v-else-if="game.isSubmitting" class="play-page__submitting">
      <div class="submitting-indicator">Vérification…</div>
    </div>

    <div v-else class="play-page__input">
      <AnswerInput
        :question="game.currentQuestion"
        :disabled="game.showFeedback || game.isSubmitting"
        @submit="handleAnswer"
      />
    </div>
  </div>
</template>

<style scoped>
  .play-page {
    flex: 1;
    max-width: var(--max-content);
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md) 0;
    justify-content: center;
    min-height: 0;
  }

  .play-page__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    flex-shrink: 0;
  }

  .play-page__score {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    white-space: nowrap;
    background: var(--bg-secondary);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    padding: 0.35rem 0.8rem;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .play-page__score strong {
    color: var(--accent);
    font-weight: 700;
  }

  .play-page__card {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .play-page__feedback,
  .play-page__input,
  .play-page__submitting {
    min-height: 80px;
    flex-shrink: 0;
  }

  .submitting-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: var(--space-md);
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-weight: 600;
  }

  .submitting-indicator::before {
    content: '';
    width: 16px;
    height: 16px;
    border: 2px solid var(--border-strong);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .card-swap-enter-active {
    animation: card-in 0.3s var(--ease-out-expo);
  }
  .card-swap-leave-active {
    animation: card-out 0.2s ease;
  }

  @keyframes card-in {
    from {
      opacity: 0;
      transform: translateX(20px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }
  @keyframes card-out {
    from {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateX(-20px) scale(0.98);
    }
  }
</style>
