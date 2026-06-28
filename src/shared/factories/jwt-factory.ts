import { ConfigService } from "@nestjs/config";
import { EnviromentVariablesEnum } from "../enums/enviroment.variables.enum";

export const jwtFactory = {
    useFactory: async (configService: ConfigService) => ({
        secret: configService.get(EnviromentVariablesEnum.JWT_KEY),
        signOptions: {
            expiresIn: Number(EnviromentVariablesEnum.JWT_EXPIRATION)
        }
    }),
    inject: [
        ConfigService
    ]
};