import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTipoTransporteDto {
  @ApiProperty({ type: String, example: 'CAMINHAO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo: string;

  @ApiProperty({ type: String, example: 'Caminhão' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({ type: String, required: false })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ type: Boolean, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
