import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoTransporteRepository } from '../../tipos-transporte/repositories/tipo-transporte.repository';
import { CreateClienteDto } from '../dtos/create-cliente.dto';
import { SetTiposTransporteDto } from '../dtos/set-tipos-transporte.dto';
import { UpdateClienteDto } from '../dtos/update-cliente.dto';
import { ClienteModel } from '../models/cliente.model';
import { ClienteRepository } from '../repositories/cliente.repository';

@Injectable()
export class ClienteService {
  constructor(
    private readonly _repository: ClienteRepository,
    private readonly _tipoTransporteRepository: TipoTransporteRepository,
  ) {}

  async create(dto: CreateClienteDto): Promise<ClienteModel> {
    if (await this._repository.getByDocumento(dto.documento))
      throw new BadRequestException(
        `Já existe um cliente com o documento '${dto.documento}'.`,
      );

    if (await this._repository.getByEmail(dto.email))
      throw new BadRequestException(
        `Já existe um cliente com o e-mail '${dto.email}'.`,
      );

    const tiposTransporte = await this._resolveTipos(dto.tiposTransporteIds);

    return await this._repository.save({
      nome: dto.nome,
      documento: dto.documento,
      email: dto.email,
      ativo: dto.ativo ?? true,
      tiposTransporte,
    });
  }

  async list(): Promise<ClienteModel[]> {
    return await this._repository.list();
  }

  async getById(id: string): Promise<ClienteModel> {
    const cliente = await this._repository.getById(id);
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
    return cliente;
  }

  async update(id: string, dto: UpdateClienteDto): Promise<ClienteModel> {
    const cliente = await this.getById(id);

    if (dto.email !== undefined && dto.email !== cliente.email) {
      const emailOwner = await this._repository.getByEmail(dto.email);
      if (emailOwner && emailOwner._id !== id)
        throw new BadRequestException(
          `Já existe um cliente com o e-mail '${dto.email}'.`,
        );
    }

    if (dto.nome !== undefined) cliente.nome = dto.nome;
    if (dto.email !== undefined) cliente.email = dto.email;
    if (dto.ativo !== undefined) cliente.ativo = dto.ativo;

    await this._repository.update(id, {
      nome: cliente.nome,
      email: cliente.email,
      ativo: cliente.ativo,
    });

    return await this.getById(id);
  }

  async setTiposTransporte(
    id: string,
    dto: SetTiposTransporteDto,
  ): Promise<ClienteModel> {
    const cliente = await this.getById(id);
    cliente.tiposTransporte = await this._resolveTipos(dto.tiposTransporteIds);

    await this._repository.save(cliente);
    return await this.getById(id);
  }

  private async _resolveTipos(ids?: string[]) {
    if (!ids || ids.length === 0) return [];

    const tipos = await this._tipoTransporteRepository.getByIds(ids);
    if (tipos.length !== ids.length) {
      const encontrados = tipos.map((t) => t._id);
      const faltando = ids.filter((id) => !encontrados.includes(id));
      throw new BadRequestException(
        `Tipo(s) de transporte não encontrado(s): ${faltando.join(', ')}.`,
      );
    }

    return tipos;
  }
}
