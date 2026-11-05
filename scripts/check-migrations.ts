import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from '../src/core/config/typeorm.config';

async function main(): Promise<void> {
  const { autoLoadEntities: _autoLoad, ...options } = buildTypeOrmOptions();
  const dataSource = new DataSource({
    ...(options as object),
    synchronize: false,
    migrationsRun: false,
  } as any);
  await dataSource.initialize();
  try {
    const ran = await dataSource.runMigrations({ transaction: 'each' });
    console.log(`Migrations run: ${ran.map((migration) => migration.name).join(', ') || 'none'}`);

    const pending = await dataSource.driver.createSchemaBuilder().log();
    if (pending.upQueries.length > 0) {
      console.error('Entities and migrations are out of sync. Missing queries:');
      pending.upQueries.forEach((query) => console.error(`  ${query.query};`));
      process.exitCode = 1;
      return;
    }
    console.log('Schema matches the entities.');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
