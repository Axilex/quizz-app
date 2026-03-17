import { Controller, Get, Post, Query, Body, BadRequestException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { GameScoringService } from '../game/game-scoring.service';
import type { Difficulty } from '../../common/types';

@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly scoringService: GameScoringService,
  ) {}

  @Get()
  getQuestions(
    @Query('difficulties') difficulties?: string,
    @Query('categories') categories?: string,
    @Query('count') count?: string,
  ) {
    const filter = {
      difficulties: difficulties?.split(',') as Difficulty[] | undefined,
      categories: categories?.split(','),
    };

    if (count) {
      const questions = this.questionsService.getRandom(parseInt(count, 10), filter);
      return questions.map((q) => this.questionsService.toPublic(q));
    }

    const questions = this.questionsService.getFiltered(filter);
    return questions.map((q) => this.questionsService.toPublic(q));
  }

  /**
   * GET /questions/game?count=20&categories=sport,cinéma
   *
   * Returns a randomized set of N questions for starting a game.
   * All data is ready-to-display — the frontend does ZERO transformation.
   */
  @Get('game')
  getGameQuestions(@Query('count') count?: string, @Query('categories') categories?: string) {
    const questionCount = count ? parseInt(count, 10) : 20;
    if (isNaN(questionCount) || questionCount < 1 || questionCount > 200) {
      throw new BadRequestException('count must be between 1 and 200');
    }

    const filter = {
      difficulties: ['easy', 'medium', 'hard'] as Difficulty[],
      categories: categories ? categories.split(',').filter(Boolean) : undefined,
    };

    const questions = this.questionsService.getRandom(questionCount, filter);

    if (questions.length === 0) {
      throw new BadRequestException('No questions available for the given filters');
    }

    return {
      questions: questions.map((q) => this.questionsService.toPublic(q)),
      total: questions.length,
      availableTotal: this.questionsService.getFiltered(filter).length,
    };
  }

  /**
   * POST /questions/validate
   * Body: { id: string, answer: string }
   *
   * Server-side answer validation.
   * This is the SINGLE source of truth for correctness.
   */
  @Post('validate')
  validateAnswer(@Body() body: { id: string; answer: string }) {
    const { id: questionId, answer } = body;
    if (!questionId || answer === undefined) {
      throw new BadRequestException('id and answer are required');
    }

    const question = this.questionsService.getById(questionId);
    if (!question) {
      throw new BadRequestException('Question not found');
    }

    // GeoClickMap: distance-based scoring, always "correct"
    if (question.type === 'geoClickMap') {
      const [userLat, userLng] = answer.split(',').map(Number);
      const targetLat = question['targetLat'] as number;
      const targetLng = question['targetLng'] as number;

      if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
        return {
          questionId,
          isCorrect: true,
          correctAnswer: question['targetName'] as string,
          explanation: question.explanation,
          geoPoints: 0,
          distanceKm: 99999,
        };
      }

      const { points, distanceKm } = this.scoringService.computeGeoScore(
        userLat!,
        userLng!,
        targetLat,
        targetLng,
        question.difficulty,
      );

      return {
        questionId,
        isCorrect: true,
        correctAnswer: question['targetName'] as string,
        explanation: question.explanation,
        geoPoints: points,
        distanceKm,
      };
    }

    const isCorrect = this.questionsService.validateAnswer(question, answer);

    return {
      questionId,
      isCorrect,
      correctAnswer: this.questionsService.getReadableAnswer(question),
      explanation: question.explanation,
    };
  }

  @Get('categories')
  getCategories() {
    return this.questionsService.getCategories();
  }
}
