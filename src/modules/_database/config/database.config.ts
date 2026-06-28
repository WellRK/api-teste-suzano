import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { EnviromentVariablesEnum } from "../../../shared/enums/enviroment.variables.enum";
import BooleanUtil from "../../../shared/utils/boolean.util";
import { entitiesConfig } from "./entities.config";

export const databaseAsyncConfig: TypeOrmModuleAsyncOptions = {
    imports: [
        ConfigService,
    ],
    useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
        return {
            type: 'postgres',
            host: configService.get(EnviromentVariablesEnum.DB_CONNECTION_STRING),
            port: Number(configService.get(EnviromentVariablesEnum.DB_PORT)),
            database: configService.get(EnviromentVariablesEnum.DB_NAME),
            username: configService.get(EnviromentVariablesEnum.DB_USER),
            password: configService.get(EnviromentVariablesEnum.DB_PASSWORD),
            synchronize: BooleanUtil.getBoolean(configService.get(EnviromentVariablesEnum.DB_SYNCHRONIZE)),
            entities: entitiesConfig,
            migrationsTableName: 'migrations',
            migrations: [`${__dirname}/../migrations/*{.ts,.js}`],
        };
    },
    inject: [
        ConfigService,
    ]
};