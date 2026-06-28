import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity, PrimaryColumn } from "typeorm";
import { PickByValue, Primitive } from "utility-types";
import { v4 as uuidv4 } from 'uuid';

type Defaults<T> = PickByValue<T, Primitive>;

@Entity()
export abstract class BaseModel<T> extends BaseEntity {

    constructor(defaults?: Defaults<T>) {

        super();

        if (defaults) 
            Object.assign(this, defaults);
    }

    @PrimaryGeneratedColumn('uuid')
    _id: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: string;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: string;
}