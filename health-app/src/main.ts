import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  const config = new DocumentBuilder()
    .setTitle('Xoma App API')
    .setDescription(
      'API REST del backend de la aplicación de salud mental Xoma. ' +
        'Incluye autenticación JWT, gestión de usuarios, diarios emocionales, ' +
        'evaluaciones EMA con predicción de riesgo por ML, habilidades y contactos de emergencia.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
  Logger.log(
    `Swagger disponible en http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}

bootstrap().catch((err) => Logger.error(err));
