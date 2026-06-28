import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseModel } from '../../../shared/model/base.model';
import { ItemModel } from '../../itens/models/item.model';
import { OrdemVendaModel } from './ordem-venda.model';

@Entity({ name: 'ordem_venda_item' })
@Unique('UQ_ordem_venda_item', ['ordemVendaId', 'itemId'])
export class OrdemVendaItemModel extends BaseModel<OrdemVendaItemModel> {
  @Index()
  @Column({ name: 'ordem_venda_id', type: 'uuid', nullable: false })
  ordemVendaId: string;

  @ManyToOne(() => OrdemVendaModel, (ordem) => ordem.itens, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ordem_venda_id' })
  ordemVenda: OrdemVendaModel;

  @Index()
  @Column({ name: 'item_id', type: 'uuid', nullable: false })
  itemId: string;

  @ManyToOne(() => ItemModel, { nullable: false, eager: false })
  @JoinColumn({ name: 'item_id' })
  item: ItemModel;

  @Column({ type: 'int', nullable: false, default: 1 })
  quantidade: number;
}
