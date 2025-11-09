import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSquadIdToDevelopers1762724000000 implements MigrationInterface {
  name = 'AddSquadIdToDevelopers1762724000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('developers');
    const hasSquadId = table?.columns.find((col) => col.name === 'squad_id');

    if (!hasSquadId) {
      await queryRunner.query(`
        ALTER TABLE "developers" 
        ADD COLUMN "squad_id" uuid
      `);

      await queryRunner.query(`
        ALTER TABLE "developers" 
        ADD CONSTRAINT "FK_developers_squad_id" 
        FOREIGN KEY ("squad_id") 
        REFERENCES "squads"("id") 
        ON DELETE SET NULL 
        ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "developers" 
      DROP CONSTRAINT IF EXISTS "FK_developers_squad_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "developers" 
      DROP COLUMN IF EXISTS "squad_id"
    `);
  }
}
