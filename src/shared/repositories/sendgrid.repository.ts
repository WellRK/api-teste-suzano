import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectSendGrid, SendGridService } from "@ntegral/nestjs-sendgrid";
import { UserSendMessageRequestDto } from "../../modules/client/dtos/user/user-send-message-request.dto";
import { EnviromentVariablesEnum } from "../enums/enviroment.variables.enum";

@Injectable()
export class SendgridRepository {

    constructor(
        @InjectSendGrid() private readonly client: SendGridService,
        private readonly configService: ConfigService,
    ) { }

    async sendEmail(to: string, subject: string, text: string, html: string) {

        const msg = {
            to,
            from: this.configService.get(EnviromentVariablesEnum.SENDGRID_EMAIL_SENDER),
            subject,
            text,
            html
        };

        await this.client.send(msg);
    }

    async sendEmailMessage(to: string, subject: string, text: string, html: string) {

        const msg = {
            to: this.configService.get(EnviromentVariablesEnum.SENDGRID_EMAIL_SENDER),
            from: this.configService.get(EnviromentVariablesEnum.SENDGRID_EMAIL_SENDER),
            subject: subject,
            text: text,
            html: html
        };

        await this.client.send(msg);
    }
}