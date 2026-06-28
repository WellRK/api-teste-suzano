import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetTiposTransporteDto {
  @ApiProperty({
    type: [String],
    description:
      'Lista completa de IDs de tipos de transporte autorizados para o cliente (substitui a lista atual).',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  tiposTransporteIds: string[];
}
