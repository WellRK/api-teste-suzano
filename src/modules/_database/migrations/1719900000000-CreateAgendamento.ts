import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgendamento1719900000000 implements MigrationInterface {
  name = 'CreateAgendamento1719900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agendamento_status_enum') THEN
          CREATE TYPE "agendamento_status_enum" AS ENUM (
            'PENDENTE', 'CONFIRMADO', 'REAGENDADO'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agendamento" (
        "_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "ordem_venda_id" uuid NOT NULL,
        "data_entrega" date NOT NULL,
        "janela_inicio" time NOT NULL,
        "janela_fim" time NOT NULL,
        "status" "agendamento_status_enum" NOT NULL DEFAULT 'PENDENTE',
        CONSTRAINT "UQ_agendamento_ordem_venda" UNIQUE ("ordem_venda_id"),
        CONSTRAINT "PK_agendamento" PRIMARY KEY ("_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_agendamento_status" ON "agendamento" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_agendamento_data_entrega" ON "agendamento" ("data_entrega");
    `);

    await queryRunner.query(`
      ALTER TABLE "agendamento"
        ADD CONSTRAINT "FK_agendamento_ordem_venda"
        FOREIGN KEY ("ordem_venda_id") REFERENCES "ordem_venda"("_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agendamento" DROP CONSTRAINT IF EXISTS "FK_agendamento_ordem_venda";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "agendamento";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "agendamento_status_enum";`);
  }
}
