import { Injectable } from '@nestjs/common';
import { ValidatorContractInterface } from '../../../../../shared/interfaces/validator-contract.interface';
import { UserUpdatePasswordRequestDto } from '../user-update-password-request.dto';
import { ValidatorsUtil } from '../../../../../shared/utils/validators.util';

@Injectable()
export class UserUpdatePasswordValidator implements ValidatorContractInterface {
  errors: any[];

  validate(dto: UserUpdatePasswordRequestDto): boolean {
    const validator = new ValidatorsUtil();

    validator.isRequired(dto.password, 'password is required!');
    validator.hasMinLen(
      dto.password,
      6,
      'password must be at least 6 characters!',
    );
    validator.hasMaxLen(
      dto.password,
      20,
      'password must be a maximum of 20 characters!',
    );

    validator.isRequired(dto.newPassword, 'newPassword is required!');
    validator.hasMinLen(
      dto.newPassword,
      6,
      'newPassword must be at least 6 characters!',
    );
    validator.hasMaxLen(
      dto.newPassword,
      20,
      'newPassword must be a maximum of 20 characters!',
    );

    this.errors = validator.errors;
    return validator.isValid();
  }
}
