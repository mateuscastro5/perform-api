import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGithubDataTables1762714252766 implements MigrationInterface {
  name = 'CreateGithubDataTables1762714252766';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "github_commits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "repository_id" uuid NOT NULL,
        "developer_id" uuid,
        "commit_sha" character varying(40) NOT NULL,
        "message" text NOT NULL,
        "author_name" character varying NOT NULL,
        "author_email" character varying NOT NULL,
        "committed_date" TIMESTAMP NOT NULL,
        "additions" integer NOT NULL DEFAULT 0,
        "deletions" integer NOT NULL DEFAULT 0,
        "changed_files" integer NOT NULL DEFAULT 0,
        "branch" character varying,
        "html_url" character varying NOT NULL,
        CONSTRAINT "PK_github_commits" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_github_commits_repo_sha" UNIQUE ("repository_id", "commit_sha"),
        CONSTRAINT "FK_github_commits_repository" FOREIGN KEY ("repository_id") 
          REFERENCES "monitored_repositories"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_github_commits_developer" FOREIGN KEY ("developer_id") 
          REFERENCES "developers"("id") ON DELETE SET NULL
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_github_commits_author_email" ON "github_commits" ("author_email")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_github_commits_committed_date" ON "github_commits" ("committed_date")`,
    );

    await queryRunner.query(
      `CREATE TABLE "github_pull_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "repository_id" uuid NOT NULL,
        "developer_id" uuid,
        "pr_number" integer NOT NULL,
        "title" character varying NOT NULL,
        "body" text,
        "state" character varying NOT NULL,
        "author_login" character varying NOT NULL,
        "author_email" character varying,
        "pr_created_at" TIMESTAMP NOT NULL,
        "pr_updated_at" TIMESTAMP NOT NULL,
        "closed_at" TIMESTAMP,
        "merged_at" TIMESTAMP,
        "additions" integer NOT NULL DEFAULT 0,
        "deletions" integer NOT NULL DEFAULT 0,
        "changed_files" integer NOT NULL DEFAULT 0,
        "commits_count" integer NOT NULL DEFAULT 0,
        "comments_count" integer NOT NULL DEFAULT 0,
        "review_comments_count" integer NOT NULL DEFAULT 0,
        "html_url" character varying NOT NULL,
        "base_branch" character varying NOT NULL,
        "head_branch" character varying NOT NULL,
        CONSTRAINT "PK_github_pull_requests" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_github_prs_repo_number" UNIQUE ("repository_id", "pr_number"),
        CONSTRAINT "FK_github_prs_repository" FOREIGN KEY ("repository_id") 
          REFERENCES "monitored_repositories"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_github_prs_developer" FOREIGN KEY ("developer_id") 
          REFERENCES "developers"("id") ON DELETE SET NULL
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_github_prs_author_login" ON "github_pull_requests" ("author_login")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_github_prs_state" ON "github_pull_requests" ("state")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_github_prs_created_at" ON "github_pull_requests" ("pr_created_at")`,
    );

    await queryRunner.query(
      `CREATE TABLE "github_pr_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "pull_request_id" uuid NOT NULL,
        "developer_id" uuid,
        "review_id" bigint NOT NULL,
        "reviewer_login" character varying NOT NULL,
        "reviewer_email" character varying,
        "state" character varying NOT NULL,
        "body" text,
        "submitted_at" TIMESTAMP NOT NULL,
        "html_url" character varying NOT NULL,
        CONSTRAINT "PK_github_pr_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_github_reviews_pr_review" UNIQUE ("pull_request_id", "review_id"),
        CONSTRAINT "FK_github_reviews_pr" FOREIGN KEY ("pull_request_id") 
          REFERENCES "github_pull_requests"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_github_reviews_developer" FOREIGN KEY ("developer_id") 
          REFERENCES "developers"("id") ON DELETE SET NULL
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_github_reviews_reviewer_login" ON "github_pr_reviews" ("reviewer_login")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_github_reviews_submitted_at" ON "github_pr_reviews" ("submitted_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_github_reviews_submitted_at"`);
    await queryRunner.query(`DROP INDEX "IDX_github_reviews_reviewer_login"`);
    await queryRunner.query(`DROP INDEX "IDX_github_prs_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_github_prs_state"`);
    await queryRunner.query(`DROP INDEX "IDX_github_prs_author_login"`);
    await queryRunner.query(`DROP INDEX "IDX_github_commits_committed_date"`);
    await queryRunner.query(`DROP INDEX "IDX_github_commits_author_email"`);

    await queryRunner.query(`DROP TABLE "github_pr_reviews"`);
    await queryRunner.query(`DROP TABLE "github_pull_requests"`);
    await queryRunner.query(`DROP TABLE "github_commits"`);
  }
}
