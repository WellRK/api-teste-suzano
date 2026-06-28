import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventoAuditoria1720000000000 implements MigrationInterface {
  name = 'CreateEventoAuditoria1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evento_auditoria_tipo_acao_enum') THEN
          CREATE TYPE "evento_auditoria_tipo_acao_enum" AS ENUM (
            'OV_CRIADA', 'OV_STATUS_ALTERADO', 'OV_TRANSPORTE_ALTERADO', 'AGENDAMENTO_ALTERADO'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "evento_auditoria" (
        "_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "data_hora" TIMESTAMP NOT NULL,
        "tipo_acao" "evento_auditoria_tipo_acao_enum" NOT NULL,
        "entidade" character varying NOT NULL,
        "entidade_id" uuid NOT NULL,
        "estado_anterior" jsonb,
        "estado_posterior" jsonb,
        CONSTRAINT "PK_evento_auditoria" PRIMARY KEY ("_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_evento_auditoria_entidade"
        ON "evento_auditoria" ("entidade", "entidade_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_evento_auditoria_tipo_acao"
        ON "evento_auditoria" ("tipo_acao");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_evento_auditoria_data_hora"
        ON "evento_auditoria" ("data_hora");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "evento_auditoria";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "evento_auditoria_tipo_acao_enum";`,
    );
  }
}
