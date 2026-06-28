import { ApiProperty } from '@nestjs/swagger';

export abstract class UpdateUserPasswordDto {
  // @ApiProperty({ type: String })
  // id: string;

  @ApiProperty({ type: String })
  password: string;
}
