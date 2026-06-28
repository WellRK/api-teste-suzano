import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { ProfileClientModel } from '../models/profile-client.model';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class ProfileClientRepository extends BaseRepository<ProfileClientModel> {
  constructor(
    @InjectRepository(ProfileClientModel)
    protected readonly _model: Repository<ProfileClientModel>,
  ) {
    super(_model);
  }

  override async list(): Promise<ProfileClientModel[] | null> {
    return await this._model.find({});
  }

  override async getById(_id: string): Promise<ProfileClientModel | null> {
    return await this._model.findOne({
      where: { _id: _id },
    });
  }

  async getByName(name: string): Promise<ProfileClientModel> {
    return await this._model.findOne({
      where: { name: name },
    });
  }

  async getByIds(ids: string[]): Promise<ProfileClientModel[]> {
    return await this._model.find({
      where: { _id: In(ids) },
    });
  }
}
