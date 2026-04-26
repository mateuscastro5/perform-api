import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommitIdToPrAnalyses1764000000000 implements MigrationInterface {
  name = 'AddCommitIdToPrAnalyses1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Allow NULL on github_pull_request_id (commit-based analyses won't have one)
    await queryRunner.query(`
      ALTER TABLE "pr_analyses"
        ALTER COLUMN "github_pull_request_id" DROP NOT NULL
    `);

    // 2. Add github_commit_id column with FK to github_commits.
    await queryRunner.query(`
      ALTER TABLE "pr_analyses"
        ADD COLUMN "github_commit_id" uuid NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "pr_analyses"
        ADD CONSTRAINT "FK_pr_analyses_github_commit"
        FOREIGN KEY ("github_commit_id")
        REFERENCES "github_commits"("id")
        ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_pr_analyses_commit"
        ON "pr_analyses" ("github_commit_id")
        WHERE "github_commit_id" IS NOT NULL
    `);

    // 3. Sanity: at least one of (PR, commit) must be set.
    await queryRunner.query(`
      ALTER TABLE "pr_analyses"
        ADD CONSTRAINT "CK_pr_analyses_source"
        CHECK ("github_pull_request_id" IS NOT NULL OR "github_commit_id" IS NOT NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pr_analyses" DROP CONSTRAINT IF EXISTS "CK_pr_analyses_source"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pr_analyses_commit"`);
    await queryRunner.query(`ALTER TABLE "pr_analyses" DROP CONSTRAINT IF EXISTS "FK_pr_analyses_github_commit"`);
    await queryRunner.query(`ALTER TABLE "pr_analyses" DROP COLUMN IF EXISTS "github_commit_id"`);
    await queryRunner.query(`
      ALTER TABLE "pr_analyses"
        ALTER COLUMN "github_pull_request_id" SET NOT NULL
    `);
  }
}
