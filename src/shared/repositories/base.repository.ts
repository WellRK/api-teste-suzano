import { FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { PaginateResultDto } from "../dtos/paginate-result.dto";
import { IBaseRepository } from "../interfaces/ibase.repository";
import { BaseModel } from "../model/base.model";


export class BaseRepository<T extends BaseModel<T>> implements IBaseRepository<T> {

    protected _model: Repository<T>;

    constructor(
        repository: Repository<T>,
    ) {
        this._model = repository;
    }

    async list(): Promise<T[] | null> {

        const query: FindManyOptions = { order: { createdAt: 'DESC' } };

        return this._model
            .find(query);
    }

    async listPaginate(take: number = 10, skip: number = 0): Promise<PaginateResultDto> {

        const query: FindManyOptions = {
            take: take,
            skip: skip,
            order: { createdAt: 'DESC' }
        };

        const [result, total] = await this._model
            .findAndCount(query);

        return new PaginateResultDto(
            result,
            total
        );
    }

    async getById(_id: string): Promise<T | null> {

        const query: FindOneOptions = { where: { _id: _id } };

        return await this._model
            .findOne(query);
    }

    async save(dto: any): Promise<T> {
        return await this._model.save(dto);
    }

    async update(_id: string, item: QueryDeepPartialEntity<T>): Promise<void> {
        await this._model.update(_id, item);
    }

    async delete(_id: string) {
        await this._model.delete(_id);
    }


    
}