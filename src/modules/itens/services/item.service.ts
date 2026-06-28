import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CreateItemDto } from '../dtos/create-item.dto';
import { ItemModel } from '../models/item.model';
import { ItemRepository } from '../repositories/item.repository';

@Injectable()
export class ItemService {
  /** Chave única da listagem de itens no cache (catálogo de baixa volatilidade). */
  private static readonly LIST_CACHE_KEY = 'itens:list';

  constructor(
    private readonly _repository: ItemRepository,
    @Inject(CACHE_MANAGER) private readonly _cache: Cache,
  ) {}

  async create(dto: CreateItemDto): Promise<ItemModel> {
    const exists = await this._repository.getBySku(dto.sku);
    if (exists)
      throw new BadRequestException(
        `Já existe um item com o SKU '${dto.sku}'.`,
      );

    const created = await this._repository.save({
      sku: dto.sku,
      nome: dto.nome,
      descricao: dto.descricao,
      unidadeMedida: dto.unidadeMedida,
      ativo: dto.ativo ?? true,
    });

    await this._cache.del(ItemService.LIST_CACHE_KEY);
    return created;
  }

  async list(): Promise<ItemModel[]> {
    const cached = await this._cache.get<ItemModel[]>(
      ItemService.LIST_CACHE_KEY,
    );
    if (cached) return cached;

    const itens = await this._repository.list();
    await this._cache.set(ItemService.LIST_CACHE_KEY, itens);
    return itens;
  }

  async getById(id: string): Promise<ItemModel> {
    const item = await this._repository.getById(id);
    if (!item) throw new NotFoundException('Item não encontrado.');
    return item;
  }
}
