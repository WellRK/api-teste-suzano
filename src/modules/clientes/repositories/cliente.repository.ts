import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { ClienteModel } from '../models/cliente.model';

@Injectable()
export class ClienteRepository extends BaseRepository<ClienteModel> {
  constructor(
    @InjectRepository(ClienteModel)
    protected readonly _model: Repository<ClienteModel>,
  ) {
    super(_model);
  }

  override async list(): Promise<ClienteModel[]> {
    return await this._model.find({
      order: { nome: 'ASC' },
      relations: ['tiposTransporte'],
    });
  }

  override async getById(_id: string): Promise<ClienteModel | null> {
    return await this._model.findOne({
      where: { _id },
      relations: ['tiposTransporte'],
    });
  }

  async getByDocumento(documento: string): Promise<ClienteModel | null> {
    return await this._model.findOne({ where: { documento } });
  }

  async getByEmail(email: string): Promise<ClienteModel | null> {
    return await this._model.findOne({ where: { email } });
  }
}
