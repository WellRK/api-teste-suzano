import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdemVenda1719700000000 implements MigrationInterface {
  name = 'CreateOrdemVenda1719700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ordem_venda_status_enum') THEN
          CREATE TYPE "ordem_venda_status_enum" AS ENUM (
            'CRIADA', 'PLANEJADA', 'AGENDADA', 'EM_TRANSPORTE', 'ENTREGUE'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ordem_venda" (
        "_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "numero" character varying NOT NULL,
        "status" "ordem_venda_status_enum" NOT NULL DEFAULT 'CRIADA',
        "cliente_id" uuid NOT NULL,
        "tipo_transporte_id" uuid NOT NULL,
        CONSTRAINT "UQ_ordem_venda_numero" UNIQUE ("numero"),
        CONSTRAINT "PK_ordem_venda" PRIMARY KEY ("_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ordem_venda_status" ON "ordem_venda" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ordem_venda_cliente" ON "ordem_venda" ("cliente_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ordem_venda_tipo_transporte" ON "ordem_venda" ("tipo_transporte_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "ordem_venda"
        ADD CONSTRAINT "FK_ordem_venda_cliente"
        FOREIGN KEY ("cliente_id") REFERENCES "cliente"("_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "ordem_venda"
        ADD CONSTRAINT "FK_ordem_venda_tipo_transporte"
        FOREIGN KEY ("tipo_transporte_id") REFERENCES "tipo_transporte"("_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ordem_venda_item" (
        "_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "ordem_venda_id" uuid NOT NULL,
        "item_id" uuid NOT NULL,
        "quantidade" integer NOT NULL DEFAULT 1,
        CONSTRAINT "UQ_ordem_venda_item" UNIQUE ("ordem_venda_id", "item_id"),
        CONSTRAINT "PK_ordem_venda_item" PRIMARY KEY ("_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ordem_venda_item_ordem" ON "ordem_venda_item" ("ordem_venda_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ordem_venda_item_item" ON "ordem_venda_item" ("item_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "ordem_venda_item"
        ADD CONSTRAINT "FK_ovi_ordem_venda"
        FOREIGN KEY ("ordem_venda_id") REFERENCES "ordem_venda"("_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "ordem_venda_item"
        ADD CONSTRAINT "FK_ovi_item"
        FOREIGN KEY ("item_id") REFERENCES "item"("_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ordem_venda_item" DROP CONSTRAINT IF EXISTS "FK_ovi_item";`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordem_venda_item" DROP CONSTRAINT IF EXISTS "FK_ovi_ordem_venda";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "ordem_venda_item";`);

    await queryRunner.query(
      `ALTER TABLE "ordem_venda" DROP CONSTRAINT IF EXISTS "FK_ordem_venda_tipo_transporte";`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordem_venda" DROP CONSTRAINT IF EXISTS "FK_ordem_venda_cliente";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "ordem_venda";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ordem_venda_status_enum";`);
  }
}
