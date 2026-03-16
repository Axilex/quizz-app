// src/stores/lobby.store.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Player,
  Room,
  MultiplayerEvent,
  Question,
  QuestionReviewData,
  ReviewViewMode,
  GameConfig,
} from '@/types';
import { multiplayerGateway } from '@/services';
import { useFeedbackStore } from './feedbackStore';
import { useTimerStore } from './timerStore';

export const useLobbyStore = defineStore('lobby', () => {
  const room = ref<Room | null>(null);
  const players = ref<Player[]>([]);
  const playerId = ref<string | null>(null);
  const isConnecting = ref(false);
  const error = ref<string | null>(null);
  const isGameStarted = ref(false);

  // In-game state
  const currentQuestion = ref<Question | null>(null);
  const questionIndex = ref(0);
  const totalQuestions = ref(0);
  const isFlashQuestion = ref(false);
  const questionTimer = ref(30);

  // PowerUp state
  const myPowerUpsLeft = ref(3);
  const isMalusActive = ref(false);
  const malusFromName = ref('');
  const malusTimer = ref<ReturnType<typeof setTimeout> | null>(null);
  const removedOptionIds = ref<string[]>([]);
  const powerUpNotification = ref<string | null>(null);

  // Post-game review
  const finalScores = ref<Record<string, { name: string; score: number }> | null>(null);
  const reviewData = ref<QuestionReviewData[]>([]);
  const reviewViewMode = ref<ReviewViewMode>('podium');
  const reviewQuestionIdx = ref(0);

  // Reconnection state
  const isReconnecting = ref(false);
  const wasReconnected = ref(false);

  // Sous-stores
  const timer = useTimerStore();
  const feedback = useFeedbackStore();

  let unsubscribe: (() => void) | null = null;

  const isHost = computed(() => {
    if (!room.value || !playerId.value) return false;
    return room.value.hostId === playerId.value;
  });

  const roomCode = computed(() => room.value?.code ?? '');
  const playerCount = computed(() => players.value.length);

  const totalQuestionsDisplay = computed(() => {
    if (reviewData.value.length > 0) return reviewData.value.length;
    return totalQuestions.value;
  });

  const myPlayer = computed(() => players.value.find((p) => p.id === playerId.value) ?? null);

  // ─── Event handler ───────────────────────────────

  function handleEvent(event: MultiplayerEvent) {
    switch (event.type) {
      case 'player:joined':
        if (!players.value.find((p) => p.id === event.player.id)) {
          players.value.push(event.player);
        }
        break;

      case 'player:left':
        players.value = players.value.filter((p) => p.id !== event.playerId);
        break;

      case 'player:reconnected': {
        const p = players.value.find((p) => p.id === event.playerId);
        if (p) p.status = 'connected';
        break;
      }

      case 'room:reconnected': {
        room.value = event.room;
        players.value = [...event.room.players];
        playerId.value = event.playerId;
        wasReconnected.value = true;
        isReconnecting.value = false;

        for (const [id, scoreData] of Object.entries(event.scores)) {
          const p = players.value.find((p) => p.id === id);
          if (p) p.score = (scoreData as { score: number }).score;
        }

        if (event.isGameStarted) {
          isGameStarted.value = true;
          totalQuestions.value = event.totalQuestions;
          questionIndex.value = event.questionIndex;
          isFlashQuestion.value = event.isFlash;
          currentQuestion.value = (event.currentQuestion as Question) ?? null;

          // timer backend → timer store
          timer.start(event.timer ?? 30);
        }
        break;
      }

      case 'game:started':
        isGameStarted.value = true;
        questionIndex.value = -1;
        currentQuestion.value = null;
        feedback.reset();
        totalQuestions.value = event.totalQuestions ?? 0;
        isFlashQuestion.value = event.isFlash ?? false;
        reviewData.value = [];
        reviewViewMode.value = 'podium';
        reviewQuestionIdx.value = 0;
        removedOptionIds.value = [];
        timer.reset();
        break;

      case 'game:timeout':
        feedback.setResult({
          questionId: event.questionId,
          question: currentQuestion.value!,
          userAnswer: '',
          isCorrect: false,
          correctAnswer: 'Timeout !', // Pas d'answer en public
          explanation: undefined, // Pas d'explanation en public
          points: 0,
          timeSpent: 0,
          timedOut: true,
        });
        feedback.show();
        break;

      case 'game:answerResult':
        feedback.setResult({
          questionId: event.questionId,
          question: currentQuestion.value!,
          userAnswer: '', // En multi, tu peux décider si tu veux garder la réponse utilisateur
          isCorrect: event.isCorrect,
          correctAnswer: event.correctAnswer, // ✅ C'est dans l'event
          explanation: event.explanation, // ✅ C'est dans l'event
          points: event.points,
          timeSpent: 0, // Pas stocké côté client en multi
          timedOut: !!event.timedOut,
        });
        feedback.show();
        break;

      case 'game:question':
        currentQuestion.value = (event.question as Question) ?? null;
        questionIndex.value = event.index;
        isFlashQuestion.value = event.isFlash ?? false;
        questionTimer.value = event.timer ?? 30;
        if (event.totalQuestions) totalQuestions.value = event.totalQuestions;
        feedback.reset(); // Reset feedback à chaque nouvelle question
        removedOptionIds.value = [];

        // Timer du serveur
        timer.start(event.timer ?? 30);
        totalQuestions.value = Math.max(totalQuestions.value, event.index + 1);
        break;

      case 'game:finished':
        isGameStarted.value = false;
        finalScores.value = event.scores as Record<string, { name: string; score: number }>;
        reviewData.value = event.review ?? [];
        reviewViewMode.value = 'podium';
        reviewQuestionIdx.value = 0;
        timer.reset();
        break;

      case 'game:reviewUpdated':
        reviewData.value = event.review;
        finalScores.value = event.scores as Record<string, { name: string; score: number }>;
        break;

      case 'review:navigated':
        reviewViewMode.value = event.view;
        reviewQuestionIdx.value = event.questionIdx;
        break;

      case 'game:malus':
        isMalusActive.value = true;
        malusFromName.value = event.fromPlayerName;
        if (malusTimer.value) clearTimeout(malusTimer.value);
        malusTimer.value = setTimeout(() => {
          isMalusActive.value = false;
          malusFromName.value = '';
        }, event.duration);
        break;

      case 'game:bonus5050':
        removedOptionIds.value = event.removeOptionIds;
        myPowerUpsLeft.value = event.powerUpsLeft;
        break;

      case 'game:powerupUsed':
        myPowerUpsLeft.value = event.powerUpsLeft;
        break;

      case 'game:powerupEvent': {
        const fromName = event.fromName;
        const targetName = event.targetName;
        if (event.powerUpType === 'malus_blur') {
          powerUpNotification.value = `${fromName} a flouté la question de ${targetName ?? '?'} !`;
        } else if (event.powerUpType === 'bonus_fifty50') {
          powerUpNotification.value = `${fromName} a utilisé le 50/50 !`;
        }
        setTimeout(() => {
          powerUpNotification.value = null;
        }, 3000);
        break;
      }

      case 'error':
        error.value = event.message;
        if (event.message.includes('Connexion perdue')) {
          isReconnecting.value = false;
        } else if (event.message.includes('Reconnecter') || event.message.includes('connexion')) {
          isReconnecting.value = true;
        }
        break;

      default:
        break;
    }
  }

  // ─── Actions API vers gateway ─────────────────────────

  async function createRoom(playerName: string) {
    isConnecting.value = true;
    error.value = null;

    try {
      await multiplayerGateway.connect();
      const r = await multiplayerGateway.createRoom(playerName);
      room.value = r;
      players.value = [...r.players];
      playerId.value = multiplayerGateway.playerId ?? r.players.find((p) => p.isHost)?.id ?? null;
      myPowerUpsLeft.value = 3;
      unsubscribe = multiplayerGateway.onEvent(handleEvent);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Impossible de créer la room';
    } finally {
      isConnecting.value = false;
    }
  }

  async function joinRoom(code: string, playerName: string) {
    isConnecting.value = true;
    error.value = null;

    try {
      await multiplayerGateway.connect();
      const r = await multiplayerGateway.joinRoom(code, playerName);
      room.value = r;
      players.value = [...r.players];
      playerId.value = multiplayerGateway.playerId ?? r.players.find((p) => !p.isHost)?.id ?? null;
      myPowerUpsLeft.value = 3;
      unsubscribe = multiplayerGateway.onEvent(handleEvent);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Impossible de rejoindre la room';
    } finally {
      isConnecting.value = false;
    }
  }

  async function manualReconnect() {
    isReconnecting.value = true;
    error.value = null;
    try {
      await multiplayerGateway.manualReconnect();
      unsubscribe?.();
      unsubscribe = multiplayerGateway.onEvent(handleEvent);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Reconnexion impossible';
      isReconnecting.value = false;
    }
  }

  function configureGame(config: Omit<GameConfig, 'typeRatios'>) {
    multiplayerGateway.configureGame({
      questionCount: config.questionCount,
      difficulties: config.difficulties,
      categories: config.categories,
    });
  }

  function startGame() {
    multiplayerGateway.startGame();
  }

  function submitAnswer(questionId: string, answer: string, callerTimeSpent?: number) {
    // Use caller's timeSpent if provided, otherwise fallback to timer store
    const timeSpent = callerTimeSpent ?? timer.getElapsed();
    timer.stop();
    multiplayerGateway.submitAnswer(questionId, answer, timeSpent);
  }

  function usePowerUp(type: 'malus_blur' | 'bonus_fifty50', targetPlayerId?: string) {
    if (myPowerUpsLeft.value <= 0) return;
    multiplayerGateway.usePowerUp(type, targetPlayerId);
  }

  function overrideAnswer(qIdx: number, pId: string, isCorrect: boolean) {
    const q = reviewData.value[qIdx];
    if (!q) return;
    multiplayerGateway.hostOverride(pId, q.questionId, isCorrect);
  }

  function navigateReview(view: ReviewViewMode, questionIdx: number) {
    multiplayerGateway.reviewNavigate(view, questionIdx);
  }

  function leaveRoom() {
    multiplayerGateway.leaveRoom();
    multiplayerGateway.disconnect();
    unsubscribe?.();
    resetAll();
  }

  function resetMultiGame() {
    isGameStarted.value = false;
    currentQuestion.value = null;
    questionIndex.value = 0;
    questionTimer.value = 30;
    feedback.reset();
    finalScores.value = null;
    reviewData.value = [];
    totalQuestions.value = 0;
    reviewViewMode.value = 'podium';
    reviewQuestionIdx.value = 0;
    isFlashQuestion.value = false;
    removedOptionIds.value = [];
    wasReconnected.value = false;
    timer.reset();
  }

  function resetAll() {
    room.value = null;
    players.value = [];
    playerId.value = null;
    isGameStarted.value = false;
    currentQuestion.value = null;
    questionTimer.value = 30;
    finalScores.value = null;
    reviewData.value = [];
    totalQuestions.value = 0;
    reviewViewMode.value = 'podium';
    reviewQuestionIdx.value = 0;
    isFlashQuestion.value = false;
    isMalusActive.value = false;
    malusFromName.value = '';
    removedOptionIds.value = [];
    myPowerUpsLeft.value = 3;
    wasReconnected.value = false;
    isReconnecting.value = false;
    feedback.reset();
    timer.reset();
  }

  return {
    // state
    room,
    players,
    playerId,
    isConnecting,
    error,
    isGameStarted,
    currentQuestion,
    questionIndex,
    totalQuestions,
    isFlashQuestion,
    questionTimer,
    myPowerUpsLeft,
    isMalusActive,
    malusFromName,
    removedOptionIds,
    powerUpNotification,
    finalScores,
    reviewData,
    reviewViewMode,
    reviewQuestionIdx,
    isReconnecting,
    wasReconnected,

    // dérivés
    isHost,
    roomCode,
    playerCount,
    totalQuestionsDisplay,
    myPlayer,

    // feedback + timer exposés pour les composants multi
    timerRemaining: computed(() => timer.remaining),
    timerTotal: computed(() => timer.total),
    timerPercentage: computed(() => timer.percentage),
    isTimerRunning: computed(() => timer.isRunning),
    lastResult: computed(() => feedback.lastResult),
    showFeedback: computed(() => feedback.isVisible),

    // actions
    createRoom,
    joinRoom,
    manualReconnect,
    configureGame,
    startGame,
    submitAnswer,
    usePowerUp,
    leaveRoom,
    resetMultiGame,
    overrideAnswer,
    navigateReview,
  };
});
