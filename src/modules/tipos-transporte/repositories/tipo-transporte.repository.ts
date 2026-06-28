import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { TipoTransporteModel } from '../models/tipo-transporte.model';

@Injectable()
export class TipoTransporteRepository extends BaseRepository<TipoTransporteModel> {
  constructor(
    @InjectRepository(TipoTransporteModel)
    protected readonly _model: Repository<TipoTransporteModel>,
  ) {
    super(_model);
  }

  override async list(): Promise<TipoTransporteModel[]> {
    return await this._model.find({ order: { nome: 'ASC' } });
  }

  async getByCodigo(codigo: string): Promise<TipoTransporteModel | null> {
    return await this._model.findOne({ where: { codigo } });
  }

  async getByIds(ids: string[]): Promise<TipoTransporteModel[]> {
    return await this._model.find({ where: { _id: In(ids) } });
  }
}
