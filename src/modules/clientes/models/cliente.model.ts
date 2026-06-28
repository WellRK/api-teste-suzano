import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { BaseModel } from '../../../shared/model/base.model';
import { TipoTransporteModel } from '../../tipos-transporte/models/tipo-transporte.model';

@Entity({ name: 'cliente' })
export class ClienteModel extends BaseModel<ClienteModel> {
  @Column({ nullable: false })
  nome: string;

  @Column({ nullable: false, unique: true })
  documento: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false, default: true })
  ativo: boolean;

  @ManyToMany(() => TipoTransporteModel, (tipo) => tipo.clientes, {
    cascade: false,
  })
  @JoinTable({
    name: 'cliente_tipos_transporte',
    joinColumn: { name: 'cliente_id', referencedColumnName: '_id' },
    inverseJoinColumn: { name: 'tipo_transporte_id', referencedColumnName: '_id' },
  })
  tiposTransporte: TipoTransporteModel[];
}
