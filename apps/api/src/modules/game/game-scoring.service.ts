import { Injectable } from '@nestjs/common';
import type { Question, Difficulty } from '../../common/types';
import { MAX_POINTS, FLASH_POINTS } from '../../common/types';

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ');
}

/** Haversine distance in km between two lat/lng points */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

    // GeoClickMap: answer is "lat,lng" — compare distance
    if (question.type === 'geoClickMap') {
      const [userLat, userLng] = userAnswer.split(',').map(Number);
      const targetLat = question['targetLat'] as number;
      const targetLng = question['targetLng'] as number;
      const toleranceKm = (question['toleranceKm'] as number) ?? 500;
      if (!Number.isNaN(userLat) && !Number.isNaN(userLng)) {
        const dist = haversineKm(
          userLat as unknown as number,
          userLng as unknown as number,
          targetLat,
          targetLng,
        );
        return dist <= toleranceKm;
      }
      return false;
    }

    // Text comparison (all other types)
    if (normalize(question.answer) === normalizedUser) return true;
    if (question.acceptedAnswers.some((a) => normalize(a) === normalizedUser)) return true;

    return false;
  }

  /**
   * Compute speed-based points.
   * @param isCorrect Whether the answer is correct
   * @param timeSpentMs Time spent answering in ms
   * @param totalTimerMs Total allowed time in ms
   * @param difficulty Question difficulty
   * @param isFlash If true, use flash scoring (1500 pts, winner-takes-all handled externally)
   */
  computePoints(
    isCorrect: boolean,
    timeSpentMs: number,
    totalTimerMs: number,
    difficulty: Difficulty,
    isFlash: boolean = false,
  ): number {
    if (!isCorrect) return 0;

    if (isFlash) return FLASH_POINTS;

    const maxPts = MAX_POINTS[difficulty];
    const ratio = totalTimerMs > 0 ? Math.max(0, 1 - timeSpentMs / totalTimerMs) : 0;
    // Linear from maxPts (instant) to 30% of maxPts (last second)
    const points = Math.round(maxPts * (0.3 + 0.7 * ratio));
    return Math.max(Math.round(maxPts * 0.3), points);
  }

  /**
   * For geoClickMap: compute distance-based points
   * Max points if < 100km, linearly decreasing to 0 at 5000km
   */
  computeGeoPoints(
    userLat: number,
    userLng: number,
    targetLat: number,
    targetLng: number,
    difficulty: Difficulty,
  ): number {
    const dist = haversineKm(userLat, userLng, targetLat, targetLng);
    const maxPts = MAX_POINTS[difficulty];
    const maxDist = 5000;
    const ratio = Math.max(0, 1 - dist / maxDist);
    return Math.round(maxPts * ratio);
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
      geoClickMap: 15,
      intruder: 5,
      silhouette: 8,
    };
    return (diffTimers[question.difficulty] ?? 25) + (typeMods[question.type] ?? 0);
  }

  /** Timer for flash round — always short */
  getFlashTimer(): number {
    return 7;
  }
}
