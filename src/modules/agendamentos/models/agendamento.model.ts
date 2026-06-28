import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseModel } from '../../../shared/model/base.model';
import { OrdemVendaModel } from '../../ordens-venda/models/ordem-venda.model';
import { AgendamentoStatusEnum } from '../enums/agendamento-status.enum';

@Entity({ name: 'agendamento' })
export class AgendamentoModel extends BaseModel<AgendamentoModel> {
  @Index({ unique: true })
  @Column({ name: 'ordem_venda_id', type: 'uuid', nullable: false })
  ordemVendaId: string;

  @OneToOne(() => OrdemVendaModel, (ordem) => ordem.agendamento, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ordem_venda_id' })
  ordemVenda: OrdemVendaModel;

  @Index()
  @Column({ name: 'data_entrega', type: 'date', nullable: false })
  dataEntrega: string;

  @Column({ name: 'janela_inicio', type: 'time', nullable: false })
  janelaInicio: string;

  @Column({ name: 'janela_fim', type: 'time', nullable: false })
  janelaFim: string;

  @Index()
  @Column({
    type: 'enum',
    enum: AgendamentoStatusEnum,
    nullable: false,
    default: AgendamentoStatusEnum.PENDENTE,
  })
  status: AgendamentoStatusEnum;
}
