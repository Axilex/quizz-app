import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { GameModule } from '../game/game.module';

@Module({
  imports: [GameModule],
  providers: [QuestionsService],
  controllers: [QuestionsController],
  exports: [QuestionsService],
})
export class QuestionsModule {}
