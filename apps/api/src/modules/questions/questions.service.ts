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
import imagesQuestions from '../../data/questions_image.json';
import splitImageQuestions from '../../data/questions_splitimage.json';
import mathMaxQuestions from '../../data/questions_math_max.json';
import geoClickQuestions from '../../data/questions_geo_click.json';

interface QuestionFilter {
  difficulties?: Difficulty[];
  categories?: string[];
  types?: QuestionType[];
}

/** Generate random arithmetic questions dynamically */
function generateMathSimpleQuestions(count: number): Question[] {
  const ops = ['+', '-', '×'] as const;
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)]!;
    let a: number, b: number, answer: number;

    if (op === '+') {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 50) + 25;
      b = Math.floor(Math.random() * 25) + 1;
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
    }

    const difficulty: Difficulty = answer > 50 ? 'hard' : answer > 20 ? 'medium' : 'easy';
    const opSymbol = op === '×' ? '×' : op;

    questions.push({
      id: `math_simple_gen_${Date.now()}_${i}`,
      type: 'mathSimple' as QuestionType,
      difficulty,
      category: 'mathématiques',
      label: 'Calculez mentalement :',
      answer: String(answer),
      acceptedAnswers: [String(answer)],
      media: null,
      explanation: `${a} ${opSymbol} ${b} = ${answer}`,
      tags: ['mathématiques', 'calcul'],
      baseTimer: 20,
      expression: `${a} ${opSymbol} ${b}`,
    });
  }

  return questions;
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
  private mathSimplePool: Question[] = [];

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
      ...(imagesQuestions as Question[]),
      ...(splitImageQuestions as Question[]),
      ...(mathMaxQuestions as Question[]),
      ...(geoClickQuestions as Question[]),
    ];
    // Generate a pool of math simple questions
    this.mathSimplePool = generateMathSimpleQuestions(50);
  }

  getAll(): Question[] {
    return this.questions;
  }

  getById(id: string): Question | undefined {
    return this.questions.find((q) => q.id === id) ?? this.mathSimplePool.find((q) => q.id === id);
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
    // Combine static questions with a fresh batch of mathSimple
    const mathSimpleCount = Math.min(10, Math.ceil(count / 5));
    const freshMathSimple = generateMathSimpleQuestions(mathSimpleCount);
    const allQuestions = [...this.questions, ...freshMathSimple];

    const pool = filter
      ? [
          ...this.getFiltered(filter),
          ...(!filter.types || filter.types.includes('mathSimple' as QuestionType)
            ? freshMathSimple
            : []),
        ]
      : allQuestions;

    // Group questions by type
    const byType = new Map<string, Question[]>();
    for (const q of pool) {
      const group = byType.get(q.type) ?? [];
      group.push(q);
      byType.set(q.type, group);
    }

    const types = [...byType.keys()];
    if (types.length === 0) return [];

    // Rare types (< 20 questions): always take all; then fill from large pools
    const RARE_THRESHOLD = 20;
    const rareTypes = types.filter((t) => (byType.get(t)?.length ?? 0) < RARE_THRESHOLD);
    const commonTypes = types.filter((t) => (byType.get(t)?.length ?? 0) >= RARE_THRESHOLD);

    const selected: Question[] = [];

    // Step 1 — pick all rare-type questions (shuffled), up to count
    for (const type of rareTypes) {
      const shuffled = this.shuffle(byType.get(type)!);
      selected.push(...shuffled);
    }

    // Step 2 — fill remaining slots from common types proportionally
    const remaining = count - selected.length;
    if (remaining > 0 && commonTypes.length > 0) {
      // Equal share per common type
      const perType = Math.ceil(remaining / commonTypes.length);
      for (const type of commonTypes) {
        const shuffled = this.shuffle(byType.get(type)!);
        selected.push(...shuffled.slice(0, perType));
      }
    }

    // Step 3 — final shuffle and slice to exact count
    return this.shuffle(selected).slice(0, Math.min(count, selected.length));
  }

  getOnePerType(): Question[] {
    const byType = new Map<string, Question[]>();
    for (const q of this.questions) {
      const group = byType.get(q.type) ?? [];
      group.push(q);
      byType.set(q.type, group);
    }

    const selected: Question[] = [];
    for (const [, questions] of byType) {
      const idx = Math.floor(Math.random() * questions.length);
      selected.push(questions[idx]!);
    }

    // Add one mathSimple
    const mathSimple = generateMathSimpleQuestions(1);
    selected.push(...mathSimple);

    return this.shuffle(selected);
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

  getRandomMathSimple(count: number): Question[] {
    if (count <= 0) return [];
    // Regenerate fresh math questions each time for variety
    return generateMathSimpleQuestions(count);
  }

  shufflePublic(questions: Question[]): Question[] {
    return this.shuffle(questions);
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

  getReadableAnswer(question: Question): string {
    if (question.type === 'chronology') {
      const items = (question as Record<string, unknown>)['items'] as
        | { id: string; label: string }[]
        | undefined;
      if (items) {
        const orderedIds = question.answer.split(',').map((s) => s.trim());
        return orderedIds
          .map((id) => items.find((item) => item.id === id)?.label ?? id)
          .join(' → ');
      }
    }
    return question.answer;
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
        base.outlineSvg = (question['outlineSvg'] as string) ?? null;
        break;

      case 'intruder':
        // Send options but NEVER the intruderId (that's the answer)
        base.options = question['options'] as QuestionPublic['options'];
        break;

      case 'silhouette':
        base.imageUrl = (question['imageUrl'] as string) ?? null;
        base.svgShape = (question['svgShape'] as string) ?? null;
        base.contextHints = (question['contextHints'] as string[]) ?? [];
        break;

      case 'splitImage':
        base.topHalf = question['topHalf'] as QuestionPublic['topHalf'];
        base.bottomHalf = question['bottomHalf'] as QuestionPublic['bottomHalf'];
        if (question['hint']) base.hint = question['hint'] as string;
        break;

      case 'geoClickMap':
        // Never send targetLat/targetLng to clients — only a hint
        base.geoHint = (question['geoHint'] as string) ?? '';
        base.targetName = question['targetName'] as string;
        break;

      case 'mathMax':
        base.tiles = question['tiles'] as QuestionPublic['tiles'];
        break;

      case 'mathSimple':
        base.expression = question['expression'] as string;
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
