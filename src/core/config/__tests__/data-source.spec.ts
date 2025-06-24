import { AppDataSource } from '../data-source';
import * as config from '../typeorm.config';

describe('AppDataSource', () => {
  it('creates DataSource with options from buildTypeOrmOptions', () => {
    jest.spyOn(config, 'buildTypeOrmOptions').mockReturnValue({
      type: 'postgres',
      host: 'h',
      port: 5432,
      database: 'd',
      username: 'u',
      password: 'p',
      entities: [],
      migrations: [],
      synchronize: false,
      migrationsRun: true,
      logging: false,
      autoLoadEntities: true,
    });
    expect(AppDataSource.options.type).toBe('postgres');
    expect((AppDataSource.options as any).autoLoadEntities).toBeUndefined();
  });
});
