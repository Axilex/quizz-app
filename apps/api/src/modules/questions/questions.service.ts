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
    return [...map.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => a.id.localeCompare(b.id));
  }

  /** Strip answer data from question for sending to clients */
  toPublic(question: Question): QuestionPublic {
    const { answer, acceptedAnswers, explanation, ...rest } = question;
    // Also strip intruderId from intruder questions
    const pub = { ...rest } as QuestionPublic & { intruderId?: string };
    delete pub.intruderId;
    return pub as QuestionPublic;
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
