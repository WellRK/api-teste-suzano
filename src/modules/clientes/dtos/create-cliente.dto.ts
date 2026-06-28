import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateClienteDto {
  @ApiProperty({ type: String, example: 'Indústria Acme Ltda' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;

  @ApiProperty({ type: String, example: '12345678000199' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documento: string;

  @ApiProperty({ type: String, example: 'contato@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: Boolean, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'IDs dos tipos de transporte autorizados para o cliente.',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  tiposTransporteIds?: string[];
}
