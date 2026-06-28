import { ConsoleLogger, LogLevel } from '@nestjs/common';

/**
 * Logger estruturado em JSON (uma linha por evento).
 *
 * Estende o `ConsoleLogger` do Nest para preservar o contexto/nível usados em
 * todo o app, mas serializa cada entrada como JSON — formato amigável para
 * coletores de log (ELK, Loki, CloudWatch) e para correlação por campos.
 *
 * Diferencial "Logs estruturados": cada linha contém `timestamp`, `level`,
 * `context` e `message` (e `trace` quando houver erro).
 */
export class StructuredLogger extends ConsoleLogger {
  private write(level: LogLevel, message: unknown, context?: string, trace?: string): void {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      context: context ?? this.context ?? 'App',
      message:
        typeof message === 'object' ? message : String(message ?? ''),
    };
    if (trace) entry.trace = trace;

    const line = JSON.stringify(entry);
    if (level === 'error') process.stderr.write(`${line}\n`);
    else process.stdout.write(`${line}\n`);
  }

  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }
}
