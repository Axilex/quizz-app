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

export type MultiplayerEvent =
  | { type: 'player:joined'; player: Player }
  | { type: 'player:left'; playerId: string }
  | { type: 'player:reconnected'; playerId: string }
  | { type: 'game:started'; questions: string[] }
  | { type: 'game:question'; index: number; question?: unknown; timer?: number }
  | { type: 'player:answered'; playerId: string; isCorrect: boolean }
  | { type: 'game:answerResult'; questionId: string; isCorrect: boolean; correctAnswer: string; explanation?: string; timedOut?: boolean }
  | { type: 'game:timeout'; questionId: string }
  | { type: 'game:configured'; config: unknown }
  | { type: 'game:finished'; scores: Record<string, unknown> }
  | { type: 'error'; message: string };

export interface MultiplayerGateway {
  connect(): Promise<void>;
  disconnect(): void;
  createRoom(playerName: string): Promise<Room>;
  joinRoom(code: string, playerName: string): Promise<Room>;
  leaveRoom(): void;
  startGame(): void;
  submitAnswer(questionId: string, answer: string, timeSpent?: number): void;
  onEvent(handler: (event: MultiplayerEvent) => void): () => void;
  readonly isConnected: boolean;
}
