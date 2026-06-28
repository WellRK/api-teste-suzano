import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginateResultDto } from '../../../shared/dtos/paginate-result.dto';
import { AgendamentoStatusEnum } from '../../agendamentos/enums/agendamento-status.enum';
import { TipoAcaoEnum } from '../../auditoria/enums/tipo-acao.enum';
import {
  AUDITORIA_EVENTS,
  AuditoriaEventPayload,
} from '../../auditoria/events/auditoria.events';
import { ClienteRepository } from '../../clientes/repositories/cliente.repository';
import { ItemRepository } from '../../itens/repositories/item.repository';
import { TipoTransporteRepository } from '../../tipos-transporte/repositories/tipo-transporte.repository';
import {
  InvalidStatusTransitionError,
  OrderStateMachine,
} from '../domain/order-state-machine';
import { CreateOrdemVendaDto } from '../dtos/create-ordem-venda.dto';
import { OrdemVendaStatusEnum } from '../enums/ordem-venda-status.enum';
import { OrdemVendaItemModel } from '../models/ordem-venda-item.model';
import { OrdemVendaModel } from '../models/ordem-venda.model';
import {
  OrdemVendaFiltros,
  OrdemVendaRepository,
} from '../repositories/ordem-venda.repository';

@Injectable()
export class OrdemVendaService {
  constructor(
    private readonly _repository: OrdemVendaRepository,
    private readonly _clienteRepository: ClienteRepository,
    private readonly _tipoTransporteRepository: TipoTransporteRepository,
    private readonly _itemRepository: ItemRepository,
    private readonly _eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateOrdemVendaDto): Promise<OrdemVendaModel> {
    const cliente = await this._clienteRepository.getById(dto.clienteId);
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');

    const tipoTransporte = await this._tipoTransporteRepository.getById(
      dto.tipoTransporteId,
    );
    if (!tipoTransporte)
      throw new NotFoundException('Tipo de transporte não encontrado.');

    const autorizado = (cliente.tiposTransporte ?? []).some(
      (tipo) => tipo._id === dto.tipoTransporteId,
    );
    if (!autorizado)
      throw new BadRequestException(
        `O tipo de transporte '${tipoTransporte.nome}' não está autorizado para o cliente '${cliente.nome}'.`,
      );

    const itens = await this._buildItens(dto);

    const numero = await this._gerarNumero();

    const ordem = await this._repository.save({
      numero,
      status: OrderStateMachine.initialStatus,
      clienteId: dto.clienteId,
      tipoTransporteId: dto.tipoTransporteId,
      itens,
    });

    const completa = await this.getById(ordem._id);

    this._emitir({
      tipoAcao: TipoAcaoEnum.OV_CRIADA,
      entidade: 'OrdemVenda',
      entidadeId: completa._id,
      estadoAnterior: null,
      estadoPosterior: this._snapshot(completa),
    });

    return completa;
  }

  async list(): Promise<OrdemVendaModel[]> {
    return await this._repository.list();
  }

  async findByFiltros(filtros: OrdemVendaFiltros): Promise<PaginateResultDto> {
    return await this._repository.findByFiltros(filtros);
  }

  async getById(id: string): Promise<OrdemVendaModel> {
    const ordem = await this._repository.getById(id);
    if (!ordem) throw new NotFoundException('Ordem de Venda não encontrada.');
    return ordem;
  }

  async updateStatus(
    id: string,
    novoStatus: OrdemVendaStatusEnum,
  ): Promise<OrdemVendaModel> {
    const ordem = await this.getById(id);
    const statusAnterior = ordem.status;

    try {
      OrderStateMachine.assertTransition(ordem.status, novoStatus);
    } catch (error) {
      if (error instanceof InvalidStatusTransitionError)
        throw new ConflictException(error.message);
      throw error;
    }

    if (novoStatus === OrdemVendaStatusEnum.AGENDADA) {
      const agendamentoConfirmado =
        ordem.agendamento?.status === AgendamentoStatusEnum.CONFIRMADO;
      if (!agendamentoConfirmado)
        throw new ConflictException(
          'A Ordem de Venda só pode ir para AGENDADA com um agendamento CONFIRMADO.',
        );
    }

    await this._repository.update(id, { status: novoStatus });

    this._emitir({
      tipoAcao: TipoAcaoEnum.OV_STATUS_ALTERADO,
      entidade: 'OrdemVenda',
      entidadeId: id,
      estadoAnterior: { status: statusAnterior },
      estadoPosterior: { status: novoStatus },
    });

    return await this.getById(id);
  }

