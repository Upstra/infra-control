import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './core/config/swagger.config';
import { setupValidationPipe } from './core/config/validation.config';
import { Logger } from '@nestjs/common';
import { registerAllGlobalFilters } from './core/utils/index';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(Logger);
  app.useLogger(logger);
  registerAllGlobalFilters(app);

  const cookieParser = require('cookie-parser');

  app.use(cookieParser());
  app.useGlobalPipes(setupValidationPipe());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true,
  });

  setupSwagger(app);

  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';

  logger.log(`🚀 Application lancée sur ${backendUrl}`);

  logger.log(`📚 Documentation Swagger disponible sur ${backendUrl}/docs`);
}
bootstrap();
