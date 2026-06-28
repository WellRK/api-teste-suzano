import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CreateTipoTransporteDto } from '../dtos/create-tipo-transporte.dto';
import { UpdateTipoTransporteDto } from '../dtos/update-tipo-transporte.dto';
import { TipoTransporteModel } from '../models/tipo-transporte.model';
import { TipoTransporteRepository } from '../repositories/tipo-transporte.repository';

@Injectable()
export class TipoTransporteService {
  /** Chave única da listagem (catálogo de baixa volatilidade). */
  private static readonly LIST_CACHE_KEY = 'tipos-transporte:list';

  constructor(
    private readonly _repository: TipoTransporteRepository,
    @Inject(CACHE_MANAGER) private readonly _cache: Cache,
  ) {}

  async create(dto: CreateTipoTransporteDto): Promise<TipoTransporteModel> {
    const exists = await this._repository.getByCodigo(dto.codigo);
    if (exists)
      throw new BadRequestException(
        `Já existe um tipo de transporte com o código '${dto.codigo}'.`,
      );

    const created = await this._repository.save({
      codigo: dto.codigo,
      nome: dto.nome,
      descricao: dto.descricao,
      ativo: dto.ativo ?? true,
    });

    await this._cache.del(TipoTransporteService.LIST_CACHE_KEY);
    return created;
  }

  async list(): Promise<TipoTransporteModel[]> {
    const cached = await this._cache.get<TipoTransporteModel[]>(
      TipoTransporteService.LIST_CACHE_KEY,
    );
    if (cached) return cached;

    const tipos = await this._repository.list();
    await this._cache.set(TipoTransporteService.LIST_CACHE_KEY, tipos);
    return tipos;
  }

  async getById(id: string): Promise<TipoTransporteModel> {
    const tipo = await this._repository.getById(id);
    if (!tipo)
      throw new NotFoundException('Tipo de transporte não encontrado.');
    return tipo;
  }

  async update(
    id: string,
    dto: UpdateTipoTransporteDto,
  ): Promise<TipoTransporteModel> {
    const tipo = await this.getById(id);

    if (dto.nome !== undefined) tipo.nome = dto.nome;
    if (dto.descricao !== undefined) tipo.descricao = dto.descricao;
    if (dto.ativo !== undefined) tipo.ativo = dto.ativo;

    await this._repository.update(id, {
      nome: tipo.nome,
      descricao: tipo.descricao,
      ativo: tipo.ativo,
    });

    await this._cache.del(TipoTransporteService.LIST_CACHE_KEY);
    return tipo;
  }
}
