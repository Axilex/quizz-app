// Shared types — keep in sync with @quizzos/web types
// In future: extract to a shared @quizzos/types package

export type QuestionType =
  | 'text'
  | 'number'
  | 'image'
  | 'qcm'
  | 'rebus'
  | 'fourImages'
  | 'chronology'
  | 'blindTest'
  | 'geoMap'
  | 'intruder'
  | 'silhouette';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  category: string;
  label: string;
  answer: string;
  acceptedAnswers: string[];
  media: { type: string; src: string; alt?: string } | null;
  explanation?: string;
  tags: string[];
  baseTimer: number;
  [key: string]: unknown; // allow type-specific fields
}

/** Question sent to clients (no answer) */
export interface QuestionPublic {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  category: string;
  label: string;
  media: Question['media'];
  tags: string[];
  baseTimer: number;
  // Type-specific public fields
  options?: unknown[];
  clues?: unknown[];
  images?: unknown[];
  items?: unknown[];
  svg?: string;
  revealSteps?: number;
  region?: string;
  outlineSvg?: string;
  intruderId?: never; // never expose intruder answer
}

export type PlayerStatus = 'connected' | 'disconnected' | 'answering' | 'waiting' | 'finished';

export interface Player {
  id: string;
  socketId: string;
  name: string;
  score: number;
  status: PlayerStatus;
  isHost: boolean;
  answers: AnswerRecord[];
}

export interface AnswerRecord {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  timedOut: boolean;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: Map<string, Player>;
  config: GameConfig | null;
  currentQuestionIndex: number;
  questions: Question[];
  isStarted: boolean;
  createdAt: number;
}

export interface GameConfig {
  questionCount: number;
  difficulties: Difficulty[];
  categories?: string[];
}

export const DIFFICULTY_TIMERS: Record<Difficulty, number> = {
  easy: 15,
  medium: 25,
  hard: 35,
};

export const TYPE_MODIFIERS: Record<QuestionType, number> = {
  text: 0,
  number: 5,
  image: 8,
  qcm: 0,
  rebus: 10,
  fourImages: 8,
  chronology: 15,
  blindTest: 12,
  geoMap: 10,
  intruder: 5,
  silhouette: 8,
};
