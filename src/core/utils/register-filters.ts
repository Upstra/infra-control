import { INestApplication } from '@nestjs/common';
import * as path from 'path';
import { readdirSync } from 'fs';

export function registerAllGlobalFilters(app: INestApplication): void {
  const filtersDir = path.join(__dirname, '..', 'filters');

  const modulePaths = getAllFilterFiles(filtersDir);

  for (const filterPath of modulePaths) {
    const module = require(filterPath);
    for (const exported of Object.values(module)) {
      if (typeof exported === 'function') {
        const instance = new (exported as any)();
        app.useGlobalFilters(instance);
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
      files.push(...getAllFilterFiles(fullPath));
    } else if (entry.name.endsWith('.exception.filter.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}