  async updateTransporte(
    id: string,
    novoTipoTransporteId: string,
  ): Promise<OrdemVendaModel> {
    const ordem = await this.getById(id);
    const tipoAnterior = ordem.tipoTransporteId;

    if (tipoAnterior === novoTipoTransporteId) return ordem;

    const tipoTransporte = await this._tipoTransporteRepository.getById(
      novoTipoTransporteId,
    );
    if (!tipoTransporte)
      throw new NotFoundException('Tipo de transporte não encontrado.');

    const cliente = await this._clienteRepository.getById(ordem.clienteId);
    const autorizado = (cliente?.tiposTransporte ?? []).some(
      (tipo) => tipo._id === novoTipoTransporteId,
    );
    if (!autorizado)
      throw new BadRequestException(
        `O tipo de transporte '${tipoTransporte.nome}' não está autorizado para o cliente '${cliente?.nome}'.`,
      );

    await this._repository.update(id, {
      tipoTransporteId: novoTipoTransporteId,
    });

    this._emitir({
      tipoAcao: TipoAcaoEnum.OV_TRANSPORTE_ALTERADO,
      entidade: 'OrdemVenda',
      entidadeId: id,
      estadoAnterior: { tipoTransporteId: tipoAnterior },
      estadoPosterior: { tipoTransporteId: novoTipoTransporteId },
    });

    return await this.getById(id);
  }

  private async _buildItens(
    dto: CreateOrdemVendaDto,
  ): Promise<Partial<OrdemVendaItemModel>[]> {
    const idsUnicos = [...new Set(dto.itens.map((i) => i.itemId))];
    if (idsUnicos.length !== dto.itens.length)
      throw new BadRequestException(
        'A Ordem de Venda não pode conter o mesmo item repetido.',
      );

    const itens = await this._itemRepository.getByIds(idsUnicos);
    if (itens.length !== idsUnicos.length) {
      const encontrados = itens.map((i) => i._id);
      const faltando = idsUnicos.filter((id) => !encontrados.includes(id));
      throw new BadRequestException(
        `Item(ns) não encontrado(s): ${faltando.join(', ')}.`,
      );
    }

    return dto.itens.map((i) => ({
      itemId: i.itemId,
      quantidade: i.quantidade,
    }));
  }

  private async _gerarNumero(): Promise<string> {
    const total = await this._repository.count();
    const sequencial = String(total + 1).padStart(6, '0');
    return `OV-${new Date().getFullYear()}-${sequencial}`;
  }

  private _snapshot(ordem: OrdemVendaModel): Record<string, unknown> {
    return {
      numero: ordem.numero,
      status: ordem.status,
      clienteId: ordem.clienteId,
      tipoTransporteId: ordem.tipoTransporteId,
      itens: (ordem.itens ?? []).map((i) => ({
        itemId: i.itemId,
        quantidade: i.quantidade,
      })),
    };
  }

  private _emitir(payload: AuditoriaEventPayload): void {
    const eventName =
      payload.tipoAcao === TipoAcaoEnum.OV_CRIADA
        ? AUDITORIA_EVENTS.OV_CRIADA
        : payload.tipoAcao === TipoAcaoEnum.OV_STATUS_ALTERADO
          ? AUDITORIA_EVENTS.OV_STATUS_ALTERADO
          : AUDITORIA_EVENTS.OV_TRANSPORTE_ALTERADO;
    this._eventEmitter.emit(eventName, payload);
  }
}
