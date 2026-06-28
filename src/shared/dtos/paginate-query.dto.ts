import { ApiProperty } from "@nestjs/swagger";

export abstract class PaginateQueryDto {

    @ApiProperty({ type: Number, required: false })
    take: number;

    @ApiProperty({ type: Number, required: false })
    skip: number;
}