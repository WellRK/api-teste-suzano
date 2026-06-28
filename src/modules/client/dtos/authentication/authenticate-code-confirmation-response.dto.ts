export class AuthenticateCodeConfirmationResponseDto {
    constructor(
        public userId: string,
        public phone: string,
        public token: string,
        public profilesIds: string[],
    ) { }
}