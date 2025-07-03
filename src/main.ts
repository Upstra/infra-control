import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './core/config/swagger.config';
import { setupValidationPipe } from './core/config/validation.config';
import { Logger } from '@nestjs/common';
import { registerAllGlobalFilters } from './core/utils/index';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { parseEnvInt } from './core/utils/env-validation.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(Logger);
  app.useLogger(logger);
  registerAllGlobalFilters(app);

  const cookieParser = require('cookie-parser');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    rateLimit({
      windowMs: parseEnvInt(
        process.env.RATE_LIMIT_GLOBAL_WINDOW_MS,
        900000,
        60000,
        3600000,
      ),
      max: parseEnvInt(process.env.RATE_LIMIT_GLOBAL_MAX, 1000, 100, 10000),
      message: {
        error: 'Trop de requêtes depuis cette IP, essayez plus tard.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

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

  const portMatch = backendUrl.match(/:(\d+)(?:\/|$)/);
  const port = portMatch ? parseInt(portMatch[1], 10) : 3000;

  await app.listen(port);

  logger.log(`🚀 Application lancée sur ${backendUrl}`);

  logger.log(`📖 Documentation OpenAPI disponible sur ${backendUrl}/docs-json`);
  logger.log(`📚 Documentation Swagger disponible sur ${backendUrl}/docs`);
}
bootstrap();
