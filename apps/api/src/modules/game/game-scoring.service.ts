import { Injectable, Logger } from '@nestjs/common';
import type { Question, Difficulty, QuestionType } from '../../common/types';
import { MAX_POINTS, FLASH_POINTS } from '../../common/types';

/**
 * Normalize string for comparison (accents, case, spaces)
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/['']/g, "'") // Normalize quotes
    .replace(/\s+/g, ' '); // Normalize spaces
}

/**
 * Haversine distance in km between two lat/lng points
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Sanitize user input to prevent XSS/injection
 */
function sanitizeInput(input: string): string {
  // Remove HTML tags and dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove remaining < >
    .trim()
    .slice(0, 500); // Max length
}

interface ServerTimeValidation {
  isValid: boolean;
  serverTimeMs: number;
  discrepancyMs: number;
  isSuspicious: boolean;
}

@Injectable()
export class GameScoringService {
  private readonly logger = new Logger(GameScoringService.name);

  /**
   * 🔒 CRITICAL: Validate answer with server-side timestamp verification
   */
  validateAnswerSecure(
    question: Question,
    userAnswer: string,
    clientTimeSpentMs: number,
    questionStartedAt: number, // Server timestamp when question was sent
    answerReceivedAt: number, // Server timestamp when answer received
  ): {
    isCorrect: boolean;
    points: number;
    serverTimeSpent: number;
    timeValidation: ServerTimeValidation;
    sanitizedAnswer: string;
  } {
    // 1. Sanitize input first
    const sanitized = sanitizeInput(userAnswer);

    // 2. Validate server time
    const timeValidation = this.validateServerTime(
      questionStartedAt,
      answerReceivedAt,
      clientTimeSpentMs,
      question,
    );

    if (!timeValidation.isValid) {
      this.logger.warn(
        `Invalid time for question ${question.id}: server=${timeValidation.serverTimeMs}ms, client=${clientTimeSpentMs}ms`,
      );
      return {
        isCorrect: false,
        points: 0,
        serverTimeSpent: timeValidation.serverTimeMs,
        timeValidation,
        sanitizedAnswer: sanitized,
      };
    }

    // 3. Log suspicious behavior
    if (timeValidation.isSuspicious) {
      this.logger.warn(
        `Suspicious time discrepancy: ${timeValidation.discrepancyMs}ms for question ${question.id}`,
      );
    }

    // 4. Validate answer correctness
    const isCorrect = this.validateAnswer(question, sanitized);

    // 5. Compute points using SERVER time only
    const points = this.computePoints(
      isCorrect,
      timeValidation.serverTimeMs,
      this.computeTimer(question) * 1000, // Convert to ms
      question.difficulty,
      false,
    );

    return {
      isCorrect,
      points,
      serverTimeSpent: timeValidation.serverTimeMs,
      timeValidation,
      sanitizedAnswer: sanitized,
    };
  }

  /**
   * 🔒 Validate server-side timestamps
   */
  private validateServerTime(
    questionStartedAt: number,
    answerReceivedAt: number,
    clientTimeSpentMs: number,
    question: Question,
  ): ServerTimeValidation {
    const serverTimeMs = answerReceivedAt - questionStartedAt;
    const maxAllowedMs = this.computeTimer(question) * 1000 + 2000; // +2s grace period
    const discrepancyMs = Math.abs(serverTimeMs - clientTimeSpentMs);

    return {
      isValid: serverTimeMs >= 0 && serverTimeMs <= maxAllowedMs,
      serverTimeMs: Math.max(0, serverTimeMs),
      discrepancyMs,
      isSuspicious: discrepancyMs > 1000, // >1s difference is suspicious
    };
  }

  /**
   * Validate answer correctness (unchanged logic)
   */
  validateAnswer(question: Question, userAnswer: string): boolean {
    const normalizedUser = normalize(userAnswer);
    if (!normalizedUser) return false;

    // Number: numeric comparison with tolerance
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
      const toleranceKm = this.getGeoToleranceKm(
        question.difficulty,
        question['targetType'] as string,
      );

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
    if (question.acceptedAnswers?.some((a) => normalize(a) === normalizedUser)) return true;

    return false;
  }

  /**
   * 🆕 Dynamic geo tolerance based on difficulty and target type
   */
  private getGeoToleranceKm(difficulty: Difficulty, targetType?: string): number {
    const BASE_TOLERANCE = {
      city: { easy: 100, medium: 50, hard: 25 },
      country: { easy: 500, medium: 300, hard: 150 },
      landmark: { easy: 50, medium: 25, hard: 10 },
      default: { easy: 200, medium: 100, hard: 50 },
    };

    const type = (targetType as keyof typeof BASE_TOLERANCE) || 'default';
    return BASE_TOLERANCE[type]?.[difficulty] ?? BASE_TOLERANCE.default[difficulty];
  }

  /**
   * Compute speed-based points (server time only)
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

  /**
   * Compute timer duration for a question
   */
  computeTimer(question: Question): number {
    if (question.baseTimer > 0) return question.baseTimer;

    const diffTimers: Record<Difficulty, number> = { easy: 15, medium: 25, hard: 35 };
    const typeMods: Record<QuestionType, number> = {
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
      splitImage: 12,
      mathMax: 20,
      mathSimple: 5,
    };

    return (diffTimers[question.difficulty] ?? 25) + (typeMods[question.type] ?? 0);
  }

  /**
   * Timer for flash round
   */
  getFlashTimer(): number {
    return 7;
  }
}
