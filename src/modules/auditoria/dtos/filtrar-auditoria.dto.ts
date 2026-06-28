import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { TipoAcaoEnum } from '../enums/tipo-acao.enum';

export class FiltrarAuditoriaDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Filtra pela entidade afetada (ex.: OrdemVenda, Agendamento).',
  })
  @IsOptional()
  @IsString()
  entidade?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Filtra pelo ID da entidade afetada.',
  })
  @IsOptional()
  @IsUUID()
  entidadeId?: string;

  @ApiPropertyOptional({
    enum: TipoAcaoEnum,
    description: 'Filtra pelo tipo de ação registrada.',
  })
  @IsOptional()
  @IsEnum(TipoAcaoEnum)
  tipoAcao?: TipoAcaoEnum;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Data/hora inicial (inclusive) do período.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicio?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Data/hora final (inclusive) do período.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFim?: Date;

  @ApiPropertyOptional({
    type: Number,
    default: 20,
    description: 'Quantidade de registros por página (default 20, máx. 100).',
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
    description: 'Offset de paginação (default 0).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}
