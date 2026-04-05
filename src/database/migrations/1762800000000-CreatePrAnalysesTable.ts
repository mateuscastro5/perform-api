import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrAnalysesTable1762800000000 implements MigrationInterface {
  name = 'CreatePrAnalysesTable1762800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "pr_analyses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "github_pull_request_id" uuid NOT NULL,
        "developer_id" uuid,
        "complexity_score" float NOT NULL DEFAULT 0,
        "confidence" float NOT NULL DEFAULT 0,
        "difficulty_label" varchar NOT NULL DEFAULT 'medium',
        "justification" text NOT NULL DEFAULT '',
        "technical_summary" text NOT NULL DEFAULT '',
        "technologies" text NOT NULL DEFAULT '[]',
        "change_type" varchar NOT NULL DEFAULT 'feature',
        "status" varchar NOT NULL DEFAULT 'pending',
        "corrected_score" float,
        "corrected_label" varchar,
        "corrected_by" uuid,
        "corrected_at" timestamp,
        "feedback_note" text,
        "processing_time_ms" integer NOT NULL DEFAULT 0,
        "llm_reader_model" varchar NOT NULL DEFAULT '',
        "llm_scorer_model" varchar NOT NULL DEFAULT '',
        "similar_examples_used" text NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pr_analyses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pr_analyses_github_pr" FOREIGN KEY ("github_pull_request_id")
          REFERENCES "github_pull_requests"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pr_analyses_developer" FOREIGN KEY ("developer_id")
          REFERENCES "developers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_pr_analyses_corrected_by" FOREIGN KEY ("corrected_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_pr_analyses_github_pr_id"
        ON "pr_analyses" ("github_pull_request_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_pr_analyses_developer_created"
        ON "pr_analyses" ("developer_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_pr_analyses_status"
        ON "pr_analyses" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_pr_analyses_status"`);
    await queryRunner.query(`DROP INDEX "IDX_pr_analyses_developer_created"`);
    await queryRunner.query(`DROP INDEX "IDX_pr_analyses_github_pr_id"`);
    await queryRunner.query(`DROP TABLE "pr_analyses"`);
  }
}
