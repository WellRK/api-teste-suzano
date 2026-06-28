import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTipoTransporteDto {
  @ApiProperty({ type: String, required: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  nome?: string;

  @ApiProperty({ type: String, required: false })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
