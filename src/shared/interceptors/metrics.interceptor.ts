import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from '../../modules/observabilidade/metrics/metrics.service';

/**
 * Interceptor global de métricas (diferencial "Observabilidade").
 *
 * Mede a latência de cada requisição HTTP e alimenta os instrumentos
 * Prometheus do {@link MetricsService}: incrementa `http_requests_total` e
 * observa `http_request_duration_seconds`, rotulados por método, rota e status.
 *
 * Usa o **padrão da rota** (`req.route.path`, ex.: `/ordens-venda/:id`) em vez
 * da URL concreta para evitar alta cardinalidade de labels (um label por id).
 *
 * Arquivo NOVO em `shared/` — não altera nenhum componente compartilhado
 * existente; apenas adiciona uma capacidade transversal.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly _metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const stopTimer = this._metrics.httpRequestDuration.startTimer();

    return next.handle().pipe(
      finalize(() => {
        const route = this._resolveRoute(request);
        const labels = {
          method: request.method,
          route,
          status: String(response.statusCode),
        };
        this._metrics.httpRequestsTotal.inc(labels);
        stopTimer(labels);
      }),
    );
  }

  private _resolveRoute(request: Request): string {
    const path = (request.route as { path?: string } | undefined)?.path;
    if (path) return path;
    return request.path ?? 'unknown';
  }
}
