import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalQuestionRepository } from '@/services/questions/QuestionRepository';

// Mock the ApiClient
vi.mock('@/services/api/ApiClient', () => ({
  apiClient: {
    getGameQuestions: vi.fn().mockResolvedValue({
      questions: [
        {
          id: 'txt_001',
          type: 'text',
          difficulty: 'easy',
          category: 'géographie',
          label: 'Test?',
          answer: 'Test',
          acceptedAnswers: ['Test'],
          media: null,
          tags: ['test'],
          baseTimer: 15,
        },
        {
          id: 'txt_002',
          type: 'text',
          difficulty: 'medium',
          category: 'histoire',
          label: 'Test2?',
          answer: 'Test2',
          acceptedAnswers: ['Test2'],
          media: null,
          tags: ['test'],
          baseTimer: 20,
        },
      ],
      total: 2,
      availableTotal: 100,
    }),
    getCategories: vi.fn().mockResolvedValue([
      { id: 'géographie', count: 25 },
      { id: 'histoire', count: 14 },
      { id: 'sciences', count: 27 },
    ]),
  },
}));

describe('LocalQuestionRepository', () => {
  let repo: LocalQuestionRepository;

  beforeEach(() => {
    repo = new LocalQuestionRepository();
  });

  it('fetches game questions from API', async () => {
    const questions = await repo.fetchGameQuestions(20);
    expect(questions.length).toBe(2);
    expect(questions[0]!.id).toBe('txt_001');
  });

  it('fetches categories from API', async () => {
    const cats = await repo.fetchCategories();
    expect(cats.length).toBe(3);
    expect(cats[0]!.id).toBe('géographie');
    expect(cats[0]!.icon).toBe('🌍');
    expect(cats[0]!.label).toBe('Géographie');
  });

  it('caches categories after first call', async () => {
    const cats1 = await repo.fetchCategories();
    const cats2 = await repo.fetchCategories();
    expect(cats1).toBe(cats2); // Same reference = cached
  });
});
