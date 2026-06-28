import { ApiProperty } from "@nestjs/swagger";

export abstract class AuthenticateRequestDto {
      
    @ApiProperty({ type: String })
    email: string;

    @ApiProperty({ type: String })
    password: string;
}