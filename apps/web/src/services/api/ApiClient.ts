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
}

export interface CategoryInfo {
  id: string;
  count: number;
}

/**
 * HTTP client for the Quizzy API.
 * All question data and validation logic lives server-side.
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

  /** Server-side answer validation */
  async validateAnswer(questionId: string, answer: string): Promise<ValidateAnswerResponse> {
    const params = new URLSearchParams({ id: questionId, answer });
    const res = await fetch(`${this.baseUrl}/questions/validate?${params}`);
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
