<script setup lang="ts">
  import { ref, computed, watch, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useLobbyStore } from '@/stores';
  import { timerService } from '@/services';
  import { multiplayerGateway } from '@/services';
  import type { ConnectionState } from '@/services/multiplayer/SocketIOMultiplayerGateway';
  import type { Question } from '@/types';
  import QuizCard from '@/components/game/QuizCard.vue';
  import TimerBar from '@/components/game/TimerBar.vue';
  import AnswerInput from '@/components/game/AnswerInput.vue';
  import AnswerFeedback from '@/components/game/AnswerFeedback.vue';
  import PowerUpBar from '@/components/game/PowerUpBar.vue';

  const router = useRouter();
  const lobby = useLobbyStore();

  const timerRemaining = ref(0);
  const timerTotal = ref(0);
  const showFeedback = ref(false);
  const hasAnswered = ref(false);
  const startTime = ref(Date.now());

  const connectionState = ref<ConnectionState>(multiplayerGateway.connectionState);
  const unsubState = multiplayerGateway.onStateChange((s) => {
    connectionState.value = s;
  });
  const isReconnecting = computed(() => connectionState.value === 'reconnecting');
  const isDisconnected = computed(
    () => connectionState.value === 'disconnected' && !isReconnecting.value,
  );

  const question = computed(() => lobby.currentQuestion as Question | null);

  // Points earned on last answer
  const pointsEarned = ref<number | null>(null);
  const showPointsAnim = ref(false);

  const feedbackResult = computed(() => {
    if (!lobby.lastResult || !question.value) return null;
    return {
      questionId: question.value.id,
      question: question.value,
      userAnswer: '',
      isCorrect: lobby.lastResult.isCorrect,
      correctAnswer: lobby.lastResult.correctAnswer,
      explanation: lobby.lastResult.explanation,
      points: lobby.lastResult.points,
      timeSpent: 0,
      timedOut: false,
    };
  });

  // Sorted players for live score display
  const sortedPlayers = computed(() => [...lobby.players].sort((a, b) => b.score - a.score));

  // When a new question arrives, start the timer
  watch(
    () => lobby.questionIndex,
    () => {
      if (!question.value) return;

      hasAnswered.value = false;
      showFeedback.value = false;
      showPointsAnim.value = false;
      pointsEarned.value = null;
      startTime.value = Date.now();

      const duration = lobby.questionTimer || 30;
      timerTotal.value = duration;
      timerRemaining.value = duration;

      timerService.start(duration, {
        onTick: (remaining) => {
          timerRemaining.value = remaining;
        },
        onComplete: () => {
          if (!hasAnswered.value) handleTimeout();
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

        if (result.points > 0) {
          pointsEarned.value = result.points;
          showPointsAnim.value = true;
          setTimeout(() => {
            showPointsAnim.value = false;
          }, 2000);
        }
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

  // Handle reconnection — restore question timer if needed
  watch(
    () => lobby.wasReconnected,
    (reconnected) => {
      if (reconnected && lobby.isGameStarted && question.value) {
        hasAnswered.value = false;
        showFeedback.value = false;
        const duration = lobby.questionTimer || 30;
        timerTotal.value = duration;
        timerRemaining.value = duration;
        timerService.start(duration, {
          onTick: (r) => {
            timerRemaining.value = r;
          },
          onComplete: () => {
            if (!hasAnswered.value) handleTimeout();
          },
        });
      }
    },
  );

  function handleAnswer(answer: string) {
    if (hasAnswered.value || !question.value) return;
    hasAnswered.value = true;
    timerService.stop();
    const timeSpent = Date.now() - startTime.value;
    lobby.submitAnswer(question.value.id, answer, timeSpent);
  }

  function handleGeoSubmit(answer: string) {
    handleAnswer(answer);
  }

  function handleTimeout() {
    if (hasAnswered.value || !question.value) return;
    hasAnswered.value = true;
    lobby.submitAnswer(question.value.id, '', 0);
  }

  function handleMalus(targetPlayerId: string) {
    lobby.usePowerUp('malus_blur', targetPlayerId);
  }

  function handleBonus50() {
    lobby.usePowerUp('bonus_fifty50');
  }

  async function handleManualReconnect() {
    await lobby.manualReconnect();
  }

  onUnmounted(() => {
    timerService.stop();
    unsubState();
  });
</script>

<template>
  <section class="play-multi-page">
    <!-- Disconnected overlay -->
    <Transition name="overlay">
      <div v-if="isDisconnected" class="reconnect-overlay">
        <div class="reconnect-card">
          <div class="reconnect-card__icon">📡</div>
          <h3 class="reconnect-card__title">Connexion perdue</h3>
          <p class="reconnect-card__desc">Votre connexion au serveur a été interrompue.</p>
          <button class="reconnect-card__btn" @click="handleManualReconnect">Reconnecter</button>
        </div>
      </div>
    </Transition>

    <!-- Reconnecting spinner -->
    <Transition name="overlay">
      <div v-if="isReconnecting" class="reconnecting-bar">
        <div class="reconnecting-bar__spinner" />
        <span>Reconnexion en cours...</span>
      </div>
    </Transition>

    <div v-if="question" class="play-multi">
      <!-- Header: progress + players count -->
      <div class="play-multi__top">
        <div class="play-multi__progress-info">
          <span class="play-multi__label">Question</span>
          <span class="play-multi__progress-num">
            {{ lobby.questionIndex + 1 }}<span class="play-multi__progress-sep">/</span>
            {{ lobby.totalQuestions || '?' }}
          </span>
        </div>

        <Transition name="flash-in">
          <div v-if="lobby.isFlashQuestion" class="play-multi__flash-pill">⚡ FLASH</div>
        </Transition>

        <div class="play-multi__player-count">👥 {{ lobby.playerCount }}</div>
      </div>

      <TimerBar
        :remaining="timerRemaining"
        :total="timerTotal"
        :class="{ 'timer--flash': lobby.isFlashQuestion }"
      />

      <div class="play-multi__card">
        <Transition name="card-swap" mode="out-in">
          <QuizCard
            :key="question.id"
            :question="question"
            :timer-total="timerTotal"
            :timer-remaining="timerRemaining"
            :is-flash="lobby.isFlashQuestion"
            :is-malus-active="lobby.isMalusActive"
            :malus-from-name="lobby.malusFromName"
            :disabled="hasAnswered"
            @submit="handleGeoSubmit"
          />
        </Transition>
      </div>

      <Transition name="pts-pop">
        <div v-if="showPointsAnim && pointsEarned" class="points-pop">+{{ pointsEarned }} pts</div>
      </Transition>

      <div class="play-multi__interaction">
        <AnswerFeedback v-if="showFeedback && feedbackResult" :result="feedbackResult" />

        <div v-else-if="hasAnswered" class="play-multi__waiting">
          <div class="waiting-spinner" />
          <p>En attente des autres joueurs...</p>
        </div>

        <AnswerInput
          v-else-if="question.type !== 'geoClickMap'"
          :question="question"
          :disabled="hasAnswered"
          :removed-option-ids="lobby.removedOptionIds"
          @submit="handleAnswer"
        />
      </div>

      <PowerUpBar
        v-if="!showFeedback && !hasAnswered"
        :power-ups-left="lobby.myPowerUpsLeft"
        :players="lobby.players"
        :my-player-id="lobby.playerId"
        :current-question-type="question.type"
        :disabled="hasAnswered"
        :is-flash="lobby.isFlashQuestion"
        @malus="handleMalus"
        @bonus50="handleBonus50"
      />

      <Transition name="toast">
        <div v-if="lobby.powerUpNotification" class="powerup-toast">
          {{ lobby.powerUpNotification }}
        </div>
      </Transition>

      <div class="play-multi__scores">
        <div
          v-for="(p, rank) in sortedPlayers"
          :key="p.id"
          class="score-pill"
          :class="{
            'score-pill--me': p.id === lobby.playerId,
            'score-pill--answered': p.status === 'waiting',
            'score-pill--disconnected': p.status === 'disconnected',
          }"
        >
          <span class="score-pill__rank">{{ rank + 1 }}</span>
          <span class="score-pill__name">{{ p.name }}</span>
          <span class="score-pill__score">{{ p.score }}</span>
        </div>
      </div>
    </div>

    <div v-else class="play-multi__loading">
      <div class="loading-spinner" />
      <p>En attente de la question...</p>
    </div>
  </section>
</template>

<style scoped>
  .play-multi {
    flex: 1;
    max-width: 640px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0;
  }

  .play-multi-page {
    position: relative;
    flex: 1;
    width: 100%;
  }

  /* ─── Header ─────────────────────────────────── */
  .play-multi__top {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .play-multi__progress-info {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
  }

  .play-multi__label {
    font-size: 0.72rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  .play-multi__progress-num {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .play-multi__progress-sep {
    color: var(--text-muted);
    margin: 0 0.1rem;
  }

  .play-multi__flash-pill {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #1a1c20;
    font-weight: 800;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    padding: 0.25rem 0.65rem;
    border-radius: 20px;
    animation: flash-pulse 0.8s ease-in-out infinite alternate;
  }

  @keyframes flash-pulse {
    from {
      box-shadow: 0 0 6px rgba(245, 158, 11, 0.3);
    }
    to {
      box-shadow: 0 0 14px rgba(245, 158, 11, 0.7);
    }
  }

  .play-multi__player-count {
    margin-left: auto;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  /* ─── Interaction area ───────────────────────── */
  .play-multi__card {
    flex-shrink: 0;
  }

  .play-multi__interaction {
    min-height: 80px;
    flex-shrink: 0;
    position: relative;
  }

  .play-multi__waiting {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1.5rem 0;
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .waiting-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  /* ─── Points animation ───────────────────────── */
  .points-pop {
    position: absolute;
    right: 0;
    text-align: right;
    font-family: var(--font-mono);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--success);
    pointer-events: none;
    text-shadow: 0 0 20px rgba(110, 200, 122, 0.4);
  }

  .pts-pop-enter-active {
    animation: pts-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .pts-pop-leave-active {
    animation: pts-out 1.5s ease forwards;
  }
  @keyframes pts-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.7);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  @keyframes pts-out {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    70% {
      opacity: 1;
      transform: translateY(-20px);
    }
    100% {
      opacity: 0;
      transform: translateY(-35px);
    }
  }

  /* ─── Scoreboard ─────────────────────────────── */
  .play-multi__scores {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: center;
    padding-top: 0.6rem;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .score-pill {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.76rem;
    transition: all 0.3s;
  }

  .score-pill--me {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--bg-secondary));
  }

  .score-pill--answered {
    opacity: 0.65;
  }

  .score-pill--disconnected {
    opacity: 0.35;
    text-decoration: line-through;
  }

  .score-pill__rank {
    font-size: 0.65rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
    min-width: 1rem;
  }

  .score-pill__name {
    color: var(--text-secondary);
    font-weight: 500;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .score-pill__score {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--accent);
    min-width: 2rem;
    text-align: right;
  }

  /* ─── PowerUp toast ──────────────────────────── */
  .powerup-toast {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-secondary);
    border: 1px solid var(--accent);
    border-radius: 10px;
    padding: 0.6rem 1.2rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    z-index: 100;
    white-space: nowrap;
  }

  .toast-enter-active {
    animation: toast-in 0.3s ease;
  }
  .toast-leave-active {
    animation: toast-in 0.3s ease reverse;
  }
  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  /* ─── Reconnect overlay ──────────────────────── */
  .reconnect-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    backdrop-filter: blur(4px);
  }

  .reconnect-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2.5rem 2rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    max-width: 340px;
    width: 90%;
  }

  .reconnect-card__icon {
    font-size: 3rem;
  }

  .reconnect-card__title {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .reconnect-card__desc {
    font-size: 0.9rem;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .reconnect-card__btn {
    padding: 0.8rem 2rem;
    background: var(--accent);
    color: var(--bg-primary);
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reconnect-card__btn:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--accent-glow);
  }

  .reconnecting-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--accent);
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: center;
    font-size: 0.85rem;
    color: var(--accent);
    font-weight: 600;
    z-index: 150;
  }

  .reconnecting-bar__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(229, 166, 62, 0.3);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  /* ─── Loading ────────────────────────────────── */
  .play-multi__loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ─── Transitions ────────────────────────────── */
  .overlay-enter-active,
  .overlay-leave-active {
    transition: opacity 0.3s;
  }
  .overlay-enter-from,
  .overlay-leave-to {
    opacity: 0;
  }

  .flash-in-enter-active {
    animation: flash-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .flash-in-leave-active {
    animation: flash-in 0.2s ease reverse;
  }
  @keyframes flash-in {
    from {
      opacity: 0;
      transform: scale(0.7);
    }
    to {
      opacity: 1;
      transform: scale(1);
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

  @media (max-width: 640px) {
    .play-multi {
      padding: 0.75rem 0;
      gap: 0.75rem;
    }
    .powerup-toast {
      font-size: 0.78rem;
      padding: 0.5rem 1rem;
    }
  }
</style>
