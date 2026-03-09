import type { AnswerResult, GameConfig, GameSession, Question } from '@/types';
import { DIFFICULTY_POINTS } from '@/types';
import { questionRepository } from '@/services/questions/QuestionRepository';
import { apiClient } from '@/services/api/ApiClient';
import { TimerService } from './TimerService';

function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class GameEngineService {
  /**
   * Build a new game session — fetches questions from the API.
   * Questions arrive ready-to-display, no transformation needed.
   */
  async createSession(config: GameConfig): Promise<GameSession> {
    const questions = await questionRepository.fetchGameQuestions(
      config.questionCount,
      config.categories,
    );

    return {
      id: generateId(),
      config,
      questions,
      answers: [],
      currentIndex: 0,
      score: 0,
      startedAt: Date.now(),
      finishedAt: null,
      phase: 'playing',
    };
  }

  /** Build a replay session from wrong answers (no API needed — questions already loaded) */
  createReplaySession(config: GameConfig, wrongQuestions: Question[]): GameSession {
    return {
      id: generateId(),
      config: { ...config, questionCount: wrongQuestions.length },
      questions: wrongQuestions,
      answers: [],
      currentIndex: 0,
      score: 0,
      startedAt: Date.now(),
      finishedAt: null,
      phase: 'replay',
    };
  }

  getCurrentQuestion(session: GameSession): Question | null {
    return session.questions[session.currentIndex] ?? null;
  }

  getTimerDuration(question: Question): number {
    return TimerService.computeDuration(question.difficulty, question.type, question.baseTimer);
  }

  /**
   * Submit an answer — validates via the backend API.
   * Returns a promise because validation is async.
   */
  async submitAnswer(
    session: GameSession,
    userAnswer: string,
    timeSpent: number,
    timedOut: boolean,
  ): Promise<AnswerResult> {
    const question = this.getCurrentQuestion(session);
    if (!question) throw new Error('No current question');

    let isCorrect = false;
    let correctAnswer = '';
    let explanation: string | undefined;

    if (timedOut) {
      // On timeout, ask the API for the correct answer
      try {
        const validation = await apiClient.validateAnswer(question.id, '');
        correctAnswer = validation.correctAnswer;
        explanation = validation.explanation;
      } catch {
        correctAnswer = '?';
      }
    } else {
      // Validate via API
      const validation = await apiClient.validateAnswer(question.id, userAnswer);
      isCorrect = validation.isCorrect;
      correctAnswer = validation.correctAnswer;
      explanation = validation.explanation;
    }

    const points = isCorrect ? (DIFFICULTY_POINTS[question.difficulty] ?? 1) : 0;

    const result: AnswerResult = {
      questionId: question.id,
      question,
      userAnswer,
      isCorrect,
      correctAnswer,
      explanation,
      points,
      timeSpent,
      timedOut,
    };

    session.answers.push(result);
    if (isCorrect) session.score += points;
    session.currentIndex++;

    if (session.currentIndex >= session.questions.length) {
      session.finishedAt = Date.now();
      session.phase = 'results';
    }

    return result;
  }

  getWrongAnswers(session: GameSession): AnswerResult[] {
    return session.answers.filter((a) => !a.isCorrect);
  }

  isFinished(session: GameSession): boolean {
    return session.currentIndex >= session.questions.length;
  }
}

export const gameEngine = new GameEngineService();
