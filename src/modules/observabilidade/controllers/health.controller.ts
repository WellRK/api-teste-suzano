import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

/**
 * Healthcheck de liveness/readiness (diferencial "Observabilidade").
 *
 * Rota **pública** (sem guard) para sondas de orquestradores (Docker/K8s) e
 * monitoramento externo. Inclui um ping ao Postgres, então o readiness reflete
 * a disponibilidade real da dependência crítica.
 *
 * Resposta no formato padrão do `@nestjs/terminus` (`{ status, info, details }`)
 * — convenção idiomática de observabilidade; por isso não usa o envelope
 * `ResponseDto` dos endpoints de negócio.
 */
@ApiTags('Observabilidade')
@Controller('health')
export class HealthController {
  constructor(
    private readonly _health: HealthCheckService,
    private readonly _db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness/readiness da API (inclui ping ao Postgres).',
  })
  check() {
    return this._health.check([
      () => this._db.pingCheck('database', { timeout: 3000 }),
    ]);
  }
}
