import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CepDto } from "../dtos/cep.dto";
import { EnviromentVariablesEnum } from "../enums/enviroment.variables.enum";

@Injectable()
export class CepRepository {

    constructor(
        private readonly _configService: ConfigService,
        private readonly _httpService: HttpService,
    ) { }

    async getAddressByCep(cep: string): Promise<CepDto> {
        let apiUrl = this._configService.get<string>(EnviromentVariablesEnum.CEP_API);
        apiUrl = apiUrl.replace('--cep--', cep);
        return await  this._httpService.get(apiUrl)
            .toPromise()
            .then(response => {
                return this._convertResponse(response)
            });
    }

    private _convertResponse(response): CepDto {

        let cep = new CepDto();
        cep.cep = response.data.cep;
        cep.logradouro = response.data.logradouro;
        cep.complemento = response.data.complemento;
        cep.bairro = response.data.bairro;
        cep.cidade = response.data.localidade;
        cep.uf = response.data.uf;
        return cep;
    }
}