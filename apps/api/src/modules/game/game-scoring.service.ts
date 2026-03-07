import { Injectable } from '@nestjs/common';
import type { Question } from '../../common/types';

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
export class GameScoringService {
  validateAnswer(question: Question, userAnswer: string): boolean {
    const normalizedUser = normalize(userAnswer);
    if (!normalizedUser) return false;

    // Number: numeric comparison first
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

    // Text comparison (all other types)
    if (normalize(question.answer) === normalizedUser) return true;
    if (question.acceptedAnswers.some((a) => normalize(a) === normalizedUser)) return true;

    return false;
  }

  computeTimer(question: Question): number {
    if (question.baseTimer > 0) return question.baseTimer;
    const diffTimers: Record<string, number> = { easy: 15, medium: 25, hard: 35 };
    const typeMods: Record<string, number> = {
      text: 0,
      number: 5,
      image: 8,
      qcm: 0,
      rebus: 10,
      fourImages: 8,
      chronology: 15,
      blindTest: 12,
      geoMap: 10,
      intruder: 5,
      silhouette: 8,
    };
    return (diffTimers[question.difficulty] ?? 25) + (typeMods[question.type] ?? 0);
  }
}
