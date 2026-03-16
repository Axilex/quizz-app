import { defineStore } from 'pinia';
import { ref, computed, shallowRef, triggerRef } from 'vue';
import type { AnswerResult, GameConfig, GamePhase, GameSession, Question } from '@/types';
import { MAX_POINTS } from '@/types';
import { gameEngine, scoreService } from '@/services';
import { logger } from '@/utils';

import { useTimerStore } from './timerStore';
import { useFeedbackStore } from './feedbackStore';

const EMPTY_PROGRESS = Object.freeze({ current: 0, total: 0, percentage: 0 });
const EMPTY_RESULTS = Object.freeze({
  total: 0,
  correct: 0,
  wrong: 0,
  totalPoints: 0,
  maxPoints: 0,
  percentage: 0,
  grade: { label: 'Pas de données', emoji: '❓' } as { label: string; emoji: string },
  avgTime: 0,
  answers: [] as AnswerResult[],
  duration: 0,
});

export const useGameStore = defineStore('game', () => {
  // === State ===
  // 🆕 Use shallowRef for large objects
  const session = shallowRef<GameSession | null>(null);
  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const loadingError = ref<string | null>(null);

  // 🆕 Get sub-stores
  const timerStore = useTimerStore();
  const feedbackStore = useFeedbackStore();

  // === Computed (Optimized) ===

  /**
   * 🆕 Memoized current question
   */
  const currentQuestion = computed<Question | null>(() => {
    if (!session.value) return null;
    return gameEngine.getCurrentQuestion(session.value);
  });

  /**
   * 🆕 Optimized progress calculation
   */
  const progress = computed(() => {
    if (!session.value) return EMPTY_PROGRESS;

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

  /**
   * 🆕 Cached timer duration
   */
  const timerDuration = computed(() => {
    if (!currentQuestion.value) return 0;
    return gameEngine.getTimerDuration(currentQuestion.value);
  });

  // === Actions ===

  /**
   * Start a new game
   */
  async function startGame(config: GameConfig): Promise<boolean> {
    isLoading.value = true;
    loadingError.value = null;
    feedbackStore.reset();

    try {
      session.value = await gameEngine.createSession(config);
      isLoading.value = false;
      timerStore.start(timerDuration.value, handleTimeout);
      return true;
    } catch (err) {
      isLoading.value = false;
      loadingError.value = err instanceof Error ? err.message : 'Erreur inconnue';
      return false;
    }
  }

  /**
   * Start replay mode with wrong answers
   */
  function startReplay(wrongAnswers: AnswerResult[]) {
    if (!session.value) return;

    const questions = wrongAnswers.map((a) => a.question);
    session.value = gameEngine.createReplaySession(session.value.config, questions);

    feedbackStore.reset();
    timerStore.start(timerDuration.value, handleTimeout);
  }

  /**
   * 🆕 Submit answer with optimistic UI
   */
  async function submitAnswer(userAnswer: string) {
    if (!session.value || !currentQuestion.value || isSubmitting.value) return;

    const timeSpent = timerStore.getElapsed();
    timerStore.stop();
    isSubmitting.value = true;

    try {
      const result = await gameEngine.submitAnswer(session.value, userAnswer, timeSpent, false);

      // Don't triggerRef yet — keep showing old question during feedback
      feedbackStore.setResult(result);
      scheduleNextQuestion();
    } catch (err) {
      logger.log(err);

      feedbackStore.setResult({
        questionId: currentQuestion.value!.id,
        question: currentQuestion.value!,
        userAnswer,
        isCorrect: false,
        correctAnswer: '?',
        points: 0,
        timeSpent,
        timedOut: false,
      });

      scheduleNextQuestion();
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Handle timeout
   */
  async function handleTimeout() {
    if (!session.value || !currentQuestion.value || isSubmitting.value) return;

    timerStore.stop();
    isSubmitting.value = true;

    try {
      const result = await gameEngine.submitAnswer(
        session.value,
        '', // Empty answer
        timerStore.total * 1000,
        true, // Timed out
      );

      feedbackStore.setResult(result);
      scheduleNextQuestion();
    } catch {
      feedbackStore.setResult({
        questionId: currentQuestion.value!.id,
        question: currentQuestion.value!,
        userAnswer: '',
        isCorrect: false,
        correctAnswer: '?',
        points: 0,
        timeSpent: timerStore.total * 1000,
        timedOut: true,
      });

      scheduleNextQuestion();
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Schedule next question with feedback delay.
   * triggerRef is deferred so the QuizCard keeps showing the answered question
   * while feedback animates, then transitions smoothly to the next one.
   */
  function scheduleNextQuestion() {
    feedbackStore.show();

    setTimeout(() => {
      feedbackStore.hide();

      // Now trigger reactivity — Vue sees the mutated session
      triggerRef(session);

      if (session.value && session.value.phase !== 'results') {
        timerStore.start(timerDuration.value, handleTimeout);
      }
    }, 1500);
  }

  /**
   * Reset game
   */
  function resetGame() {
    timerStore.stop();
    feedbackStore.reset();
    session.value = null;
    isLoading.value = false;
    isSubmitting.value = false;
    loadingError.value = null;
  }

  /**
   * Get wrong answers for replay
   */
  function getWrongAnswers(): AnswerResult[] {
    if (!session.value) return [];
    return gameEngine.getWrongAnswers(session.value);
  }

  /**
   * 🆕 Optimized results calculation (cached)
   */
  function getResults() {
    if (!session.value) return EMPTY_RESULTS;

    const total = session.value.questions.length;
    const correct = session.value.answers.filter((a) => a.isCorrect).length;
    const totalPoints = session.value.score;
    const maxPoints = session.value.questions.reduce(
      (sum, q) => sum + (MAX_POINTS[q.difficulty] ?? 500),
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
    isLoading,
    isSubmitting,
    loadingError,

    // From sub-stores
    timerRemaining: computed(() => timerStore.remaining),
    timerTotal: computed(() => timerStore.total),
    isTimerRunning: computed(() => timerStore.isRunning),
    timerPercentage: computed(() => timerStore.percentage),
    lastAnswerResult: computed(() => feedbackStore.lastResult),
    showFeedback: computed(() => feedbackStore.isVisible),

    // Computed
    currentQuestion,
    progress,
    score,
    phase,
    isPlaying,
    timerDuration,

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
