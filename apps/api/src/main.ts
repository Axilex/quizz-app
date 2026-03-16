import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ThrottleGuard } from './common/guard/throttle.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — accept configured origins or localhost in dev
  const allowedOrigins = process.env['CORS_ORIGINS']
    ? process.env['CORS_ORIGINS'].split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:4173'];

  const throttleGuard = app.get(ThrottleGuard);
  app.useGlobalGuards(throttleGuard);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  Logger.log(`[Quizzy API] Running on port ${port}`);
  Logger.log(`[Quizzy API] CORS origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();
