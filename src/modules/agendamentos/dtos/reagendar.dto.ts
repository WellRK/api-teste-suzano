import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class ReagendarDto {
  @ApiProperty({
    type: String,
    example: '2026-07-20',
    description: 'Nova data de entrega (formato AAAA-MM-DD).',
  })
  @Matches(DATA_REGEX, { message: 'dataEntrega deve estar no formato AAAA-MM-DD.' })
  dataEntrega: string;

  @ApiProperty({
    type: String,
    example: '13:00',
    description: 'Novo início da janela de atendimento (HH:mm).',
  })
  @Matches(HORA_REGEX, { message: 'janelaInicio deve estar no formato HH:mm.' })
  janelaInicio: string;

  @ApiProperty({
    type: String,
    example: '17:00',
    description: 'Novo fim da janela de atendimento (HH:mm).',
  })
  @Matches(HORA_REGEX, { message: 'janelaFim deve estar no formato HH:mm.' })
  janelaFim: string;
}
