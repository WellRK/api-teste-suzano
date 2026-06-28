export class PaginateResultDto {
    constructor(
        public result: any[],
        public count: number,
    ) { }
}