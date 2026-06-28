import { applyDecorators, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { imageFileFilter } from "../filters/image-file.filter";

export function UploadFiles() {
    return applyDecorators(
        UseInterceptors(FilesInterceptor('files', 20, { fileFilter: imageFileFilter })),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    files: {
                        type: 'array',
                        items: {
                            type: 'string',
                            format: 'binary'
                        },
                    },
                },
            },
        }),
    );
}