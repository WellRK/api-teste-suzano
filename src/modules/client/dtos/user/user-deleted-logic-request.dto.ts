import { ApiProperty } from "@nestjs/swagger";

export class UserDeletedLogicRequestDto {
    @ApiProperty({ type: String })
    _id: string;
}