import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { QuestionsModule } from '../questions/questions.module';
import { GameModule } from '../game/game.module';

@Module({
  imports: [QuestionsModule, GameModule],
  providers: [RoomsService, RoomsGateway],
})
export class RoomsModule {}
