import { TipoAcaoEnum } from '../enums/tipo-acao.enum';

/**
 * Nomes dos eventos de domínio que alimentam a auditoria.
 * Centralizados para evitar "magic strings" espalhadas pelos serviços.
 */
export const AUDITORIA_EVENTS = {
  OV_CRIADA: 'ov.criada',
  OV_STATUS_ALTERADO: 'ov.status.alterado',
  OV_TRANSPORTE_ALTERADO: 'ov.transporte.alterado',
  AGENDAMENTO_ALTERADO: 'agendamento.alterado',
} as const;

/**
 * Payload comum a todos os eventos de auditoria. Carrega o suficiente para
 * persistir um `EventoAuditoria` sem que o listener precise reconsultar o banco,
 * mantendo a auditoria desacoplada das regras de negócio.
 */
export interface AuditoriaEventPayload {
  tipoAcao: TipoAcaoEnum;
  entidade: string;
  entidadeId: string;
  estadoAnterior?: Record<string, unknown> | null;
  estadoPosterior?: Record<string, unknown> | null;
}
