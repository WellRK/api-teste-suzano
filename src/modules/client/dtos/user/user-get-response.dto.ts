export class UserGetResponseDto {
  _id: string;
  phone: string;
  email: string;
  name: string;
  cpf: string;
  profile: any;

  constructor(user: {
    _id: string;
    phone: string;
    email: string;
    name: string;
    cpf: string;
    profile: any;
  }) {
    this._id = user._id;
    this.phone = user.phone;
    this.email = user.email;
    this.name = user.name;
    this.cpf = user.cpf;
    this.profile = user.profile; // Mapeia o perfil
  }
}
