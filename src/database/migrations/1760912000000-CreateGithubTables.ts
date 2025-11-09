import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGithubTables1760912000000 implements MigrationInterface {
  name = 'CreateGithubTables1760912000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "github_configurations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "user_id" uuid NOT NULL,
        "github_token" TEXT NOT NULL,
        "github_username" character varying NOT NULL,
        "github_user_id" character varying NOT NULL,
        "data_range" integer NOT NULL DEFAULT '1',
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_github_configurations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_github_configurations_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_github_configurations_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_github_configurations_user_id" ON "github_configurations" ("user_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "monitored_repositories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "configuration_id" uuid NOT NULL,
        "repo_id" character varying NOT NULL,
        "repo_name" character varying NOT NULL,
        "repo_full_name" character varying NOT NULL,
        "description" text,
        "is_private" boolean NOT NULL DEFAULT false,
        "webhook_id" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_monitored_repositories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_monitored_repositories_config_repo" UNIQUE ("configuration_id", "repo_id"),
        CONSTRAINT "FK_monitored_repositories_configuration_id" FOREIGN KEY ("configuration_id") REFERENCES "github_configurations"("id") ON DELETE CASCADE
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_monitored_repositories_configuration_id" ON "monitored_repositories" ("configuration_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_monitored_repositories_repo_id" ON "monitored_repositories" ("repo_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_monitored_repositories_repo_id"`);
    await queryRunner.query(
      `DROP INDEX "IDX_monitored_repositories_configuration_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_github_configurations_user_id"`);

    await queryRunner.query(`DROP TABLE "monitored_repositories"`);
    await queryRunner.query(`DROP TABLE "github_configurations"`);
  }
}
