import type { Difficulty, Question, QuestionType } from '@/types';
import { allQuestions } from '@/data';

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
};

export interface QuestionRepository {
  getAll(): Question[];
  getById(id: string): Question | undefined;
  getFiltered(filter: QuestionFilter): Question[];
  getRandom(count: number, filter?: QuestionFilter): Question[];
  getCategories(): CategoryInfo[];
  getTypes(): QuestionType[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export class LocalQuestionRepository implements QuestionRepository {
  private questions: Question[];

  constructor() {
    this.questions = allQuestions;
  }

  getAll(): Question[] {
    return [...this.questions];
  }

  getById(id: string): Question | undefined {
    return this.questions.find((q) => q.id === id);
  }

  getFiltered(filter: QuestionFilter): Question[] {
    let result = [...this.questions];

    if (filter.difficulties?.length) {
      result = result.filter((q) => filter.difficulties!.includes(q.difficulty));
    }
    if (filter.categories?.length) {
      result = result.filter((q) => filter.categories!.includes(q.category));
    }
    if (filter.types?.length) {
      result = result.filter((q) => filter.types!.includes(q.type));
    }
    if (filter.tags?.length) {
      result = result.filter((q) => q.tags.some((t) => filter.tags!.includes(t)));
    }
    if (filter.excludeIds?.length) {
      result = result.filter((q) => !filter.excludeIds!.includes(q.id));
    }

    return result;
  }

  getRandom(count: number, filter?: QuestionFilter): Question[] {
    const pool = filter ? this.getFiltered(filter) : [...this.questions];
    const shuffled = shuffle(pool);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  getCategories(): CategoryInfo[] {
    const catMap = new Map<string, number>();
    for (const q of this.questions) {
      catMap.set(q.category, (catMap.get(q.category) ?? 0) + 1);
    }
    return [...catMap.entries()]
      .map(([id, count]) => ({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1),
        count,
        icon: CATEGORY_ICONS[id] ?? '📋',
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  getTypes(): QuestionType[] {
    const types = new Set(this.questions.map((q) => q.type));
    return [...types];
  }
}

export const questionRepository = new LocalQuestionRepository();
