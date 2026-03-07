import type {
  MultiplayerEvent,
  MultiplayerGateway,
  Player,
  Room,
  QuestionReviewData,
  PlayerAnswer,
  Difficulty,
} from '@/types';
import { DIFFICULTY_POINTS } from '@/types';
import { allQuestions } from '@/data';

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function createMockPlayer(name: string, isHost: boolean): Player {
  return {
    id: `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    score: 0,
    status: 'connected',
    isHost,
  };
}

const AUTO_VALIDATED_TYPES = new Set(['number', 'qcm', 'chronology', 'intruder']);

/**
 * Mock implementation — simulates multiplayer behavior locally.
 */
export class MockMultiplayerGateway implements MultiplayerGateway {
  private _isConnected = false;
  private _room: Room | null = null;
  private listeners: Set<(event: MultiplayerEvent) => void> = new Set();
  readonly isMockMode = true;
  playerId: string | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(): Promise<void> {
    await new Promise((r) => setTimeout(r, 300));
    this._isConnected = true;
  }

  disconnect(): void {
    this._isConnected = false;
    this._room = null;
  }

  async createRoom(playerName: string): Promise<Room> {
    const host = createMockPlayer(playerName, true);
    this.playerId = host.id;
    this._room = {
      id: `room_${Date.now()}`,
      code: generateCode(),
      hostId: host.id,
      players: [host],
      maxPlayers: 8,
      isStarted: false,
      createdAt: Date.now(),
    };

    setTimeout(() => {
      if (!this._room) return;
      const bot1 = createMockPlayer('Alice', false);
      this._room.players.push(bot1);
      this.emit({ type: 'player:joined', player: bot1 });
    }, 1500);

    setTimeout(() => {
      if (!this._room) return;
      const bot2 = createMockPlayer('Bob', false);
      this._room.players.push(bot2);
      this.emit({ type: 'player:joined', player: bot2 });
    }, 3000);

    return this._room;
  }

  async joinRoom(code: string, playerName: string): Promise<Room> {
    const player = createMockPlayer(playerName, false);
    const host = createMockPlayer('Host', true);
    this.playerId = player.id;
    this._room = {
      id: `room_${Date.now()}`,
      code,
      hostId: host.id,
      players: [host, player],
      maxPlayers: 8,
      isStarted: false,
      createdAt: Date.now(),
    };
    return this._room;
  }

  leaveRoom(): void {
    this._room = null;
  }

  startGame(): void {
    if (!this._room) return;
    this._room.isStarted = true;
    this.emit({ type: 'game:started', questions: [] });

    const players = [...this._room.players];
    const questionPool = allQuestions.slice(0, 5);

    let questionIdx = 0;

    const sendQuestion = () => {
      if (questionIdx >= questionPool.length) {
        const review = this.buildReviewData(questionPool, players);
        const scores: Record<string, { name: string; score: number }> = {};
        for (const p of players) {
          const points = review.reduce((sum, q, qi) => {
            const pa = q.playerAnswers.find((a) => a.playerId === p.id);
            if (!pa?.isCorrect) return sum;
            const difficulty = (questionPool[qi]?.difficulty ?? 'easy') as Difficulty;
            return sum + (DIFFICULTY_POINTS[difficulty] ?? 1);
          }, 0);
          scores[p.id] = { name: p.name, score: points };
        }

        setTimeout(() => {
          this.emit({ type: 'game:finished', scores, review });
        }, 500);
        return;
      }

      const q = questionPool[questionIdx]!;
      this.emit({
        type: 'game:question',
        index: questionIdx,
        question: q,
        timer: q.baseTimer,
      });

      setTimeout(() => {
        const isCorrect = Math.random() > 0.35;
        this.emit({
          type: 'game:answerResult',
          questionId: q.id,
          isCorrect,
          correctAnswer: q.answer,
          explanation: q.explanation,
        });

        questionIdx++;
        setTimeout(sendQuestion, 1800);
      }, 2500);
    };

    setTimeout(sendQuestion, 1000);
  }

  private buildReviewData(questions: typeof allQuestions, players: Player[]): QuestionReviewData[] {
    return questions.map((q) => {
      const autoValidated = AUTO_VALIDATED_TYPES.has(q.type);

      const playerAnswers: PlayerAnswer[] = players.map((p) => {
        const correct = Math.random() > 0.35;
        const timedOut = !correct && Math.random() < 0.15;
        let answer: string;
        if (timedOut) {
          answer = '';
        } else if (correct) {
          answer = q.acceptedAnswers[0] ?? q.answer;
        } else {
          const wrongOptions = [
            'Aucune idée',
            'Paris',
            '42',
            'Napoléon',
            q.answer.slice(0, 3) + '...',
          ];
          answer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)]!;
        }

        return {
          playerId: p.id,
          playerName: p.name,
          answer,
          isCorrect: correct,
          timeSpent: Math.floor(Math.random() * q.baseTimer * 800 + 1000),
          timedOut,
          hostOverride: null,
        };
      });

      return {
        questionId: q.id,
        questionLabel: q.label,
        questionType: q.type,
        correctAnswer: q.answer,
        explanation: q.explanation,
        playerAnswers,
        autoValidated,
      };
    });
  }

  submitAnswer(_questionId: string, _answer: string): void {
    this.emit({
      type: 'player:answered',
      playerId: this._room?.players[0]?.id ?? '',
      isCorrect: Math.random() > 0.3,
    });
  }

  onEvent(handler: (event: MultiplayerEvent) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  private emit(event: MultiplayerEvent): void {
    this.listeners.forEach((fn) => fn(event));
  }
}

export const multiplayerGateway = new MockMultiplayerGateway();
