import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as zenvia from '@zenvia/sdk';
import { EnviromentVariablesEnum } from "../enums/enviroment.variables.enum";

@Injectable()
export class ZenviaRepository {

    private _client: zenvia.Client;

    constructor(
        private readonly _configService: ConfigService,
    ) {
        this._client = new zenvia.Client(_configService.get<string>(EnviromentVariablesEnum.ZENVIA_TOKEN));
    }

    async sendSms(phone: string, message: string) {
        const channel = this._client.getChannel('sms');
        const content = new zenvia.TextContent(message);
        await channel.sendMessage(
            'cto',
            phone,
            content
        );
    }

    async sendEmail(email: string, message: string) {
        const channel = this._client.getChannel('email');
        const from = this._configService.get<string>(EnviromentVariablesEnum.ZENVIA_EMAIL);
        const content = new zenvia.EmailContent('ImoveiStock', [], '', message);
        const result = await channel.sendMessage(
            from,
            email,
            content
        );
    }
}