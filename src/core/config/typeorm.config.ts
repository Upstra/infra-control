import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Build TypeORM options based on environment variables. Synchronization is
 * disabled in production and migrations are executed automatically.
 */
export const buildTypeOrmOptions = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  migrationsRun: true,
  logging: false,
  autoLoadEntities: true,
});

export const typeOrmConfig = buildTypeOrmOptions();
