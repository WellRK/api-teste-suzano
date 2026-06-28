import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { ItemModel } from '../models/item.model';

@Injectable()
export class ItemRepository extends BaseRepository<ItemModel> {
  constructor(
    @InjectRepository(ItemModel)
    protected readonly _model: Repository<ItemModel>,
  ) {
    super(_model);
  }

  override async list(): Promise<ItemModel[]> {
    return await this._model.find({ order: { nome: 'ASC' } });
  }

  async getBySku(sku: string): Promise<ItemModel | null> {
    return await this._model.findOne({ where: { sku } });
  }

  async getByIds(ids: string[]): Promise<ItemModel[]> {
    return await this._model.find({ where: { _id: In(ids) } });
  }
}
