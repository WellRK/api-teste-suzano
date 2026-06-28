import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateTransporteDto {
  @ApiProperty({
    type: String,
    description:
      'Novo tipo de transporte (deve estar autorizado para o cliente da OV).',
  })
  @IsUUID()
  @IsNotEmpty()
  tipoTransporteId: string;
}
