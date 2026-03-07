import { Module } from '@nestjs/common';
import { QuestionsModule } from './modules/questions/questions.module';
import { GameModule } from './modules/game/game.module';
import { RoomsModule } from './modules/rooms/rooms.module';

@Module({
  imports: [QuestionsModule, GameModule, RoomsModule],
})
export class AppModule {}
