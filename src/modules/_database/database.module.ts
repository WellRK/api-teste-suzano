import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { databaseAsyncConfig } from "./config/database.config";
import { entitiesConfig } from "./config/entities.config";

@Module({
    imports: [
        TypeOrmModule.forRootAsync(databaseAsyncConfig),
        TypeOrmModule.forFeature(entitiesConfig),
    ],
    exports: [
        TypeOrmModule,
    ]
})
export class DatabaseModule { }