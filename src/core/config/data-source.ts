import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.config';

/**
 * DataSource used by the TypeORM CLI to run migrations.
 */
export const AppDataSource = (() => {
  const { autoLoadEntities: _autoLoadEntities, ...options } =
    buildTypeOrmOptions();
  return new DataSource(options as any);
})();
