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

/**
 * Full question (server-side only).
 * Contains answer, explanation, and all secret data.
 */
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
  [key: string]: unknown; // allow type-specific fields
}

/**
 * Question sent to clients (no answer, no explanation, no intruderId).
 * All media URLs are ready-to-display — the frontend does ZERO transformation.
 */
export interface QuestionPublic {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  category: string;
  label: string;
  media: QuestionMedia | null;
  tags: string[];
  baseTimer: number;

  // Type-specific public fields (all with direct URLs)
  options?: Array<{ id: string; label: string } | { id: string; imageUrl: string; label: string }>;
  clues?: Array<{ imageUrl: string; alt: string }>;
  images?: Array<{ imageUrl: string; alt: string }>;
  hint?: string;
  items?: Array<{ id: string; label: string; imageUrl?: string }>;
  imageUrl?: string;
  // silhouette
  svgShape?: string | null;
  contextHints?: string[];
  region?: string;
  outlineUrl?: string | null;
  outlineSvgPath?: string | null;
  outlineSvg?: string | null; // country key for frontend path lookup
  // splitImage
  topHalf?: { imageUrl: string; alt: string };
  bottomHalf?: { imageUrl: string; alt: string };
  // mathMax
  tiles?: Array<{ id: string; value: string; tileType: 'number' | 'operator' }>;
  // mathSimple
  expression?: string;
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
  splitImage: 12,
  mathMax: 20,
  mathSimple: 5,
};
