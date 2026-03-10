// Question domain types
// All data comes ready-to-display from the backend.
// The frontend NEVER transforms, resolves keys, or generates media.

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

// --- Media: always a ready-to-use URL from the backend ---

export interface QuestionMedia {
  type: 'image';
  url: string;
  alt?: string;
}

// --- Base question (common fields for all types) ---

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  category: string;
  label: string;
  tags: string[];
  baseTimer: number;
  media: QuestionMedia | null;
}

// --- Concrete question types ---

/** Simple text question */
export interface TextQuestion extends BaseQuestion {
  type: 'text';
}

/** Numeric answer question */
export interface NumberQuestion extends BaseQuestion {
  type: 'number';
}

/** Image-based question — the image is in `media` */
export interface ImageQuestion extends BaseQuestion {
  type: 'image';
  media: QuestionMedia;
}

/** Multiple choice question */
export interface QcmOption {
  id: string;
  label: string;
}

export interface QcmQuestion extends BaseQuestion {
  type: 'qcm';
  options: QcmOption[];
}

/** Rebus: multiple image clues to combine into a word */
export interface RebusClue {
  imageUrl: string;
  alt: string;
}

export interface RebusQuestion extends BaseQuestion {
  type: 'rebus';
  clues: RebusClue[];
}

/** 4 Images 1 Word */
export interface FourImagesItem {
  imageUrl: string;
  alt: string;
}

export interface FourImagesQuestion extends BaseQuestion {
  type: 'fourImages';
  images: FourImagesItem[];
  hint?: string;
}

/** Chronological ordering */
export interface ChronologyItem {
  id: string;
  label: string;
  imageUrl?: string;
}

export interface ChronologyQuestion extends BaseQuestion {
  type: 'chronology';
  items: ChronologyItem[];
}

/** Blind test: image progressively revealed (unblurred over time) */
export interface BlindTestQuestion extends BaseQuestion {
  type: 'blindTest';
  imageUrl: string;
}

/** Geography: identify a country/place from its outline */
export interface GeoMapQuestion extends BaseQuestion {
  type: 'geoMap';
  region: string;
  outlineUrl?: string;
  outlineSvgPath?: string;
}

/** Intruder: find the odd one out */
export interface IntruderOption {
  id: string;
  imageUrl: string;
  label: string;
}

export interface IntruderQuestion extends BaseQuestion {
  type: 'intruder';
  options: IntruderOption[];
}

/** Silhouette: identify a shape shown as a dark silhouette */
export interface SilhouetteQuestion extends BaseQuestion {
  type: 'silhouette';
  imageUrl: string | null;
  /** Inline SVG path data for the silhouette shape */
  svgShape?: string | null;
  /** Progressive context hints shown during countdown */
  contextHints?: string[];
}

/** SplitImage: top half of image A + bottom half of image B → guess portmanteau */
export interface SplitImageHalf {
  imageUrl: string;
  alt: string;
}

export interface SplitImageQuestion extends BaseQuestion {
  type: 'splitImage';
  topHalf: SplitImageHalf;
  bottomHalf: SplitImageHalf;
  /** Optional hint shown after half the timer */
  hint?: string;
}

/** MathMax: arrange tokens (numbers + operators) to get the largest possible result */
export interface MathTile {
  id: string;
  value: string; // '5', '+', '×', '-', etc.
  tileType: 'number' | 'operator';
}

export interface MathMaxQuestion extends BaseQuestion {
  type: 'mathMax';
  tiles: MathTile[];
}

/** MathSimple: randomly generated arithmetic — solve the expression */
export interface MathSimpleQuestion extends BaseQuestion {
  type: 'mathSimple';
  expression: string; // e.g. "3 × 8 + 5"
}

// --- Discriminated union ---

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
  | SilhouetteQuestion
  | SplitImageQuestion
  | MathMaxQuestion
  | MathSimpleQuestion;

// --- Display helpers (pure UI labels, no logic) ---

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
  splitImage: 'Image Coupée',
  mathMax: 'Math Max',
  mathSimple: 'Calcul',
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
  splitImage: '✂️',
  mathMax: '🏆',
  mathSimple: '🧮',
};
