import { describe, it, expect } from 'vitest';
import { ScoreService } from '@/services/game/ScoreService';
import type { TextQuestion, NumberQuestion, ChronologyQuestion, IntruderQuestion } from '@/types';

const scoreService = new ScoreService();

function textQuestion(overrides: Partial<TextQuestion> = {}): TextQuestion {
  return {
    id: 'q_test',
    type: 'text',
    difficulty: 'easy',
    category: 'test',
    label: 'Test?',
    answer: 'Correct',
    acceptedAnswers: ['Correct', 'Also Correct'],
    media: null,
    tags: [],
    baseTimer: 15,
    ...overrides,
  };
}

function numberQuestion(overrides: Partial<NumberQuestion> = {}): NumberQuestion {
  return {
    id: 'q_num',
    type: 'number',
    difficulty: 'medium',
    category: 'test',
    label: 'Number?',
    answer: '42',
    acceptedAnswers: ['42'],
    media: null,
    tags: [],
    baseTimer: 20,
    tolerance: 2,
    ...overrides,
  };
}

function chronologyQuestion(): ChronologyQuestion {
  return {
    id: 'q_chr',
    type: 'chronology',
    difficulty: 'medium',
    category: 'test',
    label: 'Order these:',
    answer: 'a,b,c',
    acceptedAnswers: ['a,b,c'],
    media: null,
    tags: [],
    baseTimer: 40,
    items: [
      { id: 'a', label: 'First', year: 100 },
      { id: 'b', label: 'Second', year: 200 },
      { id: 'c', label: 'Third', year: 300 },
    ],
  };
}

function intruderQuestion(): IntruderQuestion {
  return {
    id: 'q_int',
    type: 'intruder',
    difficulty: 'easy',
    category: 'test',
    label: 'Find intruder:',
    answer: 'Intruder',
    acceptedAnswers: ['Intruder'],
    media: null,
    tags: [],
    baseTimer: 20,
    intruderId: 'opt_c',
    options: [
      { id: 'opt_a', svg: 'a', label: 'Normal A' },
      { id: 'opt_b', svg: 'b', label: 'Normal B' },
      { id: 'opt_c', svg: 'c', label: 'Intruder' },
      { id: 'opt_d', svg: 'd', label: 'Normal D' },
    ],
  };
}

describe('ScoreService', () => {
  describe('text validation', () => {
    it('matches exact', () =>
      expect(scoreService.validateAnswer(textQuestion(), 'Correct')).toBe(true));
    it('case-insensitive', () =>
      expect(scoreService.validateAnswer(textQuestion(), 'correct')).toBe(true));
    it('accepted alternatives', () =>
      expect(scoreService.validateAnswer(textQuestion(), 'Also Correct')).toBe(true));
    it('rejects wrong', () =>
      expect(scoreService.validateAnswer(textQuestion(), 'Wrong')).toBe(false));
    it('rejects empty', () => expect(scoreService.validateAnswer(textQuestion(), '')).toBe(false));
    it('strips accents', () => {
      const q = textQuestion({ answer: 'Océan', acceptedAnswers: ['Océan'] });
      expect(scoreService.validateAnswer(q, 'Ocean')).toBe(true);
    });
  });

  describe('number validation', () => {
    it('tolerance match', () => {
      expect(scoreService.validateAnswer(numberQuestion(), '43')).toBe(true);
      expect(scoreService.validateAnswer(numberQuestion(), '45')).toBe(false);
    });
    it('exact match', () => {
      const q = numberQuestion({ tolerance: 0 });
      expect(scoreService.validateAnswer(q, '42')).toBe(true);
      expect(scoreService.validateAnswer(q, '43')).toBe(false);
    });
    it('spaces in numbers', () => {
      const q = numberQuestion({ answer: '300000', acceptedAnswers: ['300000'], tolerance: 1000 });
      expect(scoreService.validateAnswer(q, '300 000')).toBe(true);
    });
    it('french comma', () => {
      const q = numberQuestion({ answer: '3.14', acceptedAnswers: ['3.14'], tolerance: 0.01 });
      expect(scoreService.validateAnswer(q, '3,14')).toBe(true);
    });
  });

  describe('chronology validation', () => {
    it('correct order', () => {
      expect(scoreService.validateAnswer(chronologyQuestion(), 'a,b,c')).toBe(true);
    });
    it('wrong order', () => {
      expect(scoreService.validateAnswer(chronologyQuestion(), 'b,a,c')).toBe(false);
    });
    it('missing items', () => {
      expect(scoreService.validateAnswer(chronologyQuestion(), 'a,b')).toBe(false);
    });
  });

  describe('intruder validation', () => {
    it('correct intruder by id', () => {
      expect(scoreService.validateAnswer(intruderQuestion(), 'opt_c')).toBe(true);
    });
    it('correct intruder by label', () => {
      expect(scoreService.validateAnswer(intruderQuestion(), 'Intruder')).toBe(true);
    });
    it('wrong selection', () => {
      expect(scoreService.validateAnswer(intruderQuestion(), 'opt_a')).toBe(false);
    });
  });

  describe('grades', () => {
    it('returns correct grades', () => {
      expect(scoreService.getGrade(95).label).toBe('Exceptionnel');
      expect(scoreService.getGrade(45).label).toBe('Bien');
      expect(scoreService.getGrade(10).label).toBe('À retravailler');
    });
  });
});
