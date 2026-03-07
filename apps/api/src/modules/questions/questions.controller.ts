import { Controller, Get, Query } from '@nestjs/common';
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

  @Get('categories')
  getCategories() {
    return this.questionsService.getCategories();
  }
}
