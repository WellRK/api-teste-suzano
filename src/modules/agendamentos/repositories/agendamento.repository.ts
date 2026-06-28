import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { AgendamentoModel } from '../models/agendamento.model';

@Injectable()
export class AgendamentoRepository extends BaseRepository<AgendamentoModel> {
  constructor(
    @InjectRepository(AgendamentoModel)
    protected readonly _model: Repository<AgendamentoModel>,
  ) {
    super(_model);
  }

  override async getById(_id: string): Promise<AgendamentoModel | null> {
    return await this._model.findOne({
      where: { _id },
      relations: ['ordemVenda'],
    });
  }

  async getByOrdemVenda(
    ordemVendaId: string,
  ): Promise<AgendamentoModel | null> {
    return await this._model.findOne({ where: { ordemVendaId } });
  }
}
