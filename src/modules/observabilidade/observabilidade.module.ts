import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { MetricsInterceptor } from '../../shared/interceptors/metrics.interceptor';
import { DatabaseModule } from '../_database/database.module';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { MetricsService } from './metrics/metrics.service';

/**
 * Módulo de observabilidade (diferencial): healthcheck (`/health`) e métricas
 * Prometheus (`/metrics`), além do interceptor global que instrumenta latência
 * e contagem de requisições. Rotas públicas, sem guard.
 */
@Module({
  imports: [TerminusModule, DatabaseModule],
  controllers: [HealthController, MetricsController],
  providers: [
    MetricsService,
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class ObservabilidadeModule {}
