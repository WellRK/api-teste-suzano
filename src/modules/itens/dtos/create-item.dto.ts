import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ type: String, example: 'SKU-0001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @ApiProperty({ type: String, example: 'Papel A4 75g' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;

  @ApiProperty({ type: String, required: false })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ type: String, required: false, example: 'CX' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  unidadeMedida?: string;

  @ApiProperty({ type: Boolean, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
