import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AnswerResult, GameConfig, GamePhase, GameSession, Question } from '@/types';
import { DIFFICULTY_POINTS } from '@/types';
import { gameEngine, timerService, TimerService, scoreService } from '@/services';

export const useGameStore = defineStore('game', () => {
  // State
  const session = ref<GameSession | null>(null);
  const timerRemaining = ref(0);
  const timerTotal = ref(0);
  const isTimerRunning = ref(false);
  const lastAnswerResult = ref<AnswerResult | null>(null);
  const showFeedback = ref(false);
  const isLoading = ref(false);
  const loadingError = ref<string | null>(null);

  // Computed
  const currentQuestion = computed<Question | null>(() => {
    if (!session.value) return null;
    return gameEngine.getCurrentQuestion(session.value);
  });

  const progress = computed(() => {
    if (!session.value) return { current: 0, total: 0, percentage: 0 };
    const total = session.value.questions.length;
    const current = session.value.currentIndex;
    return {
      current: current + 1,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    };
  });

  const score = computed(() => session.value?.score ?? 0);
  const phase = computed<GamePhase>(() => session.value?.phase ?? 'idle');
  const isPlaying = computed(() => phase.value === 'playing' || phase.value === 'replay');

  const timerDuration = computed(() => {
    if (!currentQuestion.value) return 0;
    return gameEngine.getTimerDuration(currentQuestion.value);
  });

  const timerPercentage = computed(() => {
    if (timerTotal.value === 0) return 100;
    return Math.round((timerRemaining.value / timerTotal.value) * 100);
  });

  // Actions

  /** Start a new game — async because questions are fetched from the API */
  async function startGame(config: GameConfig): Promise<boolean> {
    isLoading.value = true;
    loadingError.value = null;
    lastAnswerResult.value = null;
    showFeedback.value = false;

    try {
      session.value = await gameEngine.createSession(config);
      isLoading.value = false;
      startTimer();
      return true;
    } catch (err) {
      isLoading.value = false;
      loadingError.value = err instanceof Error ? err.message : 'Erreur inconnue';
      return false;
    }
  }

  function startReplay(wrongAnswers: AnswerResult[]) {
    if (!session.value) return;
    const questions = wrongAnswers.map((a) => a.question);
    session.value = gameEngine.createReplaySession(session.value.config, questions);
    lastAnswerResult.value = null;
    showFeedback.value = false;
    startTimer();
  }

  function submitAnswer(userAnswer: string) {
    if (!session.value || !currentQuestion.value) return;

    const timeSpent = timerService.getElapsed();
    timerService.stop();
    isTimerRunning.value = false;

    const result = gameEngine.submitAnswer(session.value, userAnswer, timeSpent, false);
    lastAnswerResult.value = result;
    showFeedback.value = true;

    setTimeout(() => {
      showFeedback.value = false;
      if (session.value && session.value.phase !== 'results') {
        startTimer();
      }
    }, 1500);
  }

  function handleTimeout() {
    if (!session.value || !currentQuestion.value) return;

    timerService.stop();
    isTimerRunning.value = false;

    const result = gameEngine.submitAnswer(session.value, '', timerTotal.value * 1000, true);
    lastAnswerResult.value = result;
    showFeedback.value = true;

    setTimeout(() => {
      showFeedback.value = false;
      if (session.value && session.value.phase !== 'results') {
        startTimer();
      }
    }, 1500);
  }

  function startTimer() {
    if (!currentQuestion.value) return;

    const duration = TimerService.computeDuration(
      currentQuestion.value.difficulty,
      currentQuestion.value.type,
      currentQuestion.value.baseTimer,
    );

    timerTotal.value = duration;
    timerRemaining.value = duration;
    isTimerRunning.value = true;

    timerService.start(duration, {
      onTick: (remaining) => {
        timerRemaining.value = remaining;
      },
      onComplete: () => {
        isTimerRunning.value = false;
        handleTimeout();
      },
    });
  }

  function resetGame() {
    timerService.stop();
    session.value = null;
    timerRemaining.value = 0;
    timerTotal.value = 0;
    isTimerRunning.value = false;
    lastAnswerResult.value = null;
    showFeedback.value = false;
    isLoading.value = false;
    loadingError.value = null;
  }

  function getWrongAnswers(): AnswerResult[] {
    if (!session.value) return [];
    return gameEngine.getWrongAnswers(session.value);
  }

  function getResults() {
    if (!session.value) return null;
    const total = session.value.questions.length;
    const correct = session.value.answers.filter((a) => a.isCorrect).length;
    const totalPoints = session.value.score;
    const maxPoints = session.value.questions.reduce(
      (sum, q) => sum + (DIFFICULTY_POINTS[q.difficulty] ?? 1),
      0,
    );
    const percentage = scoreService.calculatePercentage(totalPoints, maxPoints);
    const grade = scoreService.getGrade(percentage);
    const times = session.value.answers.map((a) => a.timeSpent);
    const avgTime = scoreService.averageTime(times);

    return {
      total,
      correct,
      wrong: total - correct,
      totalPoints,
      maxPoints,
      percentage,
      grade,
      avgTime,
      answers: session.value.answers,
      duration: session.value.finishedAt
        ? session.value.finishedAt - session.value.startedAt
        : Date.now() - session.value.startedAt,
    };
  }

  return {
    // State
    session,
    timerRemaining,
    timerTotal,
    isTimerRunning,
    lastAnswerResult,
    showFeedback,
    isLoading,
    loadingError,
    // Computed
    currentQuestion,
    progress,
    score,
    phase,
    isPlaying,
    timerDuration,
    timerPercentage,
    // Actions
    startGame,
    startReplay,
    submitAnswer,
    handleTimeout,
    resetGame,
    getWrongAnswers,
    getResults,
  };
});
