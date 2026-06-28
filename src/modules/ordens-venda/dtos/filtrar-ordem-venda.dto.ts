import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { OrdemVendaStatusEnum } from '../enums/ordem-venda-status.enum';

export class FiltrarOrdemVendaDto {
  @ApiPropertyOptional({
    enum: OrdemVendaStatusEnum,
    description: 'Filtra pelo status atual da Ordem de Venda.',
  })
  @IsOptional()
  @IsEnum(OrdemVendaStatusEnum)
  status?: OrdemVendaStatusEnum;

  @ApiPropertyOptional({
    type: String,
    description: 'Filtra pelo cliente (ID).',
  })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Filtra pelo tipo de transporte (ID).',
  })
  @IsOptional()
  @IsUUID()
  tipoTransporteId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Data inicial (inclusive) do intervalo de criação da OV.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicio?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Data final (inclusive) do intervalo de criação da OV.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFim?: Date;

  @ApiPropertyOptional({
    type: Number,
    default: 10,
    description: 'Quantidade de registros por página (default 10, máx. 100).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @ApiPropertyOptional({
    type: Number,
    default: 0,
    description: 'Quantidade de registros a pular (offset, default 0).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}
