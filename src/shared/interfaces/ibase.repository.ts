import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { PaginateResultDto } from "../dtos/paginate-result.dto";
import { BaseModel } from "../model/base.model";

export interface IBaseRepository<T extends BaseModel<T>> {

    list(): Promise<T[] | null>;

    listPaginate(take: number, skip: number): Promise<PaginateResultDto>;

    getById(id: string): Promise<T | null>;

    save(item: T): Promise<T>;

    update(id: string, item: QueryDeepPartialEntity<T>): Promise<void>;

    delete(id: string): void;
}
