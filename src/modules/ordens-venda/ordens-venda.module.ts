import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtFactory } from '../../shared/factories/jwt-factory';
import { JwtStrategyClient } from '../../shared/strategies/jwt-strategy-client';
import { ClientesModule } from '../clientes/clientes.module';
import { ItensModule } from '../itens/itens.module';
import { TiposTransporteModule } from '../tipos-transporte/tipos-transporte.module';
import { DatabaseModule } from '../_database/database.module';
import { OrdemVendaController } from './controllers/ordem-venda.controller';
import { OrdemVendaRepository } from './repositories/ordem-venda.repository';
import { OrdemVendaService } from './services/ordem-venda.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync(jwtFactory),
    DatabaseModule,
    ClientesModule,
    TiposTransporteModule,
    ItensModule,
  ],
  controllers: [OrdemVendaController],
  providers: [JwtStrategyClient, OrdemVendaRepository, OrdemVendaService],
  exports: [OrdemVendaRepository],
})
export class OrdensVendaModule {}
