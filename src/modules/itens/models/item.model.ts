import { Column, Entity } from 'typeorm';
import { BaseModel } from '../../../shared/model/base.model';

@Entity({ name: 'item' })
export class ItemModel extends BaseModel<ItemModel> {
  @Column({ nullable: false, unique: true })
  sku: string;

  @Column({ nullable: false })
  nome: string;

  @Column({ nullable: true })
  descricao: string;

  @Column({ name: 'unidade_medida', nullable: true })
  unidadeMedida: string;

  @Column({ nullable: false, default: true })
  ativo: boolean;
}
