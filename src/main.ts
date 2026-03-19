import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('HIFZPRO API')
    .setDescription('Auth, Users, Products & Orders API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ✅ Start server
  await app.listen(process.env.PORT ?? 3001);

  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3002}`);
  console.log(`📘 Swagger docs available at /api/docs`);
}

bootstrap();
