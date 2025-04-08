import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './common/config/swagger.config';
import { setupValidationPipe } from './common/config/validation.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.useGlobalPipes(setupValidationPipe());

  setupSwagger(app);

  const port = parseInt(process.env.APP_PORT || '3000', 10);
  await app.listen(port);
  logger.log(`🚀 Application lancée sur http://localhost:${port}`);

  logger.log(
    `📚 Documentation Swagger disponible sur http://localhost:${port}/docs`,
  );
}
bootstrap();
