import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria as tabelas de autenticação/usuário do módulo `client`
 * (login reutilizado pelo OVGS): `user_client`, `profile_client` e a
 * tabela de junção N:N gerada pelo TypeORM (`@JoinTable` padrão).
 *
 * Os nomes de tabela/coluna/junção seguem exatamente o que o TypeORM espera
 * em runtime para as entidades `UserClientModel` e `ProfileClientModel`.
 */
export class CreateClientAuth1719500000000 implements MigrationInterface {
  name = 'CreateClientAuth1719500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_client" (
        "_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "id" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "password" character varying NOT NULL,
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "cpf" character varying NOT NULL,
        "nomeEmpresa" character varying,
        "createdByAdmin_id" uuid,
        CONSTRAINT "UQ_user_client_id" UNIQUE ("id"),
        CONSTRAINT "UQ_user_client_phone" UNIQUE ("phone"),
        CONSTRAINT "UQ_user_client_password" UNIQUE ("password"),
        CONSTRAINT "UQ_user_client_email" UNIQUE ("email"),
        CONSTRAINT "UQ_user_client_cpf" UNIQUE ("cpf"),
        CONSTRAINT "PK_user_client" PRIMARY KEY ("_id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "profile_client" (
        "_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "description" character varying NOT NULL,
        CONSTRAINT "PK_profile_client" PRIMARY KEY ("_id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_client_profile_profile_client" (
        "userClient_id" uuid NOT NULL,
        "profileClient_id" uuid NOT NULL,
        CONSTRAINT "PK_user_client_profile_profile_client"
          PRIMARY KEY ("userClient_id", "profileClient_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ucppc_user" ON "user_client_profile_profile_client" ("userClient_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ucppc_profile" ON "user_client_profile_profile_client" ("profileClient_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "user_client"
        ADD CONSTRAINT "FK_user_client_created_by_admin"
        FOREIGN KEY ("createdByAdmin_id") REFERENCES "user_client"("_id")
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "user_client_profile_profile_client"
        ADD CONSTRAINT "FK_ucppc_user"
        FOREIGN KEY ("userClient_id") REFERENCES "user_client"("_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "user_client_profile_profile_client"
        ADD CONSTRAINT "FK_ucppc_profile"
        FOREIGN KEY ("profileClient_id") REFERENCES "profile_client"("_id")
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_client_profile_profile_client" DROP CONSTRAINT IF EXISTS "FK_ucppc_profile";`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_client_profile_profile_client" DROP CONSTRAINT IF EXISTS "FK_ucppc_user";`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_client" DROP CONSTRAINT IF EXISTS "FK_user_client_created_by_admin";`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "user_client_profile_profile_client";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "profile_client";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_client";`);
  }
}
