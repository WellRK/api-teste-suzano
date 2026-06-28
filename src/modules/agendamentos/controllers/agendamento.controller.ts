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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '../../../shared/dtos/response.dto';
import { JwtClientAuthGuard } from '../../../shared/guards/jwt-client-auth.guard';
import { CreateAgendamentoDto } from '../dtos/create-agendamento.dto';
import { ReagendarDto } from '../dtos/reagendar.dto';
import { AgendamentoService } from '../services/agendamento.service';

@ApiTags('Agendamentos')
@ApiBearerAuth()
@UseGuards(JwtClientAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('agendamentos')
export class AgendamentoController {
  private readonly _logger = new Logger(AgendamentoController.name);

  constructor(private readonly _service: AgendamentoService) {}

  @Post()
  @HttpCode(201)
  async definir(@Body() dto: CreateAgendamentoDto) {
    try {
      const response = await this._service.definir(dto);
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

  @Patch(':id/confirmar')
  @HttpCode(200)
  async confirmar(@Param('id') id: string) {
    try {
      const response = await this._service.confirmar(id);
      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);
      throw new HttpException(
        new ResponseDto(false, null, [error.message]),
        error.status ?? HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/reagendar')
  @HttpCode(200)
  async reagendar(@Param('id') id: string, @Body() dto: ReagendarDto) {
    try {
      const response = await this._service.reagendar(id, dto);
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
