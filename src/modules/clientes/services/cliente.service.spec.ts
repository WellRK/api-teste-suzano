import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClienteRepository } from '../repositories/cliente.repository';
import { TipoTransporteRepository } from '../../tipos-transporte/repositories/tipo-transporte.repository';
import { ClienteService } from './cliente.service';

/**
 * Testes unitários de `ClienteService` com repositórios mockados.
 *
 * Foco na gestão dos tipos de transporte autorizados (`setTiposTransporte`),
 * que sustenta a regra central "OV só com transporte autorizado", e nas
 * invariantes de unicidade (documento/e-mail) na criação.
 */
describe('ClienteService', () => {
  const CLIENTE_ID = '33333333-3333-3333-3333-333333333333';
  const TT1 = 'tt-1';
  const TT2 = 'tt-2';

  let service: ClienteService;
  let repository: jest.Mocked<
    Pick<
      ClienteRepository,
      'getByDocumento' | 'getByEmail' | 'save' | 'getById' | 'update' | 'list'
    >
  >;
  let tipoTransporteRepository: jest.Mocked<
    Pick<TipoTransporteRepository, 'getByIds'>
  >;

  beforeEach(() => {
    repository = {
      getByDocumento: jest.fn().mockResolvedValue(null),
      getByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue({ _id: CLIENTE_ID }),
      getById: jest.fn().mockResolvedValue({
        _id: CLIENTE_ID,
        nome: 'Indústria Acme Ltda',
        documento: '123',
        email: 'acme@teste.com',
        ativo: true,
        tiposTransporte: [],
      }),
      update: jest.fn().mockResolvedValue(undefined),
      list: jest.fn().mockResolvedValue([]),
    };
    tipoTransporteRepository = {
      getByIds: jest.fn().mockResolvedValue([{ _id: TT1 }, { _id: TT2 }]),
    };

    service = new ClienteService(
      repository as unknown as ClienteRepository,
      tipoTransporteRepository as unknown as TipoTransporteRepository,
    );
  });

  describe('setTiposTransporte', () => {
    it('substitui os tipos autorizados quando todos existem', async () => {
      await service.setTiposTransporte(CLIENTE_ID, {
        tiposTransporteIds: [TT1, TT2],
      });

      expect(tipoTransporteRepository.getByIds).toHaveBeenCalledWith([
        TT1,
        TT2,
      ]);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: CLIENTE_ID,
          tiposTransporte: [{ _id: TT1 }, { _id: TT2 }],
        }),
      );
    });

    it('rejeita (400) quando algum tipo de transporte não existe', async () => {
      tipoTransporteRepository.getByIds.mockResolvedValue([{ _id: TT1 } as any]);

      await expect(
        service.setTiposTransporte(CLIENTE_ID, {
          tiposTransporteIds: [TT1, TT2],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejeita (404) quando o cliente não existe', async () => {
      repository.getById.mockResolvedValue(null);

      await expect(
        service.setTiposTransporte(CLIENTE_ID, { tiposTransporteIds: [TT1] }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('aceita lista vazia (remove todos os tipos autorizados)', async () => {
      await service.setTiposTransporte(CLIENTE_ID, { tiposTransporteIds: [] });

      expect(tipoTransporteRepository.getByIds).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tiposTransporte: [] }),
      );
    });
  });

  describe('create', () => {
    it('rejeita (400) quando o documento já está cadastrado', async () => {
      repository.getByDocumento.mockResolvedValue({ _id: 'outro' } as any);

      await expect(
        service.create({
          nome: 'Nova Empresa',
          documento: '123',
          email: 'nova@teste.com',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejeita (400) quando o e-mail já está cadastrado', async () => {
      repository.getByEmail.mockResolvedValue({ _id: 'outro' } as any);

      await expect(
        service.create({
          nome: 'Nova Empresa',
          documento: '999',
          email: 'acme@teste.com',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
