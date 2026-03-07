<script setup lang="ts">
  import { watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { useGameStore } from '@/stores';
  import QuizCard from '@/components/game/QuizCard.vue';
  import TimerBar from '@/components/game/TimerBar.vue';
  import QuestionProgress from '@/components/game/QuestionProgress.vue';
  import AnswerInput from '@/components/game/AnswerInput.vue';
  import AnswerFeedback from '@/components/game/AnswerFeedback.vue';

  const router = useRouter();
  const game = useGameStore();

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
</script>

<template>
  <div v-if="game.currentQuestion" class="play-page">
    <div class="play-page__top">
      <QuestionProgress v-bind="game.progress" />
      <div class="play-page__score">
        Score : <strong>{{ game.score }}</strong>
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

    <div v-else class="play-page__input">
      <AnswerInput
        :question="game.currentQuestion"
        :disabled="game.showFeedback"
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
    gap: 1.25rem;
    padding: 1rem 0;
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
    font-size: 0.9rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }
  .play-page__score strong {
    color: var(--accent);
  }
  .play-page__card {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  .play-page__feedback,
  .play-page__input {
    min-height: 80px;
    flex-shrink: 0;
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
