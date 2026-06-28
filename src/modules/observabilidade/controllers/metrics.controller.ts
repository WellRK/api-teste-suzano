import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Exposição de métricas no formato Prometheus (diferencial "Métricas").
 *
 * Rota **pública** consumida por scrapers Prometheus. Retorna texto puro no
 * formato de exposição (`text/plain; version=0.0.4`) — por contrato do
 * protocolo, NÃO usa o envelope `ResponseDto` dos endpoints de negócio.
 */
@ApiTags('Observabilidade')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly _metrics: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Métricas da aplicação no formato Prometheus.' })
  async metrics(): Promise<string> {
    return this._metrics.expose();
  }
}
