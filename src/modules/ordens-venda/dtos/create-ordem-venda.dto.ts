import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { OrdemVendaItemDto } from './ordem-venda-item.dto';

export class CreateOrdemVendaDto {
  @ApiProperty({ type: String, description: 'ID do cliente da Ordem de Venda.' })
  @IsUUID()
  @IsNotEmpty()
  clienteId: string;

  @ApiProperty({
    type: String,
    description:
      'ID do tipo de transporte (deve estar autorizado para o cliente).',
  })
  @IsUUID()
  @IsNotEmpty()
  tipoTransporteId: string;

  @ApiProperty({
    type: [OrdemVendaItemDto],
    description: 'Itens da Ordem de Venda (ao menos um).',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrdemVendaItemDto)
  itens: OrdemVendaItemDto[];
}
