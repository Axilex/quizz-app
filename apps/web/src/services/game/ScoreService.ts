/**
 * ScoreService — Display-only score utilities.
 *
 * Answer validation is handled EXCLUSIVELY by the backend API.
 * This service only computes display values: percentages, grades, averages.
 */
export class ScoreService {
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
