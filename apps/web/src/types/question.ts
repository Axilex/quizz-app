// Question domain types

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

export interface QuestionMedia {
  type: 'image' | 'svg';
  src: string;
  alt?: string;
}

export interface BaseQuestion {
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
}

// --- Classic types ---

export interface TextQuestion extends BaseQuestion {
  type: 'text';
}

export interface NumberQuestion extends BaseQuestion {
  type: 'number';
  tolerance?: number;
}

export interface ImageQuestion extends BaseQuestion {
  type: 'image';
  media: QuestionMedia;
}

export interface QcmOption {
  id: string;
  label: string;
}

export interface QcmQuestion extends BaseQuestion {
  type: 'qcm';
  options: QcmOption[];
}

// --- New visual types ---

export interface RebusClue {
  svg: string;
  alt: string;
}

export interface RebusQuestion extends BaseQuestion {
  type: 'rebus';
  clues: RebusClue[];
}

export interface FourImagesQuestion extends BaseQuestion {
  type: 'fourImages';
  images: Array<{ svg: string; alt: string }>;
  hint?: string;
}

export interface ChronologyItem {
  id: string;
  label: string;
  svg?: string;
  year?: number;
}

export interface ChronologyQuestion extends BaseQuestion {
  type: 'chronology';
  items: ChronologyItem[];
}

export interface BlindTestQuestion extends BaseQuestion {
  type: 'blindTest';
  svg: string;
  revealSteps: number;
}

export interface GeoMapQuestion extends BaseQuestion {
  type: 'geoMap';
  targetLat: number;
  targetLng: number;
  toleranceKm: number;
  region: string;
  outlineSvg?: string;
}

export interface IntruderOption {
  id: string;
  svg: string;
  label: string;
}

export interface IntruderQuestion extends BaseQuestion {
  type: 'intruder';
  options: IntruderOption[];
  intruderId: string;
}

export interface SilhouetteQuestion extends BaseQuestion {
  type: 'silhouette';
  svg: string;
  revealSvg?: string;
}

export type Question =
  | TextQuestion
  | NumberQuestion
  | ImageQuestion
  | QcmQuestion
  | RebusQuestion
  | FourImagesQuestion
  | ChronologyQuestion
  | BlindTestQuestion
  | GeoMapQuestion
  | IntruderQuestion
  | SilhouetteQuestion;

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: 'Texte',
  number: 'Nombre',
  image: 'Image',
  qcm: 'QCM',
  rebus: 'Rébus',
  fourImages: '4 Images 1 Mot',
  chronology: 'Ordre chrono',
  blindTest: 'Blind Test',
  geoMap: 'Carte Géo',
  intruder: 'Intrus',
  silhouette: 'Silhouette',
};

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  text: '📝',
  number: '🔢',
  image: '🖼️',
  qcm: '☑️',
  rebus: '🧩',
  fourImages: '🔲',
  chronology: '📅',
  blindTest: '🔍',
  geoMap: '🗺️',
  intruder: '👀',
  silhouette: '🌑',
};
