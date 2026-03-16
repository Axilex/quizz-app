import { Module } from '@nestjs/common';
import { QuestionsModule } from './modules/questions/questions.module';
import { GameModule } from './modules/game/game.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { ThrottleGuard } from './common/guard/throttle.guard';

@Module({
  imports: [QuestionsModule, GameModule, RoomsModule],
  providers: [ThrottleGuard],
})
export class AppModule {}
