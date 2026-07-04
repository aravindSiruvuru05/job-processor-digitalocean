import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrimeJobType1751700000000 implements MigrationInterface {
  name = 'AddPrimeJobType1751700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."jobs_type_enum" ADD VALUE IF NOT EXISTS 'prime'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot drop a single value from an enum type. Rolling this
    // back would require recreating the type without 'prime', which is unsafe
    // once rows use it, so the down migration is intentionally a no-op.
  }
}
