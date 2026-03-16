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

  const sortedPlayers = computed(() => [...lobby.players].sort((a, b) => b.score - a.score));

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

  watch(
    () => lobby.finalScores,
    (scores) => {
      if (scores) {
        timerService.stop();
        router.push('/results-multi');
      }
    },
  );

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

    <!-- Reconnecting -->
    <Transition name="overlay">
      <div v-if="isReconnecting" class="reconnecting-bar">
        <div class="reconnecting-bar__spinner" />
        <span>Reconnexion en cours…</span>
      </div>
    </Transition>

    <div v-if="question" class="play-multi">
      <div class="play-multi__top">
        <div class="play-multi__progress-info">
          <span class="play-multi__label">Question</span>
          <span class="play-multi__progress-num">
            {{ lobby.questionIndex + 1 }}<span class="play-multi__progress-sep">/</span
            >{{ lobby.totalQuestions || '?' }}
          </span>
        </div>
        <Transition name="flash-in">
          <div v-if="lobby.isFlashQuestion" class="play-multi__flash-pill">⚡ FLASH</div>
        </Transition>
        <div class="play-multi__player-count">👥 {{ lobby.playerCount }}</div>
      </div>

      <TimerBar :remaining="timerRemaining" :total="timerTotal" />

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
          <p>En attente des autres joueurs…</p>
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
      <p>En attente de la question…</p>
    </div>
  </section>
</template>

<style scoped>
  .play-multi {
    flex: 1;
    max-width: var(--max-content);
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md) 0;
  }

  .play-multi-page {
    position: relative;
    flex: 1;
    width: 100%;
  }

  .play-multi__top {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-shrink: 0;
  }
  .play-multi__progress-info {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
  }
  .play-multi__label {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }
  .play-multi__progress-num {
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--text-primary);
  }
  .play-multi__progress-sep {
    color: var(--text-muted);
    margin: 0 0.1rem;
  }
  .play-multi__flash-pill {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: var(--bg-base);
    font-weight: 800;
    font-size: var(--text-xs);
    letter-spacing: 0.1em;
    padding: 0.28rem 0.7rem;
    border-radius: var(--radius-full);
    animation: flash-pulse 0.8s ease-in-out infinite alternate;
  }
  @keyframes flash-pulse {
    from {
      box-shadow: 0 0 6px rgba(245, 158, 11, 0.3);
    }
    to {
      box-shadow: 0 0 16px rgba(245, 158, 11, 0.6);
    }
  }
  .play-multi__player-count {
    margin-left: auto;
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
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
    gap: var(--space-sm);
    padding: var(--space-lg) 0;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
  .waiting-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid var(--border-strong);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  .points-pop {
    position: absolute;
    right: 0;
    text-align: right;
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-weight: 800;
    color: var(--success);
    pointer-events: none;
    text-shadow: 0 0 20px rgba(86, 214, 123, 0.35);
  }
  .pts-pop-enter-active {
    animation: pts-in 0.4s var(--ease-spring);
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

  .play-multi__scores {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: center;
    padding-top: var(--space-sm);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .score-pill {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.65rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    transition: all 0.3s;
  }
  .score-pill--me {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .score-pill--answered {
    opacity: 0.6;
  }
  .score-pill--disconnected {
    opacity: 0.3;
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

  .powerup-toast {
    position: fixed;
    top: calc(var(--header-height) + var(--safe-top) + var(--space-md));
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-secondary);
    border: 1px solid var(--accent);
    border-radius: var(--radius-md);
    padding: 0.65rem 1.3rem;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
    box-shadow: var(--shadow-lg);
    z-index: 100;
    white-space: nowrap;
  }
  .toast-enter-active {
    animation: toast-in 0.3s var(--ease-out-expo);
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

  .reconnect-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    backdrop-filter: blur(8px);
  }
  .reconnect-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-xl);
    padding: var(--space-2xl) var(--space-xl);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    max-width: 340px;
    width: 90%;
    box-shadow: var(--shadow-xl);
  }
  .reconnect-card__icon {
    font-size: 3rem;
  }
  .reconnect-card__title {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--text-primary);
  }
  .reconnect-card__desc {
    font-size: var(--text-sm);
    color: var(--text-muted);
    line-height: 1.5;
  }
  .reconnect-card__btn {
    padding: var(--space-md) var(--space-xl);
    background: linear-gradient(135deg, var(--accent), #d4a03a);
    color: var(--bg-base);
    border: none;
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: var(--text-base);
    cursor: pointer;
    transition: all 0.2s;
    min-height: 48px;
  }
  .reconnect-card__btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px var(--accent-glow);
  }

  .reconnecting-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--accent);
    padding: 0.65rem var(--space-md);
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    justify-content: center;
    font-size: var(--text-sm);
    color: var(--accent);
    font-weight: 600;
    z-index: 150;
  }
  .reconnecting-bar__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(232, 178, 80, 0.3);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  .play-multi__loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-strong);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .overlay-enter-active,
  .overlay-leave-active {
    transition: opacity 0.3s;
  }
  .overlay-enter-from,
  .overlay-leave-to {
    opacity: 0;
  }

  .flash-in-enter-active {
    animation: flash-in 0.4s var(--ease-spring);
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

  @media (max-width: 640px) {
    .play-multi {
      padding: var(--space-sm) 0;
      gap: var(--space-sm);
    }
    .powerup-toast {
      font-size: var(--text-xs);
      padding: 0.5rem var(--space-md);
    }
  }
</style>
