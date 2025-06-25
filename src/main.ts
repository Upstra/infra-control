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
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
  });

  setupSwagger(app);

  const port = parseInt(process.env.APP_PORT ?? '3000', 10);
  await app.listen(port);
  logger.log(`🚀 Application lancée sur http://localhost:${port}`);

  logger.log(
    `📚 Documentation Swagger disponible sur http://localhost:${port}/docs`,
  );
}
bootstrap();
