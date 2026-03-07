<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { useLobbyStore } from '@/stores';
  import { timerService } from '@/services';
  import type { Question } from '@/types';
  import QuizCard from '@/components/game/QuizCard.vue';
  import TimerBar from '@/components/game/TimerBar.vue';
  import AnswerInput from '@/components/game/AnswerInput.vue';
  import AnswerFeedback from '@/components/game/AnswerFeedback.vue';

  const router = useRouter();
  const lobby = useLobbyStore();

  const timerRemaining = ref(0);
  const timerTotal = ref(0);
  const showFeedback = ref(false);
  const hasAnswered = ref(false);
  const startTime = ref(Date.now());

  const question = computed(() => lobby.currentQuestion as Question | null);

  const feedbackResult = computed(() => {
    if (!lobby.lastResult || !question.value) return null;
    return {
      questionId: question.value.id,
      question: question.value,
      userAnswer: '',
      isCorrect: lobby.lastResult.isCorrect,
      timeSpent: 0,
      timedOut: false,
    };
  });

  // When a new question arrives, start the timer
  watch(
    () => lobby.questionIndex,
    () => {
      if (!question.value) return;

      hasAnswered.value = false;
      showFeedback.value = false;
      startTime.value = Date.now();

      const duration = lobby.questionTimer || 30;
      timerTotal.value = duration;
      timerRemaining.value = duration;

      timerService.start(duration, {
        onTick: (remaining) => {
          timerRemaining.value = remaining;
        },
        onComplete: () => {
          if (!hasAnswered.value) {
            handleTimeout();
          }
        },
      });
    },
    { immediate: true },
  );

  // When we get a result from server
  watch(
    () => lobby.lastResult,
    (result) => {
      if (result) {
        timerService.stop();
        showFeedback.value = true;
      }
    },
  );

  // When game finishes
  watch(
    () => lobby.finalScores,
    (scores) => {
      if (scores) {
        timerService.stop();
        router.push('/results-multi');
      }
    },
  );

  function handleAnswer(answer: string) {
    if (hasAnswered.value || !question.value) return;
    hasAnswered.value = true;

    const timeSpent = Date.now() - startTime.value;
    lobby.submitAnswer(question.value.id, answer, timeSpent);
  }

  function handleTimeout() {
    if (hasAnswered.value || !question.value) return;
    hasAnswered.value = true;
    lobby.submitAnswer(question.value.id, '', 0);
  }
</script>

<template>
  <div v-if="question" class="play-multi">
    <div class="play-multi__top">
      <span class="play-multi__progress">
        Question <strong>{{ lobby.questionIndex + 1 }}</strong>
      </span>
      <span class="play-multi__players"> {{ lobby.playerCount }} joueurs </span>
    </div>

    <TimerBar :remaining="timerRemaining" :total="timerTotal" />

    <div class="play-multi__card">
      <Transition name="card-swap" mode="out-in">
        <QuizCard
          :key="question.id"
          :question="question"
          :timer-total="timerTotal"
          :timer-remaining="timerRemaining"
        />
      </Transition>
    </div>

    <div v-if="showFeedback && feedbackResult" class="play-multi__feedback">
      <AnswerFeedback :result="feedbackResult" />
    </div>

    <div v-else-if="hasAnswered" class="play-multi__waiting">
      <p>En attente des autres joueurs...</p>
    </div>

    <div v-else class="play-multi__input">
      <AnswerInput :question="question" :disabled="hasAnswered" @submit="handleAnswer" />
    </div>

    <!-- Live scoreboard -->
    <div v-if="lobby.players.length > 1" class="play-multi__scores">
      <div
        v-for="p in lobby.players"
        :key="p.id"
        class="score-pill"
        :class="{ 'score-pill--me': p.id === lobby.playerId }"
      >
        <span class="score-pill__name">{{ p.name }}</span>
        <span class="score-pill__score">{{ p.score }}</span>
      </div>
    </div>
  </div>

  <div v-else class="play-multi__loading">
    <p>Chargement...</p>
  </div>
</template>

<style scoped>
  .play-multi {
    flex: 1;
    max-width: 640px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1rem 0;
    justify-content: center;
  }
  .play-multi__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .play-multi__progress {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
  .play-multi__progress strong {
    color: var(--accent);
  }
  .play-multi__players {
    font-size: 0.82rem;
    color: var(--text-muted);
  }
  .play-multi__card {
    flex-shrink: 0;
  }
  .play-multi__feedback,
  .play-multi__input,
  .play-multi__waiting {
    min-height: 80px;
    flex-shrink: 0;
  }
  .play-multi__waiting {
    text-align: center;
    color: var(--text-muted);
    padding: 1.5rem 0;
  }
  .play-multi__scores {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    justify-content: center;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .score-pill {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.6rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.78rem;
  }
  .score-pill--me {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--bg-secondary));
  }
  .score-pill__name {
    color: var(--text-secondary);
    font-weight: 500;
  }
  .score-pill__score {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--accent);
  }
  .play-multi__loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
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
