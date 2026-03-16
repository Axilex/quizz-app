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

  // Clean up timer when leaving the page (e.g. clicking logo)
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
      <div class="submitting-indicator">Vérification...</div>
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
    max-width: 640px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    padding: 1.25rem 0;
    justify-content: center;
    min-height: 0;
  }
  .play-page__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-shrink: 0;
  }
  .play-page__score {
    font-family: var(--font-mono);
    font-size: 0.88rem;
    color: var(--text-secondary);
    white-space: nowrap;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.3rem 0.7rem;
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
    padding: 1rem;
    font-size: 0.9rem;
    color: var(--text-muted);
    font-weight: 600;
  }
  .submitting-indicator::before {
    content: '';
    width: 16px;
    height: 16px;
    border: 2px solid var(--border);
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
    animation: card-in 0.3s ease;
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
