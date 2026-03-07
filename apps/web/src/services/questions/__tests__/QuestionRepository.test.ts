import { describe, it, expect } from 'vitest';
import { LocalQuestionRepository } from '@/services/questions/QuestionRepository';

describe('LocalQuestionRepository', () => {
  const repo = new LocalQuestionRepository();

  it('loads questions from all files', () => {
    const all = repo.getAll();
    expect(all.length).toBeGreaterThan(30);
  });

  it('finds by id', () => {
    expect(repo.getById('txt_001')).toBeDefined();
    expect(repo.getById('num_001')).toBeDefined();
    expect(repo.getById('reb_001')).toBeDefined();
    expect(repo.getById('fi_001')).toBeDefined();
    expect(repo.getById('chr_001')).toBeDefined();
    expect(repo.getById('blt_001')).toBeDefined();
    expect(repo.getById('geo_001')).toBeDefined();
    expect(repo.getById('int_001')).toBeDefined();
    expect(repo.getById('sil_001')).toBeDefined();
  });

  it('filters by difficulty', () => {
    const easy = repo.getFiltered({ difficulties: ['easy'] });
    expect(easy.every((q) => q.difficulty === 'easy')).toBe(true);
    expect(easy.length).toBeGreaterThan(0);
  });

  it('filters by category', () => {
    const geo = repo.getFiltered({ categories: ['géographie'] });
    expect(geo.every((q) => q.category === 'géographie')).toBe(true);
  });

  it('filters by type', () => {
    const rebus = repo.getFiltered({ types: ['rebus'] });
    expect(rebus.every((q) => q.type === 'rebus')).toBe(true);
    expect(rebus.length).toBeGreaterThan(0);
  });

  it('returns categories with counts', () => {
    const cats = repo.getCategories();
    expect(cats.length).toBeGreaterThanOrEqual(4);
    const geo = cats.find((c) => c.id === 'géographie');
    expect(geo).toBeDefined();
    expect(geo!.count).toBeGreaterThan(0);
    expect(geo!.icon).toBe('🌍');
  });

  it('returns available types', () => {
    const types = repo.getTypes();
    expect(types).toContain('text');
    expect(types).toContain('rebus');
    expect(types).toContain('chronology');
    expect(types).toContain('intruder');
  });

  it('returns random questions respecting count', () => {
    const random = repo.getRandom(5);
    expect(random.length).toBe(5);
  });

  it('combines filters', () => {
    const result = repo.getFiltered({
      difficulties: ['easy'],
      categories: ['culture'],
    });
    expect(result.every((q) => q.difficulty === 'easy' && q.category === 'culture')).toBe(true);
  });
});
