import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '../../../shared/dtos/response.dto';
import { JwtClientAuthGuard } from '../../../shared/guards/jwt-client-auth.guard';
import { CreateItemDto } from '../dtos/create-item.dto';
import { ItemService } from '../services/item.service';

@ApiTags('Itens')
@ApiBearerAuth()
@UseGuards(JwtClientAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('itens')
export class ItemController {
  private readonly _logger = new Logger(ItemController.name);

  constructor(private readonly _service: ItemService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateItemDto) {
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
}
