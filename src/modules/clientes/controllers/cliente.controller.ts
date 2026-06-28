import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '../../../shared/dtos/response.dto';
import { JwtClientAuthGuard } from '../../../shared/guards/jwt-client-auth.guard';
import { CreateClienteDto } from '../dtos/create-cliente.dto';
import { SetTiposTransporteDto } from '../dtos/set-tipos-transporte.dto';
import { UpdateClienteDto } from '../dtos/update-cliente.dto';
import { ClienteService } from '../services/cliente.service';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtClientAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('clientes')
export class ClienteController {
  private readonly _logger = new Logger(ClienteController.name);

  constructor(private readonly _service: ClienteService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateClienteDto) {
    try {
      const response = await this._service.create(dto);
      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);
      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        error.status ?? HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @HttpCode(200)
  async list() {
    try {
      const response = await this._service.list();
      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);
      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        error.status ?? HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  @HttpCode(200)
  async getById(@Param('id') id: string) {
    try {
      const response = await this._service.getById(id);
      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);
      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        error.status ?? HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    try {
      const response = await this._service.update(id, dto);
      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);
      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        error.status ?? HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/tipos-transporte')
  @HttpCode(200)
  async setTiposTransporte(
    @Param('id') id: string,
    @Body() dto: SetTiposTransporteDto,
  ) {
    try {
      const response = await this._service.setTiposTransporte(id, dto);
      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);
      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        error.status ?? HttpStatus.BAD_REQUEST,
      );
    }
  }
}
