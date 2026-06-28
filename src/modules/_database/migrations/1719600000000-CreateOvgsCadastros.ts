import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOvgsCadastros1719600000000 implements MigrationInterface {
  name = 'CreateOvgsCadastros1719600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tipo_transporte" (
        "_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "codigo" character varying NOT NULL,
        "nome" character varying NOT NULL,
        "descricao" character varying,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_tipo_transporte_codigo" UNIQUE ("codigo"),
        CONSTRAINT "PK_tipo_transporte" PRIMARY KEY ("_id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "item" (
        "_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "sku" character varying NOT NULL,
        "nome" character varying NOT NULL,
        "descricao" character varying,
        "unidade_medida" character varying,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_item_sku" UNIQUE ("sku"),
        CONSTRAINT "PK_item" PRIMARY KEY ("_id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cliente" (
        "_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "nome" character varying NOT NULL,
        "documento" character varying NOT NULL,
        "email" character varying NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_cliente_documento" UNIQUE ("documento"),
        CONSTRAINT "UQ_cliente_email" UNIQUE ("email"),
        CONSTRAINT "PK_cliente" PRIMARY KEY ("_id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cliente_tipos_transporte" (
        "cliente_id" uuid NOT NULL,
        "tipo_transporte_id" uuid NOT NULL,
        CONSTRAINT "PK_cliente_tipos_transporte" PRIMARY KEY ("cliente_id", "tipo_transporte_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cliente_tipos_transporte_cliente"
        ON "cliente_tipos_transporte" ("cliente_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cliente_tipos_transporte_tipo"
        ON "cliente_tipos_transporte" ("tipo_transporte_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "cliente_tipos_transporte"
        ADD CONSTRAINT "FK_ctt_cliente"
        FOREIGN KEY ("cliente_id") REFERENCES "cliente"("_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "cliente_tipos_transporte"
        ADD CONSTRAINT "FK_ctt_tipo_transporte"
        FOREIGN KEY ("tipo_transporte_id") REFERENCES "tipo_transporte"("_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cliente_tipos_transporte" DROP CONSTRAINT IF EXISTS "FK_ctt_tipo_transporte";`,
    );
    await queryRunner.query(
      `ALTER TABLE "cliente_tipos_transporte" DROP CONSTRAINT IF EXISTS "FK_ctt_cliente";`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "cliente_tipos_transporte";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "cliente";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "item";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tipo_transporte";`);
  }
}
