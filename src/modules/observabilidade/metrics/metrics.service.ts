import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';

/**
 * Centraliza o registro de métricas Prometheus da aplicação.
 *
 * Mantém um {@link Registry} próprio (em vez do global de `prom-client`) para
 * isolar o estado entre instâncias/testes e expõe os instrumentos consumidos
 * pelo `MetricsInterceptor` (contador de requisições e histograma de latência).
 * Também coleta as métricas padrão do processo Node (event loop, GC, memória).
 */
@Injectable()
export class MetricsService {
  readonly registry: Registry;
  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestDuration: Histogram<string>;

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({ app: 'ovgs-api' });
    collectDefaultMetrics({ register: this.registry });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total de requisições HTTP processadas.',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duração das requisições HTTP em segundos.',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });
  }

  /** Texto no formato de exposição Prometheus. */
  async expose(): Promise<string> {
    return this.registry.metrics();
  }

  /** Content-Type esperado pelos coletores Prometheus. */
  get contentType(): string {
    return this.registry.contentType;
  }
}
