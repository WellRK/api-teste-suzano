import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaginateResultDto } from '../../../shared/dtos/paginate-result.dto';
import { EnviromentVariablesEnum } from '../../../shared/enums/enviroment.variables.enum';
import { JwtPayloadClientInterface } from '../../../shared/interfaces/jwt-payload-client.interface';
import { S3Repository } from '../../../shared/repositories/s3.repository';
import MaskUtil from '../../../shared/utils/mask.util';
import { UserGetResponseDto } from '../dtos/user/user-get-response.dto';
import { UserRegisterRequestDto } from '../dtos/user/user-register-request.dto';
import { UserRegisterResponseDto } from '../dtos/user/user-register-response';
import { UserUpdateRequestDto } from '../dtos/user/user-update-request.dto';
import { UserUpdateResponseDto } from '../dtos/user/user-update-response';

import { UserClientRepository } from '../repositories/user-client.repository';
import { UserDeletedLogicRequestDto } from '../dtos/user/user-deleted-logic-request.dto';

//import { UserUpdateProfileRequestDto } from "../dtos/user/user-update-profile-request.dto";
//import { RequestProfileRepository } from "../repositories/request-profile.repository";
import { SendgridRepository } from '../../../shared/repositories/sendgrid.repository';
import * as bcrypt from 'bcryptjs';
import { ProfileClientRepository } from '../repositories/profile.repository';
import { UserClientModel } from '../models/user-client.model';

@Injectable()
export class UserService {
  constructor(
    private readonly _userRepository: UserClientRepository,
    private readonly _s3Repository: S3Repository,
    private readonly _configService: ConfigService,
    private readonly _profileClientRepository: ProfileClientRepository,
    private readonly _sendgridRepository: SendgridRepository,
  ) {}

  async getById(
    payload: JwtPayloadClientInterface,
  ): Promise<UserGetResponseDto> {
    const result = await this._userRepository.getById(payload.userId);
    return result as UserGetResponseDto;
  }

  async list(adminId: string): Promise<UserGetResponseDto[]> {
    const result = await this._userRepository.listByAdmin(adminId);
    //const result = await this._userRepository.list();

    //return result.map(user => new UserGetResponseDto(user));

    return result.map(
      (user) =>
        new UserGetResponseDto({
          _id: user._id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          cpf: user.cpf,
          profile: user.profile, // Adiciona o perfil ao DTO
        }),
    );
  }
  async listAll(): Promise<PaginateResultDto> {
    const result = await this._userRepository
      .listAll
      //status,
      //query.take,
      //query.skip
      ();
    return result;
  }

  // async register(
  //   dto: UserRegisterRequestDto,
  //   admin: UserClientModel,
  // ): Promise<UserRegisterResponseDto> {
  //   // const profile = await this._profileClientRepository.getById(dto.profileId[0]);
  //   // if (!profile)
  //   //     throw new BadRequestException('profile not found!');

  //   dto.password = await bcrypt.hash(dto.password, 13);

  //   for (let i = 0; i < dto.profileId.length; i++) {
  //     const profile = await this._profileClientRepository.getById(
  //       dto.profileId[i],
  //     );

  //     if (!profile) throw new BadRequestException('profile not found!');

  //     if (!dto.profile) dto.profile = [];

  //     dto.profile.push(profile);
  //   }

  //   // Associar o usuário ao administrador que está criando

  //   const result = await this._userRepository.save({
  //     ...dto,
  //     createdByAdmin: admin, // Adiciona o administrador que criou o usuário
  //   });

  //   console.log('AQUIIIIIIIIII', dto);

  //   return new UserRegisterResponseDto(result._id, result.phone);
  // }

  async register(
    dto: UserRegisterRequestDto,
    admin: UserClientModel,
  ): Promise<UserRegisterResponseDto> {
    dto.password = await bcrypt.hash(dto.password, 13);

    const profiles = [];
    for (const profileId of dto.profileId) {
      const profile = await this._profileClientRepository.getById(profileId);
      if (!profile)
        throw new BadRequestException(`Profile not found: ${profileId}`);
      profiles.push(profile);
    }

    const result = await this._userRepository.save({
      ...dto,
      profile: profiles,
      createdByAdmin: admin,
    });

    return new UserRegisterResponseDto(result._id, result.phone);
  }

  async update(
    payload: JwtPayloadClientInterface,
    dto: UserUpdateRequestDto,
  ): Promise<UserUpdateResponseDto> {
    const user = await this._userRepository.getById(payload.userId);

    dto.phone = MaskUtil.remove(dto.phone);
    dto.cpf = MaskUtil.remove(dto.cpf);

    user.name = dto.name;
    user.phone = dto.phone;
    user.cpf = dto.cpf;

    await this._userRepository.update(user._id, user);
    return new UserUpdateResponseDto(user._id, user.phone);
  }
  1;
  async delete(_id: string): Promise<boolean> {
    //const user = await this._userRepository.getById(_id);
    await this._userRepository.delete(_id);

    return true;
  }

  async getByEmail(email: string): Promise<UserClientModel> {
    return await this._userRepository.getByEmail(email);
  }

  async updatePasswordUser(
    id: string,
    plainPassword: string,
  ): Promise<UserClientModel> {
    const user = await this._userRepository.getById(id);
    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 13);
    await this._userRepository.updatePasswordById(user._id, hashedPassword);

    return await this._userRepository.getById(user._id);
  }
}
