import { Injectable } from '@nestjs/common';
import type { Question, Difficulty, QuestionType, QuestionPublic } from '../../common/types';

import textQuestions from '../../data/questions_text.json';
import numberQuestions from '../../data/questions_number.json';
import qcmQuestions from '../../data/questions_qcm.json';
import rebusQuestions from '../../data/questions_rebus.json';
import fourImagesQuestions from '../../data/questions_four_images.json';
import chronologyQuestions from '../../data/questions_chronology.json';
import blindTestQuestions from '../../data/questions_blind_test.json';
import geoQuestions from '../../data/questions_geo.json';
import intruderQuestions from '../../data/questions_intruder.json';
import silhouetteQuestions from '../../data/questions_silhouette.json';

interface QuestionFilter {
  difficulties?: Difficulty[];
  categories?: string[];
  types?: QuestionType[];
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ');
}

@Injectable()
export class QuestionsService {
  private questions: Question[];

  constructor() {
    this.questions = [
      ...(textQuestions as Question[]),
      ...(numberQuestions as Question[]),
      ...(qcmQuestions as Question[]),
      ...(rebusQuestions as Question[]),
      ...(fourImagesQuestions as Question[]),
      ...(chronologyQuestions as Question[]),
      ...(blindTestQuestions as Question[]),
      ...(geoQuestions as Question[]),
      ...(intruderQuestions as Question[]),
      ...(silhouetteQuestions as Question[]),
    ];
  }

  getAll(): Question[] {
    return this.questions;
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
    return result;
  }

  getRandom(count: number, filter?: QuestionFilter): Question[] {
    const pool = filter ? this.getFiltered(filter) : [...this.questions];
    const shuffled = this.shuffle(pool);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  getCategories(): Array<{ id: string; count: number }> {
    const map = new Map<string, number>();
    for (const q of this.questions) {
      map.set(q.category, (map.get(q.category) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  /** Validate a user's answer against the expected answer */
  validateAnswer(question: Question, userAnswer: string): boolean {
    const normalizedUser = normalize(userAnswer);
    if (!normalizedUser) return false;

    // Number: numeric comparison
    if (question.type === 'number') {
      const cleanUser = userAnswer.replace(/\s/g, '').replace(',', '.');
      const cleanExpected = question.answer.replace(/\s/g, '').replace(',', '.');
      const userNum = parseFloat(cleanUser);
      const expectedNum = parseFloat(cleanExpected);
      if (!isNaN(userNum) && !isNaN(expectedNum)) {
        const tolerance = (question['tolerance'] as number) ?? 0;
        if (Math.abs(userNum - expectedNum) <= tolerance) return true;
      }
    }

    // Chronology: compare ordered ids
    if (question.type === 'chronology') {
      const userIds = userAnswer.split(',').map((s) => s.trim());
      const expectedIds = question.answer.split(',').map((s) => s.trim());
      if (userIds.length !== expectedIds.length) return false;
      return userIds.every((id, i) => id === expectedIds[i]);
    }

    // Intruder: check intruder id or label
    if (question.type === 'intruder') {
      const intruderId = question['intruderId'] as string;
      if (userAnswer === intruderId) return true;
      const options = (question['options'] as Array<{ id: string; label: string }>) ?? [];
      const intruderOption = options.find((o) => o.id === intruderId);
      if (intruderOption && normalize(intruderOption.label) === normalizedUser) return true;
    }

    // Text comparison (all types)
    if (normalize(question.answer) === normalizedUser) return true;
    if (question.acceptedAnswers.some((a) => normalize(a) === normalizedUser)) return true;

    return false;
  }

  /**
   * Strip answer data and prepare a question for the frontend.
   * The returned object is ready-to-display: all URLs are direct, no keys to resolve.
   *
   * CRITICAL: This is the only transformation point.
   * The frontend receives this and displays it as-is.
   */
  toPublic(question: Question): QuestionPublic {
    const base: QuestionPublic = {
      id: question.id,
      type: question.type,
      difficulty: question.difficulty,
      category: question.category,
      label: question.label,
      media: question.media,
      tags: question.tags,
      baseTimer: question.baseTimer,
    };

    // Add type-specific fields (WITHOUT answers)
    switch (question.type) {
      case 'qcm':
        base.options = question['options'] as QuestionPublic['options'];
        break;

      case 'rebus':
        base.clues = question['clues'] as QuestionPublic['clues'];
        break;

      case 'fourImages':
        base.images = question['images'] as QuestionPublic['images'];
        if (question['hint']) base.hint = question['hint'] as string;
        break;

      case 'chronology':
        base.items = question['items'] as QuestionPublic['items'];
        break;

      case 'blindTest':
        base.imageUrl = question['imageUrl'] as string;
        break;

      case 'geoMap':
        base.region = question['region'] as string;
        base.outlineUrl = (question['outlineUrl'] as string) ?? null;
        base.outlineSvgPath = (question['outlineSvgPath'] as string) ?? null;
        break;

      case 'intruder':
        // Send options but NEVER the intruderId (that's the answer)
        base.options = question['options'] as QuestionPublic['options'];
        break;

      case 'silhouette':
        base.imageUrl = question['imageUrl'] as string;
        break;
    }

    return base;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  }
}
