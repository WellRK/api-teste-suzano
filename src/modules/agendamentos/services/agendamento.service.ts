import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TipoAcaoEnum } from '../../auditoria/enums/tipo-acao.enum';
import {
  AUDITORIA_EVENTS,
  AuditoriaEventPayload,
} from '../../auditoria/events/auditoria.events';
import { OrdemVendaRepository } from '../../ordens-venda/repositories/ordem-venda.repository';
import { CreateAgendamentoDto } from '../dtos/create-agendamento.dto';
import { ReagendarDto } from '../dtos/reagendar.dto';
import { AgendamentoStatusEnum } from '../enums/agendamento-status.enum';
import { AgendamentoModel } from '../models/agendamento.model';
import { AgendamentoRepository } from '../repositories/agendamento.repository';

@Injectable()
export class AgendamentoService {
  constructor(
    private readonly _repository: AgendamentoRepository,
    private readonly _ordemVendaRepository: OrdemVendaRepository,
    private readonly _eventEmitter: EventEmitter2,
  ) {}

  async definir(dto: CreateAgendamentoDto): Promise<AgendamentoModel> {
    const ordem = await this._ordemVendaRepository.getById(dto.ordemVendaId);
    if (!ordem) throw new NotFoundException('Ordem de Venda não encontrada.');

    if (await this._repository.getByOrdemVenda(dto.ordemVendaId))
      throw new BadRequestException(
        'Esta Ordem de Venda já possui um agendamento. Utilize o reagendamento.',
      );

    this._validarJanela(dto.janelaInicio, dto.janelaFim);

    const agendamento = await this._repository.save({
      ordemVendaId: dto.ordemVendaId,
      dataEntrega: dto.dataEntrega,
      janelaInicio: dto.janelaInicio,
      janelaFim: dto.janelaFim,
      status: AgendamentoStatusEnum.PENDENTE,
    });

    this._emitir(agendamento, 'DEFINIDO', null, this._snapshot(agendamento));

    return await this.getById(agendamento._id);
  }

  async confirmar(id: string): Promise<AgendamentoModel> {
    const agendamento = await this.getById(id);

    if (agendamento.status === AgendamentoStatusEnum.CONFIRMADO) return agendamento;

    const anterior = this._snapshot(agendamento);
    agendamento.status = AgendamentoStatusEnum.CONFIRMADO;
    await this._repository.update(id, {
      status: AgendamentoStatusEnum.CONFIRMADO,
    });

    this._emitir(agendamento, 'CONFIRMADO', anterior, this._snapshot(agendamento));

    return await this.getById(id);
  }

  async reagendar(id: string, dto: ReagendarDto): Promise<AgendamentoModel> {
    const agendamento = await this.getById(id);
    this._validarJanela(dto.janelaInicio, dto.janelaFim);

    const anterior = this._snapshot(agendamento);

    agendamento.dataEntrega = dto.dataEntrega;
    agendamento.janelaInicio = dto.janelaInicio;
    agendamento.janelaFim = dto.janelaFim;
    agendamento.status = AgendamentoStatusEnum.REAGENDADO;

    await this._repository.update(id, {
      dataEntrega: dto.dataEntrega,
      janelaInicio: dto.janelaInicio,
      janelaFim: dto.janelaFim,
      status: AgendamentoStatusEnum.REAGENDADO,
    });

    this._emitir(agendamento, 'REAGENDADO', anterior, this._snapshot(agendamento));

    return await this.getById(id);
  }

  async getById(id: string): Promise<AgendamentoModel> {
    const agendamento = await this._repository.getById(id);
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado.');
    return agendamento;
  }

  private _validarJanela(inicio: string, fim: string): void {
    if (inicio >= fim)
      throw new BadRequestException(
        'A janela de atendimento é inválida: o início deve ser anterior ao fim.',
      );
  }

  private _snapshot(
    agendamento: AgendamentoModel,
  ): Record<string, unknown> {
    return {
      dataEntrega: agendamento.dataEntrega,
      janelaInicio: agendamento.janelaInicio,
      janelaFim: agendamento.janelaFim,
      status: agendamento.status,
    };
  }

  private _emitir(
    agendamento: AgendamentoModel,
    acao: string,
    estadoAnterior: Record<string, unknown> | null,
    estadoPosterior: Record<string, unknown> | null,
  ): void {
    const payload: AuditoriaEventPayload = {
      tipoAcao: TipoAcaoEnum.AGENDAMENTO_ALTERADO,
      entidade: 'Agendamento',
      entidadeId: agendamento._id,
      estadoAnterior,
      estadoPosterior: estadoPosterior ? { acao, ...estadoPosterior } : null,
    };
    this._eventEmitter.emit(AUDITORIA_EVENTS.AGENDAMENTO_ALTERADO, payload);
  }
}
