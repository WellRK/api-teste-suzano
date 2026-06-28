import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class OrdemVendaItemDto {
  @ApiProperty({
    type: String,
    description: 'ID de um item previamente cadastrado.',
  })
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ type: Number, example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  quantidade: number;
}
