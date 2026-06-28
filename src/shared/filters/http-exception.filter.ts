import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseDto } from '../dtos/response.dto';

/**
 * Filtro global de exceções.
 *
 * Centraliza o tratamento de erros HTTP e garante que TODA resposta de erro
 * siga o envelope padrão {@link ResponseDto} (`{ success, data, errors }`),
 * mesmo para exceções não capturadas nos controllers (ex.: 404 de rota,
 * erros de `ValidationPipe`, falhas inesperadas → 500).
 *
 * Se o controller já lançou um `HttpException` cujo corpo é um `ResponseDto`
 * (padrão atual dos controllers), o envelope é preservado tal como está.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly _logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this._buildBody(exception);

    this._logger.error(
      JSON.stringify({
        method: request?.method,
        path: request?.url,
        status,
        errors: body.errors,
      }),
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(body);
  }

  private _buildBody(exception: unknown): ResponseDto {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();

      if (this._isResponseDto(res)) return res as ResponseDto;

      const errors = this._extractErrors(res, exception.message);
      return new ResponseDto(false, null, errors);
    }

    return new ResponseDto(false, null, ['Erro interno do servidor.']);
  }

  private _isResponseDto(res: unknown): boolean {
    return (
      typeof res === 'object' &&
      res !== null &&
      'success' in res &&
      'data' in res &&
      'errors' in res
    );
  }

  private _extractErrors(res: unknown, fallback: string): string[] {
    if (typeof res === 'string') return [res];
    if (typeof res === 'object' && res !== null && 'message' in res) {
      const message = (res as { message: unknown }).message;
      return Array.isArray(message) ? message.map(String) : [String(message)];
    }
    return [fallback];
  }
}
