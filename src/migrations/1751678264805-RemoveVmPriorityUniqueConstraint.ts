import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveVmPriorityUniqueConstraint1751678264805
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Find and drop the unique constraint on vm.priority
    const table = await queryRunner.getTable('vm');
    const uniqueConstraint = table?.uniques.find((unique) =>
      unique.columnNames.includes('priority'),
    );

    if (uniqueConstraint) {
      await queryRunner.dropUniqueConstraint('vm', uniqueConstraint);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the unique constraint on vm.priority
    await queryRunner.query(
      'ALTER TABLE "vm" ADD CONSTRAINT "UQ_vm_priority" UNIQUE ("priority")',
    );
  }
}
