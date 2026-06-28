import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AUDITORIA_EVENTS } from '../../auditoria/events/auditoria.events';
import { OrdemVendaRepository } from '../../ordens-venda/repositories/ordem-venda.repository';
import { AgendamentoStatusEnum } from '../enums/agendamento-status.enum';
import { AgendamentoRepository } from '../repositories/agendamento.repository';
import { AgendamentoService } from './agendamento.service';

/**
 * Testes unitários de `AgendamentoService` com repositórios mockados.
 *
 * Cobre o ciclo da Central de Agendamento (definir/confirmar/reagendar), a
 * validação de janela de atendimento (início < fim), a regra 1:1 com a OV e a
 * emissão dos eventos de auditoria de agendamento.
 */
describe('AgendamentoService', () => {
  const OV_ID = 'ov-1';
  const AG_ID = 'ag-1';

  let service: AgendamentoService;
  let repository: jest.Mocked<
    Pick<
      AgendamentoRepository,
      'getByOrdemVenda' | 'save' | 'getById' | 'update'
    >
  >;
  let ordemVendaRepository: jest.Mocked<Pick<OrdemVendaRepository, 'getById'>>;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;

  const agendamentoPendente = {
    _id: AG_ID,
    ordemVendaId: OV_ID,
    dataEntrega: '2026-12-15',
    janelaInicio: '08:00',
    janelaFim: '12:00',
    status: AgendamentoStatusEnum.PENDENTE,
  };

  const dtoDefinir = {
    ordemVendaId: OV_ID,
    dataEntrega: '2026-12-15',
    janelaInicio: '08:00',
    janelaFim: '12:00',
  };

  beforeEach(() => {
    repository = {
      getByOrdemVenda: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue({ ...agendamentoPendente }),
      getById: jest.fn().mockResolvedValue({ ...agendamentoPendente }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    ordemVendaRepository = {
      getById: jest.fn().mockResolvedValue({ _id: OV_ID }),
    };
    eventEmitter = { emit: jest.fn() };

    service = new AgendamentoService(
      repository as unknown as AgendamentoRepository,
      ordemVendaRepository as unknown as OrdemVendaRepository,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  describe('definir', () => {
    it('cria o agendamento PENDENTE e emite evento de auditoria', async () => {
      await service.definir(dtoDefinir as any);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ordemVendaId: OV_ID,
          status: AgendamentoStatusEnum.PENDENTE,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AUDITORIA_EVENTS.AGENDAMENTO_ALTERADO,
        expect.objectContaining({ entidade: 'Agendamento' }),
      );
    });

    it('rejeita (404) quando a Ordem de Venda não existe', async () => {
      ordemVendaRepository.getById.mockResolvedValue(null);

      await expect(service.definir(dtoDefinir as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejeita (400) quando a OV já possui agendamento', async () => {
      repository.getByOrdemVenda.mockResolvedValue({
        ...agendamentoPendente,
      } as any);

      await expect(service.definir(dtoDefinir as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejeita (400) quando a janela é inválida (início >= fim)', async () => {
      await expect(
        service.definir({
          ...dtoDefinir,
          janelaInicio: '12:00',
          janelaFim: '08:00',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('confirmar', () => {
    it('altera o status para CONFIRMADO e emite evento', async () => {
      await service.confirmar(AG_ID);

      expect(repository.update).toHaveBeenCalledWith(AG_ID, {
        status: AgendamentoStatusEnum.CONFIRMADO,
      });
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('é idempotente quando já está CONFIRMADO (sem update nem evento)', async () => {
      repository.getById.mockResolvedValue({
        ...agendamentoPendente,
        status: AgendamentoStatusEnum.CONFIRMADO,
      } as any);

      await service.confirmar(AG_ID);

      expect(repository.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('reagendar', () => {
    it('atualiza data/janela, marca REAGENDADO e emite evento', async () => {
      await service.reagendar(AG_ID, {
        dataEntrega: '2027-01-20',
        janelaInicio: '14:00',
        janelaFim: '18:00',
      } as any);

      expect(repository.update).toHaveBeenCalledWith(
        AG_ID,
        expect.objectContaining({
          dataEntrega: '2027-01-20',
          janelaInicio: '14:00',
          janelaFim: '18:00',
          status: AgendamentoStatusEnum.REAGENDADO,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AUDITORIA_EVENTS.AGENDAMENTO_ALTERADO,
        expect.objectContaining({ entidade: 'Agendamento' }),
      );
    });

    it('rejeita (400) quando a nova janela é inválida', async () => {
      await expect(
        service.reagendar(AG_ID, {
          dataEntrega: '2027-01-20',
          janelaInicio: '18:00',
          janelaFim: '14:00',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
