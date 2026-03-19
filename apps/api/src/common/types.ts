// Shared types — keep in sync with @quizzos/web types

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
  | 'geoClickMap'
  | 'intruder'
  | 'silhouette'
  | 'splitImage'
  | 'mathMax'
  | 'mathSimple';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuestionMedia {
  type: 'image';
  url: string;
  alt?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  category: string;
  label: string;
  answer: string;
  acceptedAnswers: string[];
  media: QuestionMedia | null;
  explanation?: string;
  tags: string[];
  baseTimer: number;
  [key: string]: unknown;
}

export interface QuestionPublic {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  category: string;
  label: string;
  media: QuestionMedia | null;
  tags: string[];
  baseTimer: number;

  // Type-specific public fields
  options?: Array<{ id: string; label: string } | { id: string; imageUrl: string; label: string }>;
  clues?: Array<{ imageUrl: string; alt: string }>;
  images?: Array<{ imageUrl: string; alt: string }>;
  hint?: string;
  items?: Array<{ id: string; label: string; imageUrl?: string }>;
  imageUrl?: string;
  svgShape?: string | null;
  contextHints?: string[];
  region?: string;
  outlineUrl?: string | null;
  outlineSvgPath?: string | null;
  outlineSvg?: string | null;
  topHalf?: { imageUrl: string; alt: string };
  bottomHalf?: { imageUrl: string; alt: string };
  tiles?: Array<{ id: string; value: string; tileType: 'number' | 'operator' | 'parenthesis' }>;
  expression?: string;
  // geoClickMap: only public region hint, never coordinates
  geoHint?: string;
  targetName?: string;
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
  powerUpsLeft: number;
  /** When true, next correct answer scores double points */
  doubleNextAnswer: boolean;
}

export interface AnswerRecord {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  timedOut: boolean;
  points: number;
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
  /** Flash round state */
  flashWinner: string | null;
  isFlashQuestion: boolean;
  /** Flash round indices (set at game start) */
  flashIndices: Set<number>;
}

export interface GameConfig {
  questionCount: number;
  difficulties: Difficulty[];
  categories?: string[];
  debug?: boolean;
}

export type PowerUpType =
  | 'malus_blur'
  | 'malus_freeze'
  | 'malus_speed'
  | 'bonus_fifty50'
  | 'bonus_double'
  | 'bonus_time';

export const POWERUPS_PER_GAME = 3;

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
  geoClickMap: 15,
  intruder: 5,
  silhouette: 8,
  splitImage: 12,
  mathMax: 20,
  mathSimple: 5,
};

/** Max speed-based points per difficulty */
export const MAX_POINTS: Record<Difficulty, number> = {
  easy: 500,
  medium: 750,
  hard: 1000,
};

/** Flash round bonus points (first correct answer wins this) */
export const FLASH_POINTS = 1500;
