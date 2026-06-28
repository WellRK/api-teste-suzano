import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtFactory } from '../../shared/factories/jwt-factory';
import { JwtStrategyClient } from '../../shared/strategies/jwt-strategy-client';
import { DatabaseModule } from '../_database/database.module';
import { TiposTransporteModule } from '../tipos-transporte/tipos-transporte.module';
import { ClienteController } from './controllers/cliente.controller';
import { ClienteRepository } from './repositories/cliente.repository';
import { ClienteService } from './services/cliente.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync(jwtFactory),
    DatabaseModule,
    TiposTransporteModule,
  ],
  controllers: [ClienteController],
  providers: [JwtStrategyClient, ClienteRepository, ClienteService],
  exports: [ClienteRepository],
})
export class ClientesModule {}
