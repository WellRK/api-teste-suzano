import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginateResultDto } from '../../../shared/dtos/paginate-result.dto';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { TipoAcaoEnum } from '../enums/tipo-acao.enum';
import { EventoAuditoriaModel } from '../models/evento-auditoria.model';

export interface EventoAuditoriaFiltros {
  entidade?: string;
  entidadeId?: string;
  tipoAcao?: TipoAcaoEnum;
  dataInicio?: Date;
  dataFim?: Date;
  take?: number;
  skip?: number;
}

@Injectable()
export class EventoAuditoriaRepository extends BaseRepository<EventoAuditoriaModel> {
  constructor(
    @InjectRepository(EventoAuditoriaModel)
    protected readonly _model: Repository<EventoAuditoriaModel>,
  ) {
    super(_model);
  }

  async findByFiltros(
    filtros: EventoAuditoriaFiltros,
  ): Promise<PaginateResultDto> {
    const take = filtros.take ?? 20;
    const skip = filtros.skip ?? 0;

    const qb = this._model
      .createQueryBuilder('ea')
      .orderBy('ea.dataHora', 'DESC')
      .take(take)
      .skip(skip);

    if (filtros.entidade)
      qb.andWhere('ea.entidade = :entidade', { entidade: filtros.entidade });

    if (filtros.entidadeId)
      qb.andWhere('ea.entidadeId = :entidadeId', {
        entidadeId: filtros.entidadeId,
      });

    if (filtros.tipoAcao)
      qb.andWhere('ea.tipoAcao = :tipoAcao', { tipoAcao: filtros.tipoAcao });

    if (filtros.dataInicio)
      qb.andWhere('ea.dataHora >= :dataInicio', {
        dataInicio: filtros.dataInicio,
      });

    if (filtros.dataFim)
      qb.andWhere('ea.dataHora <= :dataFim', { dataFim: filtros.dataFim });

    const [result, total] = await qb.getManyAndCount();

    return new PaginateResultDto(result, total);
  }
}
