import { ApiProperty } from "@nestjs/swagger";

export abstract class AuthenticateCodeConfirmtionRequestDto {
    
    @ApiProperty({ type: String })
    phone: string;

    @ApiProperty({ type: Number })
    code: number;
}