import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { ProfileClientEnum } from '../../../shared/enums/profile-client.enum';
import { ProfileClientRepository } from '../../client/repositories/profile.repository';
import { ProfileClientModel } from '../../client/models/profile-client.model';
import { UserClientModel } from '../../client/models/user-client.model';
import { UserClientRepository } from '../../client/repositories/user-client.repository';
import { TipoTransporteRepository } from '../../tipos-transporte/repositories/tipo-transporte.repository';
import { ItemRepository } from '../../itens/repositories/item.repository';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class InitialSeed {
  constructor(
    private readonly _profileRepository: ProfileClientRepository,
    private readonly _userRepository: UserClientRepository,
    private readonly _tipoTransporteRepository: TipoTransporteRepository,
    private readonly _itemRepository: ItemRepository,
  ) {}

  @Command({
    command: 'seed:database',
    describe: 'seed database intial',
  })
  async seed() {
    try {
      console.log('start seed');

      const superAdminProfileClientModel = new ProfileClientModel();
      superAdminProfileClientModel._id = ProfileClientEnum.superadmin;
      superAdminProfileClientModel.name = 'superAdmin';
      superAdminProfileClientModel.description = 'SuperAdmin';

      await this._profileRepository.save(superAdminProfileClientModel);

      const ambienteProfileClientModel = new ProfileClientModel();
      ambienteProfileClientModel._id = ProfileClientEnum.ambiente;
      ambienteProfileClientModel.name = 'ambiente';
      ambienteProfileClientModel.description = 'Ambiente';

      await this._profileRepository.save(ambienteProfileClientModel);

      const adminProfileClientModel = new ProfileClientModel();
      adminProfileClientModel._id = ProfileClientEnum.admin;
      adminProfileClientModel.name = 'admin';
      adminProfileClientModel.description = 'Admin';

      await this._profileRepository.save(adminProfileClientModel);

      const servicoProfileClientModel = new ProfileClientModel();
      servicoProfileClientModel._id = ProfileClientEnum.servico;
      servicoProfileClientModel.name = 'servico';
      servicoProfileClientModel.description = 'Servico';

      await this._profileRepository.save(servicoProfileClientModel);

      const adminEmail = process.env.SEED_ADMIN_EMAIL;
      const adminPassword = process.env.SEED_ADMIN_PASSWORD;
      if (!adminEmail || !adminPassword)
        throw new Error(
          'Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD no .env antes de rodar o seed.',
        );

      const masterUser = new UserClientModel();
      masterUser.id = 'sman';
      masterUser.phone = 'string';
      masterUser.password = await bcrypt.hash(adminPassword, 13);
      masterUser.email = adminEmail;
      masterUser.name = 'Sman';
      masterUser.cpf = 'sman';
      masterUser.profile = await this._profileRepository.getByIds([
        ProfileClientEnum.superadmin,
        ProfileClientEnum.admin,
        ProfileClientEnum.ambiente,
        ProfileClientEnum.servico,
      ]);
      await this._userRepository.save(masterUser);

      await this._seedTiposTransporte();
      await this._seedItens();

      console.log('---------- seed finished');
    } catch (error) {
      console.log(error);
    }
  }

  private async _seedTiposTransporte() {
    const tipos = [
      { codigo: 'CAMINHAO', nome: 'Caminhão', descricao: 'Caminhão de carga' },
      { codigo: 'CARRETA', nome: 'Carreta', descricao: 'Carreta / semirreboque' },
      { codigo: 'BITRUCK', nome: 'Bi-truck', descricao: 'Caminhão bi-truck' },
    ];

    for (const tipo of tipos) {
      const exists = await this._tipoTransporteRepository.getByCodigo(
        tipo.codigo,
      );
      if (!exists)
        await this._tipoTransporteRepository.save({ ...tipo, ativo: true });
    }
  }

  private async _seedItens() {
    const itens = [
      {
        sku: 'SKU-0001',
        nome: 'Papel A4 75g',
        descricao: 'Resma de papel A4',
        unidadeMedida: 'CX',
      },
      {
        sku: 'SKU-0002',
        nome: 'Caneta esferográfica azul',
        descricao: 'Caixa com 50 unidades',
        unidadeMedida: 'CX',
      },
      {
        sku: 'SKU-0003',
        nome: 'Toner preto',
        descricao: 'Toner para impressora laser',
        unidadeMedida: 'UN',
      },
    ];

    for (const item of itens) {
      const exists = await this._itemRepository.getBySku(item.sku);
      if (!exists) await this._itemRepository.save({ ...item, ativo: true });
    }
  }
}
