import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { configuration } from '../config/env/configuration';

import { ClientModule } from './modules/client/client.module';
import { DatabaseSeedModule } from './modules/_database-seed/database-seed.module';
import { DatabaseModule } from './modules/_database/database.module';
import { TiposTransporteModule } from './modules/tipos-transporte/tipos-transporte.module';
import { ItensModule } from './modules/itens/itens.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { OrdensVendaModule } from './modules/ordens-venda/ordens-venda.module';
import { AgendamentosModule } from './modules/agendamentos/agendamentos.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { ObservabilidadeModule } from './modules/observabilidade/observabilidade.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/config/env/${process.env.NODE_ENV}.env`,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),

    DatabaseModule,
    DatabaseSeedModule,
    ClientModule,
    TiposTransporteModule,
    ItensModule,
    ClientesModule,
    OrdensVendaModule,
    AgendamentosModule,
    AuditoriaModule,
    ObservabilidadeModule,
  ],
})
export class AppModule {}
