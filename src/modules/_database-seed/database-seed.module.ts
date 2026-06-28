import { Module } from "@nestjs/common";
import { DatabaseModule } from "../_database/database.module";
import { CommandModule } from 'nestjs-command';
import { ClientModule } from "../client/client.module";
import { TiposTransporteModule } from "../tipos-transporte/tipos-transporte.module";
import { ItensModule } from "../itens/itens.module";
import { InitialSeed } from "./seeders/initial-seed.seed";

@Module({
    imports: [
        CommandModule,
        DatabaseModule,
        ClientModule,
        TiposTransporteModule,
        ItensModule,
    ],
    providers: [
        InitialSeed,
    ],
    exports: [
        InitialSeed,
    ]
})
export class DatabaseSeedModule { }
