import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { entitiesConfig } from './entities.config';
import { EnviromentVariablesEnum } from '../../../shared/enums/enviroment.variables.enum';
import { DataSource } from "typeorm";
config({
    path: `${process.cwd()}/config/env/${process.env.NODE_ENV}.env`
});
const configService = new ConfigService();
export const databaseMigrationConfig = new DataSource({
    type: 'postgres',
    host: configService.get(EnviromentVariablesEnum.DB_CONNECTION_STRING),
    port: Number(configService.get(EnviromentVariablesEnum.DB_PORT)),
    database: configService.get(EnviromentVariablesEnum.DB_NAME),
    username: configService.get(EnviromentVariablesEnum.DB_USER),
    password: configService.get(EnviromentVariablesEnum.DB_PASSWORD),
    entities: entitiesConfig,
    migrationsTableName: 'migrations',
    migrations: [`./src/modules/_database/migrations/*{.ts,.js}`],
    synchronize: configService.get<boolean>(EnviromentVariablesEnum.DB_SYNCHRONIZE),
});