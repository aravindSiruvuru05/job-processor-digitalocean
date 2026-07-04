import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitJobs1751600000000 implements MigrationInterface {
  name = 'InitJobs1751600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_type_enum" AS ENUM('square')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_status_enum" AS ENUM('queued', 'running', 'completed', 'failed')`,
    );
    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."jobs_type_enum" NOT NULL DEFAULT 'square',
        "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'queued',
        "input" jsonb NOT NULL,
        "result" jsonb,
        "error" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "startedAt" TIMESTAMP WITH TIME ZONE,
        "finishedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_jobs_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_type_enum"`);
  }
}
