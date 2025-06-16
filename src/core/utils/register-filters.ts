import { INestApplication, Logger } from '@nestjs/common';
import { CoreFilters } from '../filters/index';

export function registerAllGlobalFilters(app: INestApplication): void {
  const logger = new Logger('GlobalFilterLoader');
  logger.log(`Filtres trouvés : ${CoreFilters.length}`);

  for (const FilterClass of CoreFilters) {
    const instance = new FilterClass();
    app.useGlobalFilters(instance);
    logger.log(`Global filter chargé : ${FilterClass.name}`);
  }
}
