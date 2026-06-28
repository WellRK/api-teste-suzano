import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AUDITORIA_EVENTS,
  AuditoriaEventPayload,
} from '../events/auditoria.events';
import { AuditoriaService } from '../services/auditoria.service';

/**
 * Ouve os eventos de domínio (OV e Agendamento) e delega a persistência do
 * registro de auditoria ao serviço. Os handlers são `async` para não bloquear
 * o fluxo que emitiu o evento.
 */
@Injectable()
export class AuditoriaListener {
  constructor(private readonly _service: AuditoriaService) {}

  @OnEvent(AUDITORIA_EVENTS.OV_CRIADA, { async: true })
  async onOrdemVendaCriada(payload: AuditoriaEventPayload): Promise<void> {
    await this._service.registrar(payload);
  }

  @OnEvent(AUDITORIA_EVENTS.OV_STATUS_ALTERADO, { async: true })
  async onStatusAlterado(payload: AuditoriaEventPayload): Promise<void> {
    await this._service.registrar(payload);
  }

  @OnEvent(AUDITORIA_EVENTS.OV_TRANSPORTE_ALTERADO, { async: true })
  async onTransporteAlterado(payload: AuditoriaEventPayload): Promise<void> {
    await this._service.registrar(payload);
  }

  @OnEvent(AUDITORIA_EVENTS.AGENDAMENTO_ALTERADO, { async: true })
  async onAgendamentoAlterado(payload: AuditoriaEventPayload): Promise<void> {
    await this._service.registrar(payload);
  }
}
