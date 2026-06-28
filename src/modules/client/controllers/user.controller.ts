import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '../../../shared/dtos/response.dto';
import { ValidatorInterceptor } from '../../../shared/interceptors/validator.interceptor';
import { UserDeletedLogicRequestDto } from '../dtos/user/user-deleted-logic-request.dto';
import { UserUpdateRequestDto } from '../dtos/user/user-update-request.dto';
import { UserRegisterRequestValidator } from '../dtos/user/validators/user-register-request.validator';
import { UserUpdateRequestValidator } from '../dtos/user/validators/user-update-request.validator';
import { UserService } from '../services/user.service';
import { UserRegisterRequestDto } from '../dtos/user/user-register-request.dto';
import { JwtClientAuthGuard } from '../../../shared/guards/jwt-client-auth.guard';
import { ProfileClientGuard } from '../../../shared/guards/profile-client.guard';
import { ProfilesClient } from '../../../shared/decorators/profile-client.decorator';
import { ProfileClientEnum } from '../../../shared/enums/profile-client.enum';
import { UserUpdatePasswordRequestDto } from '../dtos/user/user-update-password-request.dto';
import * as bcrypt from 'bcryptjs';
import { UserUpdatePasswordValidator } from '../dtos/user/validators/user-update-password.validator';
import { UserClientRepository } from '../repositories/user-client.repository';
import { UpdateUserPasswordDto } from '../dtos/user/user-update-password.dto';

@ApiTags('Client')
@Controller('user-client')
export class UserController {
  private readonly _logger = new Logger(UserController.name);

  constructor(
    private readonly _userService: UserService,
    private readonly _userRepository: UserClientRepository,
  ) {}

  @Post()
  @UseGuards(JwtClientAuthGuard, ProfileClientGuard)
  @ProfilesClient(ProfileClientEnum.admin)
  @ApiBearerAuth()
  @UseInterceptors(new ValidatorInterceptor(new UserRegisterRequestValidator()))
  async register(@Body() dto: UserRegisterRequestDto, @Req() req: any) {
    try {
      const admin = req.user.userId;
      const response = await this._userService.register(dto, admin);

      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);

      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch()
  @UseInterceptors(new ValidatorInterceptor(new UserUpdateRequestValidator()))
  @UseGuards(JwtClientAuthGuard, ProfileClientGuard)
  @ProfilesClient(ProfileClientEnum.admin)
  @ApiBearerAuth()
  async update(@Req() request, @Body() dto: UserUpdateRequestDto) {
    try {
      const response = await this._userService.update(request.user, dto);

      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);

      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('Update-password/')
  @UseGuards(JwtClientAuthGuard, ProfileClientGuard)
  //@ProfilesClient(ProfileClientEnum.superadmin)
  @ApiBearerAuth()
  async updatePassword(@Body() dto: UpdateUserPasswordDto, @Req() req) {
    try {
      //console.log(req.user);
      const Id = req.user.userId;
      const updatedUser = await this._userService.updatePasswordUser(
        Id,
        dto.password,
      );
      return new ResponseDto(true, updatedUser, null);
    } catch (error) {
      this._logger.error(error.message);
      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('delete/id/:id')
  @HttpCode(200)
  @UseGuards(JwtClientAuthGuard, ProfileClientGuard)
  @ProfilesClient(ProfileClientEnum.admin)
  @ApiBearerAuth()
  async deletar(@Param('id') id: string) {
    try {
      const response = await this._userService.delete(id);

      return new ResponseDto(true, response, null);
    } catch (error) {
      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @HttpCode(200)
  @UseGuards(JwtClientAuthGuard, ProfileClientGuard)
  @ProfilesClient(ProfileClientEnum.admin)
  @ApiBearerAuth()
  async list(@Req() req: any) {
    try {
      const adminId = req.user.userId;
      //console.log('ESSE', req.user);
      const response = await this._userService.list(adminId);

      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);

      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

}
