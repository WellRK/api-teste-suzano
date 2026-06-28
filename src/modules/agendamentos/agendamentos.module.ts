import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtFactory } from '../../shared/factories/jwt-factory';
import { JwtStrategyClient } from '../../shared/strategies/jwt-strategy-client';
import { DatabaseModule } from '../_database/database.module';
import { OrdensVendaModule } from '../ordens-venda/ordens-venda.module';
import { AgendamentoController } from './controllers/agendamento.controller';
import { AgendamentoRepository } from './repositories/agendamento.repository';
import { AgendamentoService } from './services/agendamento.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync(jwtFactory),
    DatabaseModule,
    OrdensVendaModule,
  ],
  controllers: [AgendamentoController],
  providers: [JwtStrategyClient, AgendamentoRepository, AgendamentoService],
  exports: [AgendamentoRepository],
})
export class AgendamentosModule {}
