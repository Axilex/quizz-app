import type { Difficulty, Question, QuestionType } from '@/types';
import { apiClient } from '@/services/api/ApiClient';

export interface QuestionFilter {
  difficulties?: Difficulty[];
  categories?: string[];
  types?: QuestionType[];
  tags?: string[];
  excludeIds?: string[];
}

export interface CategoryInfo {
  id: string;
  label: string;
  count: number;
  icon: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  géographie: '🌍',
  sciences: '🔬',
  histoire: '📜',
  culture: '🎭',
  sport: '⚽',
  cinéma: '🎬',
  musique: '🎵',
  littérature: '📚',
  gastronomie: '🍽️',
  technologie: '💻',
  nature: '🌿',
};

export interface QuestionRepository {
  fetchGameQuestions(count: number, categories?: string[]): Promise<Question[]>;
  fetchCategories(): Promise<CategoryInfo[]>;
}

/**
 * Question repository — all data comes from the API.
 * No local JSON files. The backend is the single source of truth.
 */
export class LocalQuestionRepository implements QuestionRepository {
  private categoriesCache: CategoryInfo[] | null = null;

  /**
   * Fetch questions from the API for a new game session.
   */
  async fetchGameQuestions(count: number, categories?: string[]): Promise<Question[]> {
    const response = await apiClient.getGameQuestions(count, categories);
    return response.questions;
  }

  /** Fetch categories from the API (cached after first call) */
  async fetchCategories(): Promise<CategoryInfo[]> {
    if (this.categoriesCache) return this.categoriesCache;

    const cats = await apiClient.getCategories();
    this.categoriesCache = cats.map((c) => ({
      id: c.id,
      label: c.id.charAt(0).toUpperCase() + c.id.slice(1),
      count: c.count,
      icon: CATEGORY_ICONS[c.id] ?? '📋',
    }));
    return this.categoriesCache;
  }
}

export const questionRepository = new LocalQuestionRepository();
