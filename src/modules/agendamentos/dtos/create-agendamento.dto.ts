import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, Matches } from 'class-validator';

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateAgendamentoDto {
  @ApiProperty({
    type: String,
    description: 'ID da Ordem de Venda a ser agendada.',
  })
  @IsUUID()
  @IsNotEmpty()
  ordemVendaId: string;

  @ApiProperty({
    type: String,
    example: '2026-07-15',
    description: 'Data de entrega (formato AAAA-MM-DD).',
  })
  @Matches(DATA_REGEX, { message: 'dataEntrega deve estar no formato AAAA-MM-DD.' })
  dataEntrega: string;

  @ApiProperty({
    type: String,
    example: '08:00',
    description: 'Início da janela de atendimento (HH:mm).',
  })
  @Matches(HORA_REGEX, { message: 'janelaInicio deve estar no formato HH:mm.' })
  janelaInicio: string;

  @ApiProperty({
    type: String,
    example: '12:00',
    description: 'Fim da janela de atendimento (HH:mm).',
  })
  @Matches(HORA_REGEX, { message: 'janelaFim deve estar no formato HH:mm.' })
  janelaFim: string;
}
