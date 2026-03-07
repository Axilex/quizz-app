import type { Question, IntruderQuestion } from '@/types';

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ');
}

export class ScoreService {
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
        const tolerance = question.tolerance ?? 0;
        if (Math.abs(userNum - expectedNum) <= tolerance) return true;
      }
    }

    // Chronology: compare ordered id lists
    if (question.type === 'chronology') {
      const userIds = userAnswer.split(',').map((s) => s.trim());
      const expectedIds = question.answer.split(',').map((s) => s.trim());
      if (userIds.length !== expectedIds.length) return false;
      return userIds.every((id, i) => id === expectedIds[i]);
    }

    // Intruder: check if picked the correct intruder id or label
    if (question.type === 'intruder') {
      const intQ = question as IntruderQuestion;
      if (userAnswer === intQ.intruderId) return true;
      const intruderOption = intQ.options.find((o) => o.id === intQ.intruderId);
      if (intruderOption && normalize(intruderOption.label) === normalizedUser) return true;
    }

    // Text comparison (works for text, image, qcm, rebus, fourImages, blindTest, geoMap, silhouette)
    if (normalize(question.answer) === normalizedUser) return true;
    if (question.acceptedAnswers.some((a) => normalize(a) === normalizedUser)) return true;

    return false;
  }

  calculatePercentage(correct: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }

  getGrade(percentage: number): { label: string; emoji: string } {
    if (percentage >= 90) return { label: 'Exceptionnel', emoji: '🏆' };
    if (percentage >= 75) return { label: 'Excellent', emoji: '⭐' };
    if (percentage >= 60) return { label: 'Très bien', emoji: '👏' };
    if (percentage >= 40) return { label: 'Bien', emoji: '👍' };
    if (percentage >= 20) return { label: 'Peut mieux faire', emoji: '📚' };
    return { label: 'À retravailler', emoji: '💪' };
  }

  averageTime(times: number[]): number {
    if (!times.length) return 0;
    const sum = times.reduce((a, b) => a + b, 0);
    return Math.round(sum / times.length / 100) / 10;
  }
}

export const scoreService = new ScoreService();
