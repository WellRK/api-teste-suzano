import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrdemVendaCreatedAtIndex1719800000000
  implements MigrationInterface
{
  name = 'AddOrdemVendaCreatedAtIndex1719800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ordem_venda_created_at"
        ON "ordem_venda" ("created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ordem_venda_created_at";`,
    );
  }
}
