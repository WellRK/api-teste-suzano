import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrdemVendaStatusEnum } from '../enums/ordem-venda-status.enum';

export class UpdateStatusDto {
  @ApiProperty({
    enum: OrdemVendaStatusEnum,
    description: 'Novo status (deve respeitar o fluxo da máquina de estados).',
  })
  @IsEnum(OrdemVendaStatusEnum)
  status: OrdemVendaStatusEnum;
}
