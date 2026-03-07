import type { AnswerResult, GameConfig, GameSession, Question } from '@/types';
import { DIFFICULTY_POINTS } from '@/types';
import { questionRepository } from '@/services/questions/QuestionRepository';
import { scoreService } from './ScoreService';
import { TimerService } from './TimerService';

function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class GameEngineService {
  /** Build a new game session from config */
  createSession(config: GameConfig): GameSession {
    const questions = questionRepository.getRandom(config.questionCount, {
      difficulties: config.difficulties,
      categories: config.categories,
    });

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

  /** Build a replay session from wrong answers */
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

  /** Get the current question */
  getCurrentQuestion(session: GameSession): Question | null {
    return session.questions[session.currentIndex] ?? null;
  }

  /** Compute timer duration for current question */
  getTimerDuration(question: Question): number {
    return TimerService.computeDuration(question.difficulty, question.type, question.baseTimer);
  }

  /** Record an answer and advance */
  submitAnswer(
    session: GameSession,
    userAnswer: string,
    timeSpent: number,
    timedOut: boolean,
  ): AnswerResult {
    const question = this.getCurrentQuestion(session);
    if (!question) throw new Error('No current question');

    const isCorrect = !timedOut && scoreService.validateAnswer(question, userAnswer);
    const points = isCorrect ? (DIFFICULTY_POINTS[question.difficulty] ?? 1) : 0;

    const result: AnswerResult = {
      questionId: question.id,
      question,
      userAnswer,
      isCorrect,
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

  /** Get wrong answers from a session */
  getWrongAnswers(session: GameSession): AnswerResult[] {
    return session.answers.filter((a) => !a.isCorrect);
  }

  /** Check if session is finished */
  isFinished(session: GameSession): boolean {
    return session.currentIndex >= session.questions.length;
  }
}

export const gameEngine = new GameEngineService();
