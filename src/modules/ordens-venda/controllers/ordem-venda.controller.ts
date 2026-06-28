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
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '../../../shared/dtos/response.dto';
import { JwtClientAuthGuard } from '../../../shared/guards/jwt-client-auth.guard';
import { CreateOrdemVendaDto } from '../dtos/create-ordem-venda.dto';
import { FiltrarOrdemVendaDto } from '../dtos/filtrar-ordem-venda.dto';
import { UpdateStatusDto } from '../dtos/update-status.dto';
import { UpdateTransporteDto } from '../dtos/update-transporte.dto';
import { OrdemVendaService } from '../services/ordem-venda.service';

@ApiTags('Ordens de Venda')
@ApiBearerAuth()
@UseGuards(JwtClientAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('ordens-venda')
export class OrdemVendaController {
  private readonly _logger = new Logger(OrdemVendaController.name);

  constructor(private readonly _service: OrdemVendaService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateOrdemVendaDto) {
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
  async list(@Query() filtros: FiltrarOrdemVendaDto) {
    try {
      const response = await this._service.findByFiltros(filtros);
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

  @Patch(':id/status')
  @HttpCode(200)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    try {
      const response = await this._service.updateStatus(id, dto.status);
      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);
      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        error.status ?? HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/transporte')
  @HttpCode(200)
  async updateTransporte(
    @Param('id') id: string,
    @Body() dto: UpdateTransporteDto,
  ) {
    try {
      const response = await this._service.updateTransporte(
        id,
        dto.tipoTransporteId,
      );
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
