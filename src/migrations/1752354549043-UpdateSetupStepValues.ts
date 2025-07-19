import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSetupStepValues1752354549043 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update deprecated SetupStep values to new ones
    await queryRunner.query(`
      UPDATE setup_progress 
      SET step = 'rooms' 
      WHERE step = 'create-room'
    `);

    await queryRunner.query(`
      UPDATE setup_progress 
      SET step = 'ups' 
      WHERE step = 'create-ups'
    `);

    await queryRunner.query(`
      UPDATE setup_progress 
      SET step = 'servers' 
      WHERE step = 'create-server'
    `);

    await queryRunner.query(`
      UPDATE setup_progress 
      SET step = 'relationships' 
      WHERE step = 'vm-discovery'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to old SetupStep values
    await queryRunner.query(`
      UPDATE setup_progress 
      SET step = 'create-room' 
      WHERE step = 'rooms'
    `);

    await queryRunner.query(`
      UPDATE setup_progress 
      SET step = 'create-ups' 
      WHERE step = 'ups'
    `);

    await queryRunner.query(`
      UPDATE setup_progress 
      SET step = 'create-server' 
      WHERE step = 'servers'
    `);

    await queryRunner.query(`
      UPDATE setup_progress 
      SET step = 'vm-discovery' 
      WHERE step = 'relationships'
    `);
  }
}
