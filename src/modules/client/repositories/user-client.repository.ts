import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserClientModel } from '../models/user-client.model';
import { FindManyOptions, Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { PaginateResultDto } from '../../../shared/dtos/paginate-result.dto';
import { ProfileClientModel } from '../models/profile-client.model';
import { ProfileClientEnum } from '../../../shared/enums/profile-client.enum';

@Injectable()
export class UserClientRepository extends BaseRepository<UserClientModel> {
  constructor(
    @InjectRepository(UserClientModel)
    protected readonly _model: Repository<UserClientModel>,
    @InjectRepository(ProfileClientModel)
    protected readonly _profile: Repository<ProfileClientModel>,
  ) {
    super(_model);
  }

  override async getById(_id: string): Promise<UserClientModel | null> {
    return await this._model.findOne({
      where: { _id: _id },
    });
  }

  // override async list(): Promise<UserClientModel[]> {
  //   return await this._model.find({
  //     order: { name: 'ASC' },
  //     relations: ['profile', 'createdByAdmin'],
  //   });
  // }

  async listByAdmin(adminId: string): Promise<UserClientModel[]> {
    return await this._model.find({
      where: {
        createdByAdmin: { _id: adminId }, // Filtra por adminId
      },
      order: { name: 'ASC' },
      relations: ['profile', 'createdByAdmin'],
    });
  }

  async getByPhone(phone: string): Promise<UserClientModel> {
    return await this._model.findOne({
      where: { phone: phone },
    });
  }

  async getByEmail(email: string): Promise<UserClientModel> {
    return await this._model.findOne({
      relations: ['profile'],
      where: { email: email },
    });
  }

  public async listAll(): Promise<PaginateResultDto> {
    const query: FindManyOptions = {
      order: { createdAt: 'DESC' },
    };

    const [result, total] = await this._model.findAndCount(query);

    return new PaginateResultDto(result, total);
  }

  async updateById(
    id: string,
    updateData: Partial<UserClientModel>,
  ): Promise<void> {
    await this._model.update(id, updateData);
  }

  async listAllAdmins(): Promise<UserClientModel[]> {
    return await this._model
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.createdByAdmin', 'createdByAdmin')
      .where('profile._id = :adminProfileId', {
        adminProfileId: ProfileClientEnum.admin,
      })
      .orderBy('user.name', 'ASC')
      .getMany();
  }

  async updatePasswordById(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    await this._model.update(userId, { password: hashedPassword });
  }

  // async updatePassword(
  //   id: string, // Alterado de _id para id
  //   password: string,
  // ): Promise<UserClientModel> {
  //   const user = await this._model.findOne({ where: { id } }); // Alterado _id para id

  //   if (!user) {
  //     throw new Error('Usuário não encontrado');
  //   }

  //   user.password = password;
  //   const passwordUpdate = user.password;

  //   await this._model.update(id, { passwordUpdate });

  //   return user;
  // }

  // async updatePassword(id: string, password: string): Promise<void> {

  //   const user = await this._model.findOne({ where: { id } });

  //   if (!user) {
  //     throw new Error('Usuário não encontrado');
  //   }

  //   await this._model.update(id, { password }); // Atualiza apenas a senha
  // }
}
