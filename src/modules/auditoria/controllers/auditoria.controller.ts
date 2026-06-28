import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '../../../shared/dtos/response.dto';
import { JwtClientAuthGuard } from '../../../shared/guards/jwt-client-auth.guard';
import { FiltrarAuditoriaDto } from '../dtos/filtrar-auditoria.dto';
import { AuditoriaService } from '../services/auditoria.service';

@ApiTags('Auditoria')
@ApiBearerAuth()
@UseGuards(JwtClientAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('auditoria')
export class AuditoriaController {
  private readonly _logger = new Logger(AuditoriaController.name);

  constructor(private readonly _service: AuditoriaService) {}

  @Get()
  @HttpCode(200)
  async list(@Query() filtros: FiltrarAuditoriaDto) {
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
}
