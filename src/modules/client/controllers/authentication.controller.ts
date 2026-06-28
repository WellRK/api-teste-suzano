import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '../../../shared/dtos/response.dto';
import { AuthenticateCodeConfirmtionRequestDto } from '../dtos/authentication/authenticate-code-confirmation-request.dto';
import { AuthenticateRequestDto } from '../dtos/authentication/authenticate-request.dto';
import { AuthenticationService } from '../services/authentication.service';

@ApiTags('Authenticate')
@Controller('app/authentication')
export class AuthenticationController {
  private readonly _logger = new Logger(AuthenticationController.name);

  constructor(private readonly _authenticateService: AuthenticationService) {}

  @Post('/authenticate')
  @HttpCode(200)
  async authenticate(@Body() dto: AuthenticateRequestDto) {
    try {
      const response = await this._authenticateService.authenticate(dto);

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
