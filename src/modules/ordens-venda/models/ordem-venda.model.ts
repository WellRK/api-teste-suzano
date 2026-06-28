import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseModel } from '../../../shared/model/base.model';
import { AgendamentoModel } from '../../agendamentos/models/agendamento.model';
import { ClienteModel } from '../../clientes/models/cliente.model';
import { TipoTransporteModel } from '../../tipos-transporte/models/tipo-transporte.model';
import { OrdemVendaStatusEnum } from '../enums/ordem-venda-status.enum';
import { OrdemVendaItemModel } from './ordem-venda-item.model';

@Entity({ name: 'ordem_venda' })
@Index('IDX_ordem_venda_created_at', ['createdAt'])
export class OrdemVendaModel extends BaseModel<OrdemVendaModel> {
  @Index({ unique: true })
  @Column({ nullable: false, unique: true })
  numero: string;

  @Index()
  @Column({
    type: 'enum',
    enum: OrdemVendaStatusEnum,
    nullable: false,
    default: OrdemVendaStatusEnum.CRIADA,
  })
  status: OrdemVendaStatusEnum;

  @Index()
  @Column({ name: 'cliente_id', type: 'uuid', nullable: false })
  clienteId: string;

  @ManyToOne(() => ClienteModel, { nullable: false, eager: false })
  @JoinColumn({ name: 'cliente_id' })
  cliente: ClienteModel;

  @Index()
  @Column({ name: 'tipo_transporte_id', type: 'uuid', nullable: false })
  tipoTransporteId: string;

  @ManyToOne(() => TipoTransporteModel, { nullable: false, eager: false })
  @JoinColumn({ name: 'tipo_transporte_id' })
  tipoTransporte: TipoTransporteModel;

  @OneToMany(() => OrdemVendaItemModel, (item) => item.ordemVenda, {
    cascade: true,
  })
  itens: OrdemVendaItemModel[];

  @OneToOne(() => AgendamentoModel, (agendamento) => agendamento.ordemVenda)
  agendamento?: AgendamentoModel;
}
