import { ApiProperty } from "@nestjs/swagger";

export abstract class UserSendMessageRequestDto {

    @ApiProperty({ type: String })
    name: string;

    @ApiProperty({ type: String })
    email: string;

    @ApiProperty({ type: String })
    phone: string;

    @ApiProperty({ type: String })
    subject: string;

    @ApiProperty({ type: String })
    message: string;


}