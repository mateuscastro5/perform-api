import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastSyncedAtToGithubConfigurations1764500000000
  implements MigrationInterface
{
  name = 'AddLastSyncedAtToGithubConfigurations1764500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('github_configurations');
    const hasColumn = table?.columns.find(
      (col) => col.name === 'last_synced_at',
    );

    if (!hasColumn) {
      await queryRunner.query(`
        ALTER TABLE "github_configurations"
        ADD COLUMN "last_synced_at" TIMESTAMP WITH TIME ZONE NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "github_configurations"
      DROP COLUMN IF EXISTS "last_synced_at"
    `);
  }
}
