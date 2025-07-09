import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Infra Control API')
  .setDescription('API de gestion d’infrastructure locale')
  .setVersion('0.1')
  .addBearerAuth()
  .build();

export function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Infra Control API Documentation',
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  app.use('/docs-json', (req, res) => {
    res.status(200).json(document);
  });
}
