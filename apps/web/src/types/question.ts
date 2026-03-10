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

export interface TextQuestion extends BaseQuestion {
  type: 'text';
}
export interface NumberQuestion extends BaseQuestion {
  type: 'number';
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

export interface RebusClue {
  imageUrl: string;
  alt: string;
}
export interface RebusQuestion extends BaseQuestion {
  type: 'rebus';
  clues: RebusClue[];
}

export interface FourImagesItem {
  imageUrl: string;
  alt: string;
}
export interface FourImagesQuestion extends BaseQuestion {
  type: 'fourImages';
  images: FourImagesItem[];
  hint?: string;
}

export interface ChronologyItem {
  id: string;
  label: string;
  imageUrl?: string;
}
export interface ChronologyQuestion extends BaseQuestion {
  type: 'chronology';
  items: ChronologyItem[];
}

export interface BlindTestQuestion extends BaseQuestion {
  type: 'blindTest';
  imageUrl: string;
}

export interface GeoMapQuestion extends BaseQuestion {
  type: 'geoMap';
  region: string;
  outlineUrl?: string;
  outlineSvgPath?: string;
}

/** GeoClickMap: player clicks on a world map to locate a place */
export interface GeoClickMapQuestion extends BaseQuestion {
  type: 'geoClickMap';
  targetName: string;
  geoHint?: string;
}

export interface IntruderOption {
  id: string;
  imageUrl: string;
  label: string;
}
export interface IntruderQuestion extends BaseQuestion {
  type: 'intruder';
  options: IntruderOption[];
}

export interface SilhouetteQuestion extends BaseQuestion {
  type: 'silhouette';
  imageUrl: string | null;
  svgShape?: string | null;
  contextHints?: string[];
}

export interface SplitImageHalf {
  imageUrl: string;
  alt: string;
}
export interface SplitImageQuestion extends BaseQuestion {
  type: 'splitImage';
  topHalf: SplitImageHalf;
  bottomHalf: SplitImageHalf;
  hint?: string;
}

export interface MathTile {
  id: string;
  value: string;
  tileType: 'number' | 'operator';
}
export interface MathMaxQuestion extends BaseQuestion {
  type: 'mathMax';
  tiles: MathTile[];
}

export interface MathSimpleQuestion extends BaseQuestion {
  type: 'mathSimple';
  expression: string;
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
  | GeoClickMapQuestion
  | IntruderQuestion
  | SilhouetteQuestion
  | SplitImageQuestion
  | MathMaxQuestion
  | MathSimpleQuestion;

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
  geoClickMap: '📍 Géo Click',
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
  geoClickMap: '📍',
  intruder: '👀',
  silhouette: '🌑',
  splitImage: '✂️',
  mathMax: '🏆',
  mathSimple: '🧮',
};
