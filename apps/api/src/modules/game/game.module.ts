import { Module } from '@nestjs/common';
import { GameScoringService } from './game-scoring.service';

@Module({
  providers: [GameScoringService],
  exports: [GameScoringService],
})
export class GameModule {}
