import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { PaginateResultDto } from '../../../shared/dtos/paginate-result.dto';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { OrdemVendaStatusEnum } from '../enums/ordem-venda-status.enum';
import { OrdemVendaModel } from '../models/ordem-venda.model';

export interface OrdemVendaFiltros {
  status?: OrdemVendaStatusEnum;
  clienteId?: string;
  tipoTransporteId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  take?: number;
  skip?: number;
}

@Injectable()
export class OrdemVendaRepository extends BaseRepository<OrdemVendaModel> {
  constructor(
    @InjectRepository(OrdemVendaModel)
    protected readonly _model: Repository<OrdemVendaModel>,
  ) {
    super(_model);
  }

  override async getById(_id: string): Promise<OrdemVendaModel | null> {
    return await this._model.findOne({
      where: { _id },
      relations: [
        'cliente',
        'tipoTransporte',
        'itens',
        'itens.item',
        'agendamento',
      ],
    });
  }

  override async list(): Promise<OrdemVendaModel[]> {
    return await this._model.find({
      order: { createdAt: 'DESC' },
      relations: ['cliente', 'tipoTransporte'],
    });
  }

  /**
   * Lista paginada com filtros combináveis (status, cliente, tipo de transporte, data).
   * Usa query builder para gerar SQL enxuto e tirar proveito dos índices.
   * Retorna `PaginateResultDto` com o total de registros que satisfazem o filtro
   * (independente da paginação), para alimentar a navegação no cliente.
   */
  async findByFiltros(filtros: OrdemVendaFiltros): Promise<PaginateResultDto> {
    const take = filtros.take ?? 10;
    const skip = filtros.skip ?? 0;

    const qb = this._model
      .createQueryBuilder('ov')
      .leftJoinAndSelect('ov.cliente', 'cliente')
      .leftJoinAndSelect('ov.tipoTransporte', 'tipoTransporte')
      .orderBy('ov.createdAt', 'DESC')
      .take(take)
      .skip(skip);

    if (filtros.status)
      qb.andWhere('ov.status = :status', { status: filtros.status });

    if (filtros.clienteId)
      qb.andWhere('ov.clienteId = :clienteId', {
        clienteId: filtros.clienteId,
      });

    if (filtros.tipoTransporteId)
      qb.andWhere('ov.tipoTransporteId = :tipoTransporteId', {
        tipoTransporteId: filtros.tipoTransporteId,
      });

    if (filtros.dataInicio && filtros.dataFim) {
      qb.andWhere(
        new Brackets((w) =>
          w.where('ov.createdAt BETWEEN :dataInicio AND :dataFim', {
            dataInicio: filtros.dataInicio,
            dataFim: filtros.dataFim,
          }),
        ),
      );
    } else if (filtros.dataInicio) {
      qb.andWhere('ov.createdAt >= :dataInicio', {
        dataInicio: filtros.dataInicio,
      });
    } else if (filtros.dataFim) {
      qb.andWhere('ov.createdAt <= :dataFim', { dataFim: filtros.dataFim });
    }

    const [result, total] = await qb.getManyAndCount();

    return new PaginateResultDto(result, total);
  }

  /** Total de OVs já registradas — base para gerar o número sequencial. */
  async count(): Promise<number> {
    return await this._model.count();
  }
}
