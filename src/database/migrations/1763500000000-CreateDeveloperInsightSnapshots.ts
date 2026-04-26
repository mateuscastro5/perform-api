import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeveloperInsightSnapshots1763500000000
  implements MigrationInterface
{
  name = 'CreateDeveloperInsightSnapshots1763500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "developer_insight_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "developer_id" uuid NOT NULL,
        "summary_text" text NOT NULL DEFAULT '',
        "strengths" jsonb NOT NULL DEFAULT '[]',
        "growth_areas" jsonb NOT NULL DEFAULT '[]',
        "dominant_technologies" jsonb NOT NULL DEFAULT '[]',
        "trend_narrative" text NOT NULL DEFAULT '',
        "memory_count_at_generation" integer NOT NULL DEFAULT 0,
        "analyses_count_at_generation" integer NOT NULL DEFAULT 0,
        "generated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_developer_insight_snapshots" PRIMARY KEY ("id"),
        CONSTRAINT "FK_dev_insight_snapshots_developer" FOREIGN KEY ("developer_id")
          REFERENCES "developers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_dev_insight_snapshots_developer"
        ON "developer_insight_snapshots" ("developer_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_dev_insight_snapshots_developer"`);
    await queryRunner.query(`DROP TABLE "developer_insight_snapshots"`);
  }
}
