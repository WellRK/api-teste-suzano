export class ValidatorsUtil {

    constructor(
        public errors: string[] = []
    ) { }

    isRequired(value, message) {
        if (!value || value.length <= 0)
            this.errors.push(message);
    }

    hasMinLen = (value, min, message) => {
        if (!value || value.length < min)
            this.errors.push(message);
    }

    hasMaxLen = (value, max, message) => {
        if (!value || value.length > max)
            this.errors.push(message);
    }

    isFixedLen = (value, len, message) => {
        if (value.length !== len)
            this.errors.push(message);
    }

    isValidEmail = (value, message) => {
        const reg = new RegExp(/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/);
        if (!reg.test(value))
            this.errors.push(message);
    }

    // Valid cpf ex: 111.111.111-11
    isValidCpf = (value, message) => {
        const reg = new RegExp(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/);
        if (!reg.test(value))
            this.errors.push(message);
    };

    // Valid phone number ex: +55 (11) 98888-8888 / 9999-9999 / 21 98888-8888 / 5511988888888 / +5511988888888
    isValidPhoneNumber = (value, message) => {
        const reg = new RegExp(/^(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))$/);
        if (!reg.test(value))
            this.errors.push(message);
    };

    isValidCep = (value, message) => {
        const reg = new RegExp(/^[0-9]{5}-[0-9]{3}$/);
        if (!reg.test(value))
            this.errors.push(message);
    };

    containIn = (value, enumReference, message) => {
        if (!Object.values(enumReference).includes(value))
            this.errors.push(message);
    }

    isFourDigitNumber = (value: number, message: string) => {
        let reg = new RegExp('^[+ 0-9]{4}$');
        if (!reg.test(value.toString()))
            this.errors.push(message);
    }

    isSixDigitNumber = (value: number, message: string) => {
        let reg = new RegExp('^[+ 0-9]{6}$');
        if (!reg.test(value.toString()))
            this.errors.push(message);
    }

    hasExactlyTheNumberOfDigits = (digits: number, value: number, message: string) => {
        let reg = new RegExp(`^[+ 0-9]{${digits}}$`);
        if (!reg.test(value.toString()))
            this.errors.push(message);
    }

    addError(message: string) {
        this.errors.push(message);
    }

    clear() {
        this.errors = [];
    }

    isValid() {
        return this.errors.length === 0;
    }
}
