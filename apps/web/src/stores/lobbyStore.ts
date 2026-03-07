import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Player, Room, MultiplayerEvent, Question } from '@/types';
import { multiplayerGateway } from '@/services';

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

  let unsubscribe: (() => void) | null = null;

  const isHost = computed(() => {
    if (!room.value || !playerId.value) return false;
    return room.value.hostId === playerId.value;
  });

  const roomCode = computed(() => room.value?.code ?? '');
  const playerCount = computed(() => players.value.length);

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
        break;

      case 'game:question':
        currentQuestion.value = (event.question as Question) ?? null;
        questionIndex.value = event.index;
        questionTimer.value = event.timer ?? 30;
        lastResult.value = null;
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
        break;

      case 'error':
        error.value = event.message;
        break;
    }
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
  }

  function resetMultiGame() {
    isGameStarted.value = false;
    currentQuestion.value = null;
    questionIndex.value = 0;
    lastResult.value = null;
    finalScores.value = null;
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
    createRoom,
    joinRoom,
    configureGame,
    startGame,
    submitAnswer,
    leaveRoom,
    resetMultiGame,
  };
});
