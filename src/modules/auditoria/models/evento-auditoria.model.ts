import { Column, Entity, Index } from 'typeorm';
import { BaseModel } from '../../../shared/model/base.model';
import { TipoAcaoEnum } from '../enums/tipo-acao.enum';

@Entity({ name: 'evento_auditoria' })
@Index('IDX_evento_auditoria_entidade', ['entidade', 'entidadeId'])
export class EventoAuditoriaModel extends BaseModel<EventoAuditoriaModel> {
  @Index()
  @Column({ name: 'data_hora', type: 'timestamp', nullable: false })
  dataHora: Date;

  @Index()
  @Column({ name: 'tipo_acao', type: 'enum', enum: TipoAcaoEnum, nullable: false })
  tipoAcao: TipoAcaoEnum;

  @Column({ nullable: false })
  entidade: string;

  @Column({ name: 'entidade_id', type: 'uuid', nullable: false })
  entidadeId: string;

  @Column({ name: 'estado_anterior', type: 'jsonb', nullable: true })
  estadoAnterior: Record<string, unknown> | null;

  @Column({ name: 'estado_posterior', type: 'jsonb', nullable: true })
  estadoPosterior: Record<string, unknown> | null;
}
