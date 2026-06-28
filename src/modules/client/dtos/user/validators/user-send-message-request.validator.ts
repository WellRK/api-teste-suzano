import { Injectable } from "@nestjs/common";
import { ValidatorContractInterface } from "../../../../../shared/interfaces/validator-contract.interface";
import { ValidatorsUtil } from "../../../../../shared/utils/validators.util";
import { UserSendMessageRequestDto } from "../user-send-message-request.dto";

@Injectable()
export class UserSendMessageRequestValidator implements ValidatorContractInterface {

    errors: any[];

    validate(dto: UserSendMessageRequestDto): boolean {

        const validator = new ValidatorsUtil();

        validator.isRequired(dto.email, 'email is required!');
        validator.isValidEmail(dto.email, 'email is invalid!');

        validator.isRequired(dto.name, 'name is required!');
        validator.hasMinLen(dto.name, 2, 'name must be at least 2 characters!');
        validator.hasMaxLen(dto.name, 100, 'name must have a maximum of 100 characters!');

        validator.isRequired(dto.phone, 'phone is required!');
        validator.isValidPhoneNumber(dto.phone, 'phone is invalid!');

        validator.isRequired(dto.subject, 'subject is required!');
        validator.isRequired(dto.message, 'subject is required!');


        this.errors = validator.errors;
        return validator.isValid();
    }
}