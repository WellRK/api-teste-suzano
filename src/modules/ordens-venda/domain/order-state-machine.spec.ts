import { OrdemVendaStatusEnum } from '../enums/ordem-venda-status.enum';
import {
  InvalidStatusTransitionError,
  OrderStateMachine,
} from './order-state-machine';

/**
 * Testes unitários da máquina de estados da Ordem de Venda.
 *
 * Cobrem a regra de negócio central do fluxo operacional
 * (CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE):
 * transições válidas são aceitas e transições fora de sequência são rejeitadas.
 */
describe('OrderStateMachine', () => {
  it('define CRIADA como status inicial', () => {
    expect(OrderStateMachine.initialStatus).toBe(OrdemVendaStatusEnum.CRIADA);
  });

  describe('canTransition — transições válidas (fluxo feliz)', () => {
    const validas: [OrdemVendaStatusEnum, OrdemVendaStatusEnum][] = [
      [OrdemVendaStatusEnum.CRIADA, OrdemVendaStatusEnum.PLANEJADA],
      [OrdemVendaStatusEnum.PLANEJADA, OrdemVendaStatusEnum.AGENDADA],
      [OrdemVendaStatusEnum.AGENDADA, OrdemVendaStatusEnum.EM_TRANSPORTE],
      [OrdemVendaStatusEnum.EM_TRANSPORTE, OrdemVendaStatusEnum.ENTREGUE],
    ];

    it.each(validas)('permite %s → %s', (from, to) => {
      expect(OrderStateMachine.canTransition(from, to)).toBe(true);
      expect(OrderStateMachine.assertTransition(from, to)).toBe(to);
    });
  });

  describe('canTransition — transições inválidas (rejeitadas)', () => {
    const invalidas: [OrdemVendaStatusEnum, OrdemVendaStatusEnum][] = [
      [OrdemVendaStatusEnum.CRIADA, OrdemVendaStatusEnum.AGENDADA],
      [OrdemVendaStatusEnum.CRIADA, OrdemVendaStatusEnum.ENTREGUE],
      [OrdemVendaStatusEnum.PLANEJADA, OrdemVendaStatusEnum.EM_TRANSPORTE],
      [OrdemVendaStatusEnum.AGENDADA, OrdemVendaStatusEnum.CRIADA],
      [OrdemVendaStatusEnum.ENTREGUE, OrdemVendaStatusEnum.EM_TRANSPORTE],
    ];

    it.each(invalidas)('rejeita %s → %s', (from, to) => {
      expect(OrderStateMachine.canTransition(from, to)).toBe(false);
    });

    it('lança InvalidStatusTransitionError ao tentar transição inválida', () => {
      expect(() =>
        OrderStateMachine.assertTransition(
          OrdemVendaStatusEnum.CRIADA,
          OrdemVendaStatusEnum.AGENDADA,
        ),
      ).toThrow(InvalidStatusTransitionError);
    });

    it('mensagem do erro descreve origem, destino e transições permitidas', () => {
      try {
        OrderStateMachine.assertTransition(
          OrdemVendaStatusEnum.CRIADA,
          OrdemVendaStatusEnum.ENTREGUE,
        );
        fail('deveria ter lançado InvalidStatusTransitionError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidStatusTransitionError);
        expect((error as InvalidStatusTransitionError).from).toBe(
          OrdemVendaStatusEnum.CRIADA,
        );
        expect((error as InvalidStatusTransitionError).to).toBe(
          OrdemVendaStatusEnum.ENTREGUE,
        );
        expect((error as Error).message).toContain('PLANEJADA');
      }
    });
  });

  describe('allowedNext / isFinal', () => {
    it('lista o próximo status válido a partir de um status', () => {
      expect(OrderStateMachine.allowedNext(OrdemVendaStatusEnum.CRIADA)).toEqual(
        [OrdemVendaStatusEnum.PLANEJADA],
      );
    });

    it('considera ENTREGUE um estado terminal (sem próximas transições)', () => {
      expect(OrderStateMachine.isFinal(OrdemVendaStatusEnum.ENTREGUE)).toBe(true);
      expect(
        OrderStateMachine.allowedNext(OrdemVendaStatusEnum.ENTREGUE),
      ).toEqual([]);
    });

    it('não considera CRIADA um estado terminal', () => {
      expect(OrderStateMachine.isFinal(OrdemVendaStatusEnum.CRIADA)).toBe(false);
    });
  });
});
