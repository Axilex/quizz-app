import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`[KCulture API] Running on http://localhost:${port}`);
}

bootstrap();
