import { CacheModule, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtFactory } from '../../shared/factories/jwt-factory';
import { JwtStrategyClient } from '../../shared/strategies/jwt-strategy-client';
import { DatabaseModule } from '../_database/database.module';
import { TipoTransporteController } from './controllers/tipo-transporte.controller';
import { TipoTransporteRepository } from './repositories/tipo-transporte.repository';
import { TipoTransporteService } from './services/tipo-transporte.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync(jwtFactory),
    DatabaseModule,
    // Cache em memória com TTL curto; invalidação explícita ao criar/editar.
    CacheModule.register({ ttl: 60 }),
  ],
  controllers: [TipoTransporteController],
  providers: [JwtStrategyClient, TipoTransporteRepository, TipoTransporteService],
  exports: [TipoTransporteRepository],
})
export class TiposTransporteModule {}
