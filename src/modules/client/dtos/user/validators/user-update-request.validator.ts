import { Injectable } from "@nestjs/common";
import { ValidatorContractInterface } from "../../../../../shared/interfaces/validator-contract.interface";
import { ValidatorsUtil } from "../../../../../shared/utils/validators.util";
import { UserUpdateRequestDto } from "../user-update-request.dto";

@Injectable()
export class UserUpdateRequestValidator implements ValidatorContractInterface {

    errors: any[];

    validate(dto: UserUpdateRequestDto): boolean {

        const validator = new ValidatorsUtil();

        validator.isRequired(dto.name, 'name is required!');
        validator.hasMinLen(dto.name, 2, 'name must be at least 2 characters!');
        validator.hasMaxLen(dto.name, 100, 'name must have a maximum of 100 characters!');

        validator.isRequired(dto.phone, 'phone is required!');
        validator.isValidPhoneNumber(dto.phone, 'phone is invalid!');

        validator.isRequired(dto.cpf, 'cpf is required!');
        validator.isValidCpf(dto.cpf, 'cpf is invalid!');

        this.errors = validator.errors;
        return validator.isValid();
    }
}