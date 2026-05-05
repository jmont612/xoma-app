import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const origin = process.env.DOMAIN_URL || 'http://localhost:5173';
  app.enableCors({
    origin,
    credentials: false,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => Logger.error(err));
