import { INestApplication, Logger } from '@nestjs/common';
import * as path from 'path';
import { readdirSync } from 'fs';

const logger = new Logger('GlobalFilterLoader');

export function registerAllGlobalFilters(app: INestApplication): void {
  const filtersDir = path.join(__dirname, '..', 'filters');
  const modulePaths = getAllFilterFiles(filtersDir);

  const logger = new Logger('GlobalFilterLoader');
  logger.log(`Filtres trouvés : ${modulePaths.length}`);

  for (const filterPath of modulePaths) {
    const module = require(filterPath);
    for (const exported of Object.values(module)) {
      if (typeof exported === 'function') {
        const instance = new (exported as any)();
        app.useGlobalFilters(instance);
        logger.log(`Global filter chargé : ${exported.name}`);
      }
    }
  }
}

function getAllFilterFiles(baseDir: string): string[] {
  const entries = readdirSync(baseDir, { withFileTypes: true });

  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFilterFiles(fullPath)); // 👈 recurse here (déjà bon !)
    } else if (
      entry.name.endsWith('.exception.filter.ts') ||
      entry.name.endsWith('.exception.filter.js') // 👈 ajoute ce cas pour build
    ) {
      files.push(fullPath);
    }
  }

  return files;
}
