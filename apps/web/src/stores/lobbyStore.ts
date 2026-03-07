import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Player,
  Room,
  MultiplayerEvent,
  Question,
  QuestionReviewData,
  PlayerAnswer,
  Difficulty,
} from '@/types';
import { DIFFICULTY_POINTS } from '@/types';
import { multiplayerGateway } from '@/services';

/** Types that can be auto-validated (exact match) */
const AUTO_VALIDATED_TYPES = new Set(['number', 'qcm', 'chronology', 'intruder']);

export const useLobbyStore = defineStore('lobby', () => {
  const room = ref<Room | null>(null);
  const players = ref<Player[]>([]);
  const playerId = ref<string | null>(null);
  const isConnecting = ref(false);
  const error = ref<string | null>(null);
  const isGameStarted = ref(false);
  const isMockMode = ref(false);

  // Multi-player game state
  const currentQuestion = ref<Question | null>(null);
  const questionIndex = ref(0);
  const questionTimer = ref(0);
  const lastResult = ref<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null>(null);
  const finalScores = ref<Record<string, { name: string; score: number }> | null>(null);
  const reviewData = ref<QuestionReviewData[]>([]);

  // ── Local tracking for building review data ──
  /** Questions seen during this multi game (indexed by questionIndex) */
  const trackedQuestions = ref<Map<number, Question>>(new Map());
  /** Local player's answers (indexed by questionIndex) */
  const trackedAnswers = ref<Map<number, { answer: string; timeSpent: number; timedOut: boolean }>>(
    new Map(),
  );
  /** Total questions count (tracked from question events) */
  const totalQuestionsCount = ref(0);

  let unsubscribe: (() => void) | null = null;

  const isHost = computed(() => {
    if (!room.value || !playerId.value) return false;
    return room.value.hostId === playerId.value;
  });

  const roomCode = computed(() => room.value?.code ?? '');
  const playerCount = computed(() => players.value.length);

  /** Total questions — from reviewData if available, else from tracked count */
  const totalQuestions = computed(() => {
    if (reviewData.value.length > 0) return reviewData.value.length;
    return totalQuestionsCount.value;
  });

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

      case 'game:started':
        isGameStarted.value = true;
        trackedQuestions.value = new Map();
        trackedAnswers.value = new Map();
        totalQuestionsCount.value = 0;
        break;

      case 'game:question':
        currentQuestion.value = (event.question as Question) ?? null;
        questionIndex.value = event.index;
        questionTimer.value = event.timer ?? 30;
        lastResult.value = null;
        totalQuestionsCount.value = Math.max(totalQuestionsCount.value, event.index + 1);

        // Track question locally
        if (event.question) {
          trackedQuestions.value.set(event.index, event.question as Question);
        }
        break;

      case 'game:answerResult':
        lastResult.value = {
          isCorrect: event.isCorrect,
          correctAnswer: event.correctAnswer,
          explanation: event.explanation,
        };
        break;

      case 'player:answered': {
        const answeredPlayer = players.value.find((p) => p.id === event.playerId);
        if (answeredPlayer) answeredPlayer.status = 'waiting';
        break;
      }

      case 'game:finished':
        finalScores.value = event.scores as Record<string, { name: string; score: number }>;
        isGameStarted.value = false;

        // Use server review data if provided, otherwise build locally
        if (event.review && event.review.length > 0) {
          reviewData.value = event.review;
        } else {
          reviewData.value = buildLocalReviewData();
        }
        break;

      case 'error':
        error.value = event.message;
        break;
    }
  }

  /** Build review data from locally tracked questions/answers */
  function buildLocalReviewData(): QuestionReviewData[] {
    const result: QuestionReviewData[] = [];
    const myId = playerId.value ?? 'unknown';

    for (let i = 0; i < totalQuestionsCount.value; i++) {
      const q = trackedQuestions.value.get(i);
      if (!q) continue;

      const myAnswer = trackedAnswers.value.get(i);
      const autoValidated = AUTO_VALIDATED_TYPES.has(q.type);

      // Build player answers — we only know our own answer locally
      const playerAnswers: PlayerAnswer[] = players.value.map((p) => {
        if (p.id === myId && myAnswer) {
          const isCorrect = !myAnswer.timedOut && myAnswer.answer !== '';
          return {
            playerId: p.id,
            playerName: p.name,
            answer: myAnswer.answer,
            isCorrect, // Will be refined when scores are known
            timeSpent: myAnswer.timeSpent,
            timedOut: myAnswer.timedOut,
            hostOverride: null,
          };
        }
        // For other players, we don't know their exact answer locally
        return {
          playerId: p.id,
          playerName: p.name,
          answer: '—',
          isCorrect: false,
          timeSpent: 0,
          timedOut: false,
          hostOverride: null,
        };
      });

      result.push({
        questionId: q.id,
        questionLabel: q.label,
        questionType: q.type,
        correctAnswer: q.answer,
        explanation: q.explanation,
        playerAnswers,
        autoValidated,
      });
    }

    return result;
  }

  async function createRoom(playerName: string) {
    isConnecting.value = true;
    error.value = null;
    try {
      await multiplayerGateway.connect();
      const isMock = (multiplayerGateway as { isMockMode?: boolean }).isMockMode ?? false;
      const r = await multiplayerGateway.createRoom(playerName);
      room.value = r;
      players.value = [...r.players];
      playerId.value =
        (multiplayerGateway as { playerId?: string | null }).playerId ??
        r.players.find((p) => p.isHost)?.id ??
        null;
      isMockMode.value = isMock;
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
      const isMock = (multiplayerGateway as { isMockMode?: boolean }).isMockMode ?? false;
      const r = await multiplayerGateway.joinRoom(code, playerName);
      room.value = r;
      players.value = [...r.players];
      playerId.value =
        (multiplayerGateway as { playerId?: string | null }).playerId ??
        r.players.find((p) => !p.isHost)?.id ??
        null;
      isMockMode.value = isMock;
      unsubscribe = multiplayerGateway.onEvent(handleEvent);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Impossible de rejoindre la room';
    } finally {
      isConnecting.value = false;
    }
  }

  function configureGame(config: {
    questionCount: number;
    difficulties: string[];
    categories?: string[];
  }) {
    (multiplayerGateway as { configureGame?: (c: unknown) => void }).configureGame?.(config);
  }

  function startGame() {
    multiplayerGateway.startGame();
  }

  function submitAnswer(questionId: string, answer: string, timeSpent: number) {
    // Track answer locally
    trackedAnswers.value.set(questionIndex.value, {
      answer,
      timeSpent,
      timedOut: !answer && timeSpent === 0,
    });

    multiplayerGateway.submitAnswer(questionId, answer, timeSpent);
  }

  function leaveRoom() {
    multiplayerGateway.leaveRoom();
    multiplayerGateway.disconnect();
    unsubscribe?.();
    room.value = null;
    players.value = [];
    playerId.value = null;
    isGameStarted.value = false;
    currentQuestion.value = null;
    finalScores.value = null;
    reviewData.value = [];
    trackedQuestions.value = new Map();
    trackedAnswers.value = new Map();
    totalQuestionsCount.value = 0;
  }

  function resetMultiGame() {
    isGameStarted.value = false;
    currentQuestion.value = null;
    questionIndex.value = 0;
    lastResult.value = null;
    finalScores.value = null;
    reviewData.value = [];
    trackedQuestions.value = new Map();
    trackedAnswers.value = new Map();
    totalQuestionsCount.value = 0;
  }

  /** Update a player answer's validation override (host manual validation) */
  function overrideAnswer(qIdx: number, pId: string, isCorrect: boolean) {
    const q = reviewData.value[qIdx];
    if (!q) return;
    const pa = q.playerAnswers.find((a) => a.playerId === pId);
    if (!pa) return;
    pa.hostOverride = isCorrect;
    pa.isCorrect = isCorrect;

    // Recalculate scores from review data using difficulty points
    if (finalScores.value) {
      for (const [id] of Object.entries(finalScores.value)) {
        let score = 0;
        for (const qr of reviewData.value) {
          const a = qr.playerAnswers.find((a) => a.playerId === id);
          if (a?.isCorrect) {
            // Find the question to get difficulty-based points
            const trackedQ = trackedQuestions.value.get(reviewData.value.indexOf(qr));
            const difficulty = (trackedQ?.difficulty ?? 'easy') as Difficulty;
            score += DIFFICULTY_POINTS[difficulty] ?? 1;
          }
        }
        finalScores.value[id]!.score = score;
      }
      finalScores.value = { ...finalScores.value };
    }
  }

  return {
    room,
    players,
    playerId,
    isConnecting,
    error,
    isHost,
    isMockMode,
    roomCode,
    playerCount,
    isGameStarted,
    currentQuestion,
    questionIndex,
    questionTimer,
    lastResult,
    finalScores,
    reviewData,
    totalQuestions,
    createRoom,
    joinRoom,
    configureGame,
    startGame,
    submitAnswer,
    leaveRoom,
    resetMultiGame,
    overrideAnswer,
  };
});
