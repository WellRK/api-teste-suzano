import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseModel } from '../../../shared/model/base.model';
import { ClienteModel } from '../../clientes/models/cliente.model';

@Entity({ name: 'tipo_transporte' })
export class TipoTransporteModel extends BaseModel<TipoTransporteModel> {
  @Column({ nullable: false, unique: true })
  codigo: string;

  @Column({ nullable: false })
  nome: string;

  @Column({ nullable: true })
  descricao: string;

  @Column({ nullable: false, default: true })
  ativo: boolean;

  @ManyToMany(() => ClienteModel, (cliente) => cliente.tiposTransporte)
  clientes: ClienteModel[];
}
