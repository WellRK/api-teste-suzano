import { Injectable, Logger } from '@nestjs/common';
import { PaginateResultDto } from '../../../shared/dtos/paginate-result.dto';
import { AuditoriaEventPayload } from '../events/auditoria.events';
import { EventoAuditoriaModel } from '../models/evento-auditoria.model';
import {
  EventoAuditoriaFiltros,
  EventoAuditoriaRepository,
} from '../repositories/evento-auditoria.repository';

@Injectable()
export class AuditoriaService {
  private readonly _logger = new Logger(AuditoriaService.name);

  constructor(private readonly _repository: EventoAuditoriaRepository) {}

  /**
   * Persiste um evento de auditoria. Chamado pelo listener de eventos de domínio,
   * mantendo a auditoria desacoplada das regras de negócio. Falhas aqui não devem
   * derrubar a operação principal, por isso são apenas logadas.
   */
  async registrar(payload: AuditoriaEventPayload): Promise<void> {
    try {
      await this._repository.save({
        dataHora: new Date(),
        tipoAcao: payload.tipoAcao,
        entidade: payload.entidade,
        entidadeId: payload.entidadeId,
        estadoAnterior: payload.estadoAnterior ?? null,
        estadoPosterior: payload.estadoPosterior ?? null,
      });
    } catch (error) {
      this._logger.error(
        `Falha ao registrar evento de auditoria (${payload.tipoAcao}): ${error.message}`,
      );
    }
  }

  async findByFiltros(
    filtros: EventoAuditoriaFiltros,
  ): Promise<PaginateResultDto> {
    return await this._repository.findByFiltros(filtros);
  }

  async getById(id: string): Promise<EventoAuditoriaModel | null> {
    return await this._repository.getById(id);
  }
}
