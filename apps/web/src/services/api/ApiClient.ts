import type { Question } from '@/types';

/** Base URL for the Quizzy API — configure via env or fallback */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface GameQuestionsResponse {
  questions: Question[];
  total: number;
  availableTotal: number;
}

export interface ValidateAnswerResponse {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  /** GeoClickMap only: distance-based points */
  geoPoints?: number;
  /** GeoClickMap only: distance in km from target */
  distanceKm?: number;
}

export interface CategoryInfo {
  id: string;
  count: number;
}

/**
 * HTTP client for the Quizzy API.
 * The backend is the single source of truth for:
 * - All question data (including media URLs, ready to display)
 * - Answer validation
 * - Categories
 *
 * The frontend NEVER validates answers locally or transforms question data.
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /** Fetch a set of random questions to start a game */
  async getGameQuestions(count: number, categories?: string[]): Promise<GameQuestionsResponse> {
    const params = new URLSearchParams({ count: String(count) });
    if (categories?.length) {
      params.set('categories', categories.join(','));
    }
    const res = await fetch(`${this.baseUrl}/questions/game?${params}`);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  /**
   * Server-side answer validation.
   * This is the ONLY place answers are validated. No local validation.
   */
  async validateAnswer(questionId: string, answer: string): Promise<ValidateAnswerResponse> {
    const res = await fetch(`${this.baseUrl}/questions/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: questionId, answer }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  /** Fetch available categories with question counts */
  async getCategories(): Promise<CategoryInfo[]> {
    const res = await fetch(`${this.baseUrl}/questions/categories`);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  }
}

export const apiClient = new ApiClient();
