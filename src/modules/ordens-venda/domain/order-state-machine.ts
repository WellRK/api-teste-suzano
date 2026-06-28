import { OrdemVendaStatusEnum } from '../enums/ordem-venda-status.enum';

/**
 * Máquina de estados da Ordem de Venda.
 *
 * Fluxo: CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE.
 *
 * Regra puro-domínio (sem dependências de framework/persistência) para
 * permitir teste isolado. As transições são declaradas em um mapa explícito,
 * mantendo o comportamento extensível por dado e não por `if/switch`.
 */
export class InvalidStatusTransitionError extends Error {
  constructor(
    public readonly from: OrdemVendaStatusEnum,
    public readonly to: OrdemVendaStatusEnum,
  ) {
    super(
      `Transição de status inválida: '${from}' → '${to}'. ` +
        `Transições permitidas a partir de '${from}': ` +
        `${OrderStateMachine.allowedNext(from).join(', ') || 'nenhuma'}.`,
    );
    this.name = 'InvalidStatusTransitionError';
  }
}

export class OrderStateMachine {
  private static readonly transitions: Record<
    OrdemVendaStatusEnum,
    OrdemVendaStatusEnum[]
  > = {
    [OrdemVendaStatusEnum.CRIADA]: [OrdemVendaStatusEnum.PLANEJADA],
    [OrdemVendaStatusEnum.PLANEJADA]: [OrdemVendaStatusEnum.AGENDADA],
    [OrdemVendaStatusEnum.AGENDADA]: [OrdemVendaStatusEnum.EM_TRANSPORTE],
    [OrdemVendaStatusEnum.EM_TRANSPORTE]: [OrdemVendaStatusEnum.ENTREGUE],
    [OrdemVendaStatusEnum.ENTREGUE]: [],
  };

  /** Status inicial de toda Ordem de Venda recém-criada. */
  static readonly initialStatus = OrdemVendaStatusEnum.CRIADA;

  /** Lista os próximos status válidos a partir de um status atual. */
  static allowedNext(from: OrdemVendaStatusEnum): OrdemVendaStatusEnum[] {
    return this.transitions[from] ?? [];
  }

  /** Indica se a transição `from → to` é permitida pelo fluxo operacional. */
  static canTransition(
    from: OrdemVendaStatusEnum,
    to: OrdemVendaStatusEnum,
  ): boolean {
    return this.allowedNext(from).includes(to);
  }

  /**
   * Valida a transição e retorna o novo status; lança
   * {@link InvalidStatusTransitionError} se a transição for inválida.
   */
  static assertTransition(
    from: OrdemVendaStatusEnum,
    to: OrdemVendaStatusEnum,
  ): OrdemVendaStatusEnum {
    if (!this.canTransition(from, to)) {
      throw new InvalidStatusTransitionError(from, to);
    }
    return to;
  }

  /** Indica se o status é terminal (não admite novas transições). */
  static isFinal(status: OrdemVendaStatusEnum): boolean {
    return this.allowedNext(status).length === 0;
  }
}
