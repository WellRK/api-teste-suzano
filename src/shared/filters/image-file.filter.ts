import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";

export const imageFileFilter = (req: any, file: any, callback: any) => {

    if (!file.originalname.match(/\.(jpg|jpeg|png)$/))
        return callback(new Error('Only image files are allowed!'), false);

    callback(null, true);
};

export const imageOptions: MulterOptions = {
    limits: { files: 20, fileSize: 5242880 }, //5MB
    fileFilter: imageFileFilter
}