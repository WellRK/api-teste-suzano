import { Column, Entity, ManyToMany, OneToMany } from "typeorm";
import { BaseModel } from "../../../shared/model/base.model";
import { UserClientModel } from "./user-client.model";


@Entity({ name: 'profile_client' })
export class ProfileClientModel extends BaseModel<ProfileClientModel> {

    @Column({ nullable: false })
    _id: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    description: string;

    @ManyToMany(() => UserClientModel, user => user.profile)
    users: UserClientModel[];
}