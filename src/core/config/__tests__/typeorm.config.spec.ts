import { buildTypeOrmOptions } from '../typeorm.config';

describe('buildTypeOrmOptions', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV,
      DB_HOST: 'host',
      DB_PORT: '5432',
      DB_NAME: 'db',
      DB_USERNAME: 'user',
      DB_PASSWORD: 'pass',
    };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('returns dev settings', () => {
    process.env.NODE_ENV = 'development';
    const options = buildTypeOrmOptions();
    expect(options.synchronize).toBe(true);
    expect(options.migrationsRun).toBe(false);
  });

  it('returns prod settings', () => {
    process.env.NODE_ENV = 'production';
    const options = buildTypeOrmOptions();
    expect(options.synchronize).toBe(false);
    expect(options.migrationsRun).toBe(true);
    expect(options.migrations?.length).toBeGreaterThan(0);
  });
});
