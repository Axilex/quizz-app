import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import type { Difficulty } from '../../common/types';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

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
   * Always includes all difficulty levels.
   * Optionally filtered by categories.
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
   * GET /questions/validate?id=txt_001&answer=Pacifique
   *
   * Server-side answer validation.
   */
  @Get('validate')
  validateAnswer(@Query('id') questionId: string, @Query('answer') answer: string) {
    if (!questionId || answer === undefined) {
      throw new BadRequestException('id and answer are required');
    }

    const question = this.questionsService.getById(questionId);
    if (!question) {
      throw new BadRequestException('Question not found');
    }

    const isCorrect = this.questionsService.validateAnswer(question, answer);

    return {
      questionId,
      isCorrect,
      correctAnswer: question.answer,
      explanation: question.explanation,
    };
  }

  @Get('categories')
  getCategories() {
    return this.questionsService.getCategories();
  }
}
