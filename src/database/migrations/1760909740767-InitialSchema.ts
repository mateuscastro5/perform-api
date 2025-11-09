import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760909740767 implements MigrationInterface {
  name = 'InitialSchema1760909740767';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."code_reviews_status_enum" AS ENUM('pending', 'approved', 'changes_requested', 'commented')`,
    );
    await queryRunner.query(
      `CREATE TABLE "code_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "github_id" character varying NOT NULL, "status" "public"."code_reviews_status_enum" NOT NULL DEFAULT 'pending', "body" text, "submitted_at" TIMESTAMP, "comments_count" integer NOT NULL DEFAULT '0', "reviewerId" uuid, "pullRequestId" uuid, CONSTRAINT "UQ_291ee23e2983f2b1418b9ab68c1" UNIQUE ("github_id"), CONSTRAINT "PK_88d4e97cc6d287eb8dcb964de85" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "commits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "github_id" character varying NOT NULL, "sha" character varying NOT NULL, "message" character varying NOT NULL, "repository_name" character varying NOT NULL, "branch_name" character varying NOT NULL, "lines_added" integer NOT NULL DEFAULT '0', "lines_deleted" integer NOT NULL DEFAULT '0', "files_changed" integer NOT NULL DEFAULT '0', "committed_at" TIMESTAMP NOT NULL, "url" character varying, "authorId" uuid, "pullRequestId" uuid, CONSTRAINT "UQ_22e4d9a23171805b2fc1abcef16" UNIQUE ("github_id"), CONSTRAINT "UQ_2d802ca1c859d78633b6ac35aad" UNIQUE ("sha"), CONSTRAINT "PK_87adcaf9b8d0f42fee0481c0917" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pull_requests_status_enum" AS ENUM('open', 'closed', 'merged')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pull_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "github_id" character varying NOT NULL, "pr_number" integer NOT NULL, "title" character varying NOT NULL, "description" text, "status" "public"."pull_requests_status_enum" NOT NULL DEFAULT 'open', "repository_name" character varying NOT NULL, "base_branch" character varying NOT NULL, "head_branch" character varying NOT NULL, "lines_added" integer NOT NULL DEFAULT '0', "lines_deleted" integer NOT NULL DEFAULT '0', "files_changed" integer NOT NULL DEFAULT '0', "opened_at" TIMESTAMP NOT NULL, "closed_at" TIMESTAMP, "merged_at" TIMESTAMP, "url" character varying, "authorId" uuid, CONSTRAINT "UQ_0a24eae23bad88ac579cac8d9bf" UNIQUE ("github_id"), CONSTRAINT "PK_e8a8aa8710c3a9650a19a9c2e7b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "metrics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "value" numeric(10,2) NOT NULL, "period_start" date NOT NULL, "period_end" date NOT NULL, "metadata" text, "developerId" uuid, CONSTRAINT "PK_5283cad666a83376e28a715bf0e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "developers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "github_id" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "github_username" character varying NOT NULL, "avatar_url" character varying, "profile_url" character varying, "active" boolean NOT NULL DEFAULT true, "squadId" uuid, CONSTRAINT "UQ_811a8874cdc8d7c6e4eb0b4fd41" UNIQUE ("github_id"), CONSTRAINT "UQ_2ab6e8449efeb4c96d3da1dfbb7" UNIQUE ("github_username"), CONSTRAINT "PK_247719240b950bd26dec14bdd21" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "squads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "description" text, "github_team" character varying, "active" boolean NOT NULL DEFAULT true, "techLeadId" uuid, CONSTRAINT "PK_6ef0717a3dbb0f326bc387dfacb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."permissions_type_enum" AS ENUM('view_dashboard', 'view_individual_metrics', 'view_squad_metrics', 'compare_performance', 'export_reports', 'manage_permissions', 'manage_users', 'manage_squads', 'view_ai_recommendations')`,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "type" "public"."permissions_type_enum" NOT NULL, "name" character varying NOT NULL, "description" text, CONSTRAINT "UQ_f268ae606aacf1dc940820323c8" UNIQUE ("type"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'tech_lead', 'developer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "email" character varying NOT NULL, "name" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'developer', "github_username" character varying, "avatar_url" character varying, "active" boolean NOT NULL DEFAULT true, "squadId" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reports_type_enum" AS ENUM('developer_performance', 'squad_performance', 'pr_analysis', 'custom')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reports_format_enum" AS ENUM('pdf', 'csv', 'json')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "type" "public"."reports_type_enum" NOT NULL, "format" "public"."reports_format_enum" NOT NULL DEFAULT 'pdf', "period_start" date NOT NULL, "period_end" date NOT NULL, "content" text, "file_url" character varying, "generatedById" uuid, CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_recommendations_category_enum" AS ENUM('productivity', 'code_quality', 'collaboration', 'learning', 'performance')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_recommendations_priority_enum" AS ENUM('low', 'medium', 'high')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_recommendations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "description" text NOT NULL, "category" "public"."ai_recommendations_category_enum" NOT NULL, "priority" "public"."ai_recommendations_priority_enum" NOT NULL DEFAULT 'medium', "model_version" character varying, "confidence" numeric(5,2), "metadata" text, "acknowledged" boolean NOT NULL DEFAULT false, "developerId" uuid, CONSTRAINT "PK_57aa33b4356a91e94e98bcd3f2d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_permissions" ("user_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_a537c48b1f80e8626a71cb56589" PRIMARY KEY ("user_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3495bd31f1862d02931e8e8d2e" ON "user_permissions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8145f5fadacd311693c15e41f1" ON "user_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "code_reviews" ADD CONSTRAINT "FK_3b42ffcce19bfdb40ee3026cf11" FOREIGN KEY ("reviewerId") REFERENCES "developers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "code_reviews" ADD CONSTRAINT "FK_fc180b01ff515eb65a43bf6784d" FOREIGN KEY ("pullRequestId") REFERENCES "pull_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commits" ADD CONSTRAINT "FK_95770d13d237bc9ca1bf6ad5adb" FOREIGN KEY ("authorId") REFERENCES "developers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commits" ADD CONSTRAINT "FK_f7a02eaf4e1d4985564e5898849" FOREIGN KEY ("pullRequestId") REFERENCES "pull_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pull_requests" ADD CONSTRAINT "FK_a3d5bcd80f585c20fb9a709c555" FOREIGN KEY ("authorId") REFERENCES "developers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "metrics" ADD CONSTRAINT "FK_c354440a8a7d02c1c4ac1fe1aa7" FOREIGN KEY ("developerId") REFERENCES "developers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "developers" ADD CONSTRAINT "FK_ee5352c86dc04163034a8f6a405" FOREIGN KEY ("squadId") REFERENCES "squads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "squads" ADD CONSTRAINT "FK_8c412375c1e25d20da950503f10" FOREIGN KEY ("techLeadId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_0216e641f1d5f037ccafc81af9d" FOREIGN KEY ("squadId") REFERENCES "squads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" ADD CONSTRAINT "FK_d3d65c7e12b3c642405fd1fbdc6" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_recommendations" ADD CONSTRAINT "FK_23eede31766f1ff75855d0c9c1e" FOREIGN KEY ("developerId") REFERENCES "developers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_8145f5fadacd311693c15e41f10" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_8145f5fadacd311693c15e41f10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_recommendations" DROP CONSTRAINT "FK_23eede31766f1ff75855d0c9c1e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_d3d65c7e12b3c642405fd1fbdc6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_0216e641f1d5f037ccafc81af9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "squads" DROP CONSTRAINT "FK_8c412375c1e25d20da950503f10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "developers" DROP CONSTRAINT "FK_ee5352c86dc04163034a8f6a405"`,
    );
    await queryRunner.query(
      `ALTER TABLE "metrics" DROP CONSTRAINT "FK_c354440a8a7d02c1c4ac1fe1aa7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pull_requests" DROP CONSTRAINT "FK_a3d5bcd80f585c20fb9a709c555"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commits" DROP CONSTRAINT "FK_f7a02eaf4e1d4985564e5898849"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commits" DROP CONSTRAINT "FK_95770d13d237bc9ca1bf6ad5adb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "code_reviews" DROP CONSTRAINT "FK_fc180b01ff515eb65a43bf6784d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "code_reviews" DROP CONSTRAINT "FK_3b42ffcce19bfdb40ee3026cf11"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8145f5fadacd311693c15e41f1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3495bd31f1862d02931e8e8d2e"`,
    );
    await queryRunner.query(`DROP TABLE "user_permissions"`);
    await queryRunner.query(`DROP TABLE "ai_recommendations"`);
    await queryRunner.query(
      `DROP TYPE "public"."ai_recommendations_priority_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ai_recommendations_category_enum"`,
    );
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TYPE "public"."reports_format_enum"`);
    await queryRunner.query(`DROP TYPE "public"."reports_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TYPE "public"."permissions_type_enum"`);
    await queryRunner.query(`DROP TABLE "squads"`);
    await queryRunner.query(`DROP TABLE "developers"`);
    await queryRunner.query(`DROP TABLE "metrics"`);
    await queryRunner.query(`DROP TABLE "pull_requests"`);
    await queryRunner.query(`DROP TYPE "public"."pull_requests_status_enum"`);
    await queryRunner.query(`DROP TABLE "commits"`);
    await queryRunner.query(`DROP TABLE "code_reviews"`);
    await queryRunner.query(`DROP TYPE "public"."code_reviews_status_enum"`);
  }
}
