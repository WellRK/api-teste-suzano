import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgendamentoStatusEnum } from '../../agendamentos/enums/agendamento-status.enum';
import { AUDITORIA_EVENTS } from '../../auditoria/events/auditoria.events';
import { ClienteRepository } from '../../clientes/repositories/cliente.repository';
import { ItemRepository } from '../../itens/repositories/item.repository';
import { TipoTransporteRepository } from '../../tipos-transporte/repositories/tipo-transporte.repository';
import { CreateOrdemVendaDto } from '../dtos/create-ordem-venda.dto';
import { OrdemVendaStatusEnum } from '../enums/ordem-venda-status.enum';
import { OrdemVendaRepository } from '../repositories/ordem-venda.repository';
import { OrdemVendaService } from './ordem-venda.service';

/**
 * Testes unitários de `OrdemVendaService.create` com repositórios mockados.
 *
 * Foco nas invariantes de negócio da criação de Ordem de Venda:
 *  - tipo de transporte deve estar autorizado para o cliente;
 *  - cliente e tipo de transporte devem existir;
 *  - todos os itens informados devem existir previamente;
 *  - em caso de sucesso, emite o evento de auditoria `ov.criada`.
 */
describe('OrdemVendaService.create', () => {
  const TIPO_AUTORIZADO_ID = '11111111-1111-1111-1111-111111111111';
  const TIPO_NAO_AUTORIZADO_ID = '22222222-2222-2222-2222-222222222222';
  const CLIENTE_ID = '33333333-3333-3333-3333-333333333333';
  const ITEM_ID = '44444444-4444-4444-4444-444444444444';

  let service: OrdemVendaService;
  let repository: jest.Mocked<Pick<OrdemVendaRepository, 'save' | 'getById' | 'count'>>;
  let clienteRepository: jest.Mocked<Pick<ClienteRepository, 'getById'>>;
  let tipoTransporteRepository: jest.Mocked<Pick<TipoTransporteRepository, 'getById'>>;
  let itemRepository: jest.Mocked<Pick<ItemRepository, 'getByIds'>>;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;

  const clienteAutorizado = {
    _id: CLIENTE_ID,
    nome: 'Indústria Acme Ltda',
    tiposTransporte: [{ _id: TIPO_AUTORIZADO_ID, nome: 'Caminhão' }],
  };

  const dtoValido: CreateOrdemVendaDto = {
    clienteId: CLIENTE_ID,
    tipoTransporteId: TIPO_AUTORIZADO_ID,
    itens: [{ itemId: ITEM_ID, quantidade: 5 }],
  };

  beforeEach(() => {
    repository = {
      save: jest.fn().mockResolvedValue({ _id: 'ov-id' }),
      getById: jest.fn().mockResolvedValue({
        _id: 'ov-id',
        numero: 'OV-2026-000001',
        status: OrdemVendaStatusEnum.CRIADA,
        clienteId: CLIENTE_ID,
        tipoTransporteId: TIPO_AUTORIZADO_ID,
        itens: [{ itemId: ITEM_ID, quantidade: 5 }],
      }),
      count: jest.fn().mockResolvedValue(0),
    };
    clienteRepository = {
      getById: jest.fn().mockResolvedValue(clienteAutorizado),
    };
    tipoTransporteRepository = {
      getById: jest.fn().mockResolvedValue({
        _id: TIPO_AUTORIZADO_ID,
        nome: 'Caminhão',
      }),
    };
    itemRepository = {
      getByIds: jest.fn().mockResolvedValue([{ _id: ITEM_ID }]),
    };
    eventEmitter = { emit: jest.fn() };

    service = new OrdemVendaService(
      repository as unknown as OrdemVendaRepository,
      clienteRepository as unknown as ClienteRepository,
      tipoTransporteRepository as unknown as TipoTransporteRepository,
      itemRepository as unknown as ItemRepository,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  it('cria a OV com status inicial CRIADA quando o transporte está autorizado', async () => {
    const ordem = await service.create(dtoValido);

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: OrdemVendaStatusEnum.CRIADA,
        clienteId: CLIENTE_ID,
        tipoTransporteId: TIPO_AUTORIZADO_ID,
        numero: 'OV-2026-000001',
        itens: [{ itemId: ITEM_ID, quantidade: 5 }],
      }),
    );
    expect(ordem.status).toBe(OrdemVendaStatusEnum.CRIADA);
  });

  it('emite o evento de auditoria ov.criada ao criar com sucesso', async () => {
    await service.create(dtoValido);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AUDITORIA_EVENTS.OV_CRIADA,
      expect.objectContaining({
        entidade: 'OrdemVenda',
        estadoAnterior: null,
      }),
    );
  });

  it('rejeita (400) quando o tipo de transporte não está autorizado para o cliente', async () => {
    tipoTransporteRepository.getById.mockResolvedValue({
      _id: TIPO_NAO_AUTORIZADO_ID,
      nome: 'Carreta',
    } as any);

    await expect(
      service.create({ ...dtoValido, tipoTransporteId: TIPO_NAO_AUTORIZADO_ID }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.save).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('rejeita (404) quando o cliente não existe', async () => {
    clienteRepository.getById.mockResolvedValue(null);

    await expect(service.create(dtoValido)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejeita (404) quando o tipo de transporte não existe', async () => {
    tipoTransporteRepository.getById.mockResolvedValue(null);

    await expect(service.create(dtoValido)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejeita (400) quando algum item informado não existe', async () => {
    itemRepository.getByIds.mockResolvedValue([]);

    await expect(service.create(dtoValido)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejeita (400) quando há item repetido na mesma OV', async () => {
    await expect(
      service.create({
        ...dtoValido,
        itens: [
          { itemId: ITEM_ID, quantidade: 1 },
          { itemId: ITEM_ID, quantidade: 2 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});

/**
 * Testes unitários de `OrdemVendaService.updateStatus`.
 *
 * Cobre a máquina de estados aplicada ao caso de uso (transição válida vs.
 * inválida → 409) e a regra de acoplamento: ir para AGENDADA exige agendamento
 * CONFIRMADO.
 */
describe('OrdemVendaService.updateStatus', () => {
  const OV_ID = 'ov-id';

  let service: OrdemVendaService;
  let repository: jest.Mocked<
    Pick<OrdemVendaRepository, 'getById' | 'update'>
  >;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;

  const buildService = (ordem: Record<string, unknown>) => {
    repository = {
      getById: jest.fn().mockResolvedValue(ordem),
      update: jest.fn().mockResolvedValue(undefined),
    };
    eventEmitter = { emit: jest.fn() };
    service = new OrdemVendaService(
      repository as unknown as OrdemVendaRepository,
      {} as unknown as ClienteRepository,
      {} as unknown as TipoTransporteRepository,
      {} as unknown as ItemRepository,
      eventEmitter as unknown as EventEmitter2,
    );
  };

  it('transição válida CRIADA → PLANEJADA: persiste e emite OV_STATUS_ALTERADO', async () => {
    buildService({ _id: OV_ID, status: OrdemVendaStatusEnum.CRIADA });

    await service.updateStatus(OV_ID, OrdemVendaStatusEnum.PLANEJADA);

    expect(repository.update).toHaveBeenCalledWith(OV_ID, {
      status: OrdemVendaStatusEnum.PLANEJADA,
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AUDITORIA_EVENTS.OV_STATUS_ALTERADO,
      expect.objectContaining({
        estadoAnterior: { status: OrdemVendaStatusEnum.CRIADA },
        estadoPosterior: { status: OrdemVendaStatusEnum.PLANEJADA },
      }),
    );
  });

  it('transição inválida CRIADA → AGENDADA: lança ConflictException (409)', async () => {
    buildService({ _id: OV_ID, status: OrdemVendaStatusEnum.CRIADA });

    await expect(
      service.updateStatus(OV_ID, OrdemVendaStatusEnum.AGENDADA),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('PLANEJADA → AGENDADA sem agendamento CONFIRMADO: 409', async () => {
    buildService({
      _id: OV_ID,
      status: OrdemVendaStatusEnum.PLANEJADA,
      agendamento: { status: AgendamentoStatusEnum.PENDENTE },
    });

    await expect(
      service.updateStatus(OV_ID, OrdemVendaStatusEnum.AGENDADA),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('PLANEJADA → AGENDADA com agendamento CONFIRMADO: sucesso', async () => {
    buildService({
      _id: OV_ID,
      status: OrdemVendaStatusEnum.PLANEJADA,
      agendamento: { status: AgendamentoStatusEnum.CONFIRMADO },
    });

    await service.updateStatus(OV_ID, OrdemVendaStatusEnum.AGENDADA);

    expect(repository.update).toHaveBeenCalledWith(OV_ID, {
      status: OrdemVendaStatusEnum.AGENDADA,
    });
  });
});

/**
 * Testes unitários de `OrdemVendaService.updateTransporte`.
 *
 * Cobre a revalidação de autorização de transporte ao alterar o tipo de uma OV
 * existente e a emissão do evento de auditoria de alteração de transporte.
 */
describe('OrdemVendaService.updateTransporte', () => {
  const OV_ID = 'ov-id';
  const CLIENTE_ID = 'cli-id';
  const TIPO_ATUAL = 'tt-atual';
  const TIPO_AUTORIZADO = 'tt-autorizado';
  const TIPO_NAO_AUTORIZADO = 'tt-nao-autorizado';

  let service: OrdemVendaService;
  let repository: jest.Mocked<Pick<OrdemVendaRepository, 'getById' | 'update'>>;
  let clienteRepository: jest.Mocked<Pick<ClienteRepository, 'getById'>>;
  let tipoTransporteRepository: jest.Mocked<
    Pick<TipoTransporteRepository, 'getById'>
  >;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;

  beforeEach(() => {
    repository = {
      getById: jest.fn().mockResolvedValue({
        _id: OV_ID,
        clienteId: CLIENTE_ID,
        tipoTransporteId: TIPO_ATUAL,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    tipoTransporteRepository = {
      getById: jest.fn().mockResolvedValue({ _id: TIPO_AUTORIZADO, nome: 'Carreta' }),
    };
    clienteRepository = {
      getById: jest.fn().mockResolvedValue({
        _id: CLIENTE_ID,
        nome: 'Acme',
        tiposTransporte: [{ _id: TIPO_AUTORIZADO }],
      }),
    };
    eventEmitter = { emit: jest.fn() };
    service = new OrdemVendaService(
      repository as unknown as OrdemVendaRepository,
      clienteRepository as unknown as ClienteRepository,
      tipoTransporteRepository as unknown as TipoTransporteRepository,
      {} as unknown as ItemRepository,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  it('altera o transporte quando o novo tipo está autorizado e emite evento', async () => {
    await service.updateTransporte(OV_ID, TIPO_AUTORIZADO);

    expect(repository.update).toHaveBeenCalledWith(OV_ID, {
      tipoTransporteId: TIPO_AUTORIZADO,
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AUDITORIA_EVENTS.OV_TRANSPORTE_ALTERADO,
      expect.objectContaining({
        estadoAnterior: { tipoTransporteId: TIPO_ATUAL },
        estadoPosterior: { tipoTransporteId: TIPO_AUTORIZADO },
      }),
    );
  });

  it('rejeita (400) quando o novo tipo não está autorizado para o cliente', async () => {
    tipoTransporteRepository.getById.mockResolvedValue({
      _id: TIPO_NAO_AUTORIZADO,
      nome: 'Bi-truck',
    } as any);

    await expect(
      service.updateTransporte(OV_ID, TIPO_NAO_AUTORIZADO),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejeita (404) quando o novo tipo de transporte não existe', async () => {
    tipoTransporteRepository.getById.mockResolvedValue(null);

    await expect(
      service.updateTransporte(OV_ID, 'inexistente'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('é no-op quando o tipo informado é igual ao atual (sem update nem evento)', async () => {
    await service.updateTransporte(OV_ID, TIPO_ATUAL);

    expect(repository.update).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});
