import type { Difficulty, Question, QuestionType } from './question';

export type GameMode = 'solo' | 'multi';
export type GamePhase = 'idle' | 'setup' | 'lobby' | 'playing' | 'review' | 'results' | 'replay';

export interface GameConfig {
  mode: GameMode;
  questionCount: number;
  difficulties: Difficulty[];
  categories?: string[];
}

export interface AnswerResult {
  questionId: string;
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
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
