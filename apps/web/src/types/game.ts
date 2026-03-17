import type { Difficulty, Question, QuestionType } from './question';

export type GameMode = 'solo' | 'multi';
export type GamePhase = 'idle' | 'setup' | 'lobby' | 'playing' | 'review' | 'results' | 'replay';

export interface TypeRatio {
  type: QuestionType;
  weight: number;
}

export interface GameConfig {
  mode: GameMode;
  questionCount: number;
  difficulties: Difficulty[];
  categories?: string[];
  typeRatios?: TypeRatio[];
  debug?: boolean;
}

export interface AnswerResult {
  questionId: string;
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  points: number;
  timeSpent: number;
  timedOut: boolean;
}

export interface GameSession {
  id: string;
  config: GameConfig;
  questions: Question[];
  answers: AnswerResult[];
  currentIndex: number;
  score: number;
  startedAt: number;
  finishedAt: number | null;
  phase: GamePhase;
}

export interface TimerConfig {
  difficulty: Difficulty;
  questionType: QuestionType;
  baseTimer: number;
}

export const DIFFICULTY_TIMERS: Record<Difficulty, number> = {
  easy: 15,
  medium: 25,
  hard: 35,
};

/** Speed-based max points per difficulty */
export const MAX_POINTS: Record<Difficulty, number> = {
  easy: 500,
  medium: 750,
  hard: 1000,
};

/** Minimum ratio of max points when answering at last second */
export const MIN_POINTS_RATIO = 0.3;

/** Flash round bonus points */
export const FLASH_POINTS = 1500;

export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  easy: 500,
  medium: 750,
  hard: 1000,
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
  geoClickMap: 15,
  intruder: 5,
  silhouette: 8,
  splitImage: 12,
  mathMax: 20,
  mathSimple: 5,
};
