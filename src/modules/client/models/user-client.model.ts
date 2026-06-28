import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseModel } from '../../../shared/model/base.model';
import { ProfileClientModel } from './profile-client.model';

@Entity({ name: 'user_client' })
//@Unique('unique_phone_cpf', ['phone', 'cpf'])
export class UserClientModel extends BaseModel<UserClientModel> {
  @Column({ nullable: false, unique: true })
  id: string;

  @Column({ nullable: false, unique: true })
  phone: string;

  @Column({ nullable: false, unique: true })
  password: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, unique: true })
  cpf: string;

  @ManyToMany(() => ProfileClientModel, (profile) => profile.users, {
    cascade: true,
    onUpdate: 'CASCADE',
  })
  @JoinTable()
  profile: ProfileClientModel[];

  // Nova relação: administrador que criou este usuário
  @ManyToOne(() => UserClientModel, (admin) => admin.createdUsers, {
    nullable: true,
  })
  createdByAdmin: UserClientModel;

  // Nova relação: usuários criados por este administrador
  @OneToMany(() => UserClientModel, (user) => user.createdByAdmin)
  createdUsers: UserClientModel[];

  @Column({ nullable: true })
  nomeEmpresa: string;
}
