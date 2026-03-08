export type PlayerStatus = 'connected' | 'disconnected' | 'answering' | 'waiting' | 'finished';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  status: PlayerStatus;
  isHost: boolean;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  isStarted: boolean;
  createdAt: number;
}

export interface PlayerAnswer {
  playerId: string;
  playerName: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  timedOut: boolean;
  hostOverride: boolean | null;
}

export interface QuestionReviewData {
  questionId: string;
  questionLabel: string;
  questionType: string;
  correctAnswer: string;
  explanation?: string;
  playerAnswers: PlayerAnswer[];
  autoValidated: boolean;
}

export type ReviewViewMode = 'podium' | 'review';

export type MultiplayerEvent =
  | { type: 'player:joined'; player: Player }
  | { type: 'player:left'; playerId: string }
  | { type: 'player:reconnected'; playerId: string }
  | { type: 'game:started'; questions: string[] }
  | { type: 'game:question'; index: number; question?: unknown; timer?: number }
  | { type: 'player:answered'; playerId: string; isCorrect: boolean }
  | {
      type: 'game:answerResult';
      questionId: string;
      isCorrect: boolean;
      correctAnswer: string;
      explanation?: string;
      timedOut?: boolean;
    }
  | { type: 'game:timeout'; questionId: string }
  | { type: 'game:configured'; config: unknown }
  | {
      type: 'game:finished';
      scores: Record<string, unknown>;
      review?: QuestionReviewData[];
    }
  | {
      type: 'game:reviewUpdated';
      review: QuestionReviewData[];
      scores: Record<string, unknown>;
    }
  | {
      type: 'review:navigated';
      view: ReviewViewMode;
      questionIdx: number;
    }
  | { type: 'error'; message: string };

export interface MultiplayerGateway {
  connect(): Promise<void>;
  disconnect(): void;
  createRoom(playerName: string): Promise<Room>;
  joinRoom(code: string, playerName: string): Promise<Room>;
  leaveRoom(): void;
  configureGame(config: {
    questionCount: number;
    difficulties: string[];
    categories?: string[];
  }): void;
  startGame(): void;
  submitAnswer(questionId: string, answer: string, timeSpent?: number): void;
  hostOverride(playerId: string, questionId: string, isCorrect: boolean): void;
  reviewNavigate(view: ReviewViewMode, questionIdx: number): void;
  onEvent(handler: (event: MultiplayerEvent) => void): () => void;
  readonly isConnected: boolean;
  readonly playerId: string | null;
}
