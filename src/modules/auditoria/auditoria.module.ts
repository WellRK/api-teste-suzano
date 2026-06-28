import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtFactory } from '../../shared/factories/jwt-factory';
import { JwtStrategyClient } from '../../shared/strategies/jwt-strategy-client';
import { DatabaseModule } from '../_database/database.module';
import { AuditoriaController } from './controllers/auditoria.controller';
import { AuditoriaListener } from './listeners/auditoria.listener';
import { EventoAuditoriaRepository } from './repositories/evento-auditoria.repository';
import { AuditoriaService } from './services/auditoria.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync(jwtFactory),
    DatabaseModule,
  ],
  controllers: [AuditoriaController],
  providers: [
    JwtStrategyClient,
    EventoAuditoriaRepository,
    AuditoriaService,
    AuditoriaListener,
  ],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
