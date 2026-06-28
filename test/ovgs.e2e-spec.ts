import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';

/**
 * Teste de integração (e2e) do fluxo principal do OVGS.
 *
 * Exercita a aplicação real (HTTP + TypeORM + Postgres) cobrindo a regra de
 * negócio central de ponta a ponta:
 *
 *   login (JWT) → cadastra apoio → cria OV (CRIADA) → agenda → confirma
 *   agendamento → transiciona OV para PLANEJADA → AGENDADA → consulta auditoria.
 *
 * Também valida a proteção das rotas (401 sem token) e o acoplamento
 * agendamento↔status (AGENDADA exige agendamento CONFIRMADO).
 *
 * Pré-requisitos: Postgres no ar (localhost:8765) com migrations aplicadas e
 * seed executado (usuário de login + tipos/itens). Rode antes:
 *   yarn migration:run:dev && yarn seed:dev
 */
describe('OVGS - fluxo de Ordem de Venda (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let token: string;

  const sufixo = Date.now();
  let tipoTransporteId: string;
  let itemId: string;
  let clienteId: string;
  let ordemId: string;
  let agendamentoId: string;
  let segundoTipoId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    server = app.getHttpServer();

    const login = await request(server)
      .post('/app/authentication/authenticate')
      .send({ email: 'smandev2023@gmail.com', password: 'S@dev00!' })
      .expect(200);

    expect(login.body.success).toBe(true);
    expect(login.body.data.token).toBeDefined();
    token = login.body.data.token;
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('bloqueia rota protegida sem token (401)', async () => {
    await request(server).get('/ordens-venda').expect(401);
  });

  it('cadastra tipo de transporte, item e cliente (com transporte autorizado)', async () => {
    const tipo = await request(server)
      .post('/tipos-transporte')
      .set(auth())
      .send({
        codigo: `E2E-TT-${sufixo}`,
        nome: 'Caminhão E2E',
        descricao: 'Tipo criado pelo teste de integração',
      })
      .expect(201);
    tipoTransporteId = tipo.body.data._id;
    expect(tipoTransporteId).toBeDefined();

    const item = await request(server)
      .post('/itens')
      .set(auth())
      .send({
        sku: `E2E-SKU-${sufixo}`,
        nome: 'Item E2E',
        unidadeMedida: 'UN',
      })
      .expect(201);
    itemId = item.body.data._id;
    expect(itemId).toBeDefined();

    const cliente = await request(server)
      .post('/clientes')
      .set(auth())
      .send({
        nome: 'Cliente E2E',
        documento: `E2E-${sufixo}`,
        email: `e2e-${sufixo}@teste.com`,
        tiposTransporteIds: [tipoTransporteId],
      })
      .expect(201);
    clienteId = cliente.body.data._id;
    expect(clienteId).toBeDefined();
  });

  it('cria a Ordem de Venda com status inicial CRIADA', async () => {
    const res = await request(server)
      .post('/ordens-venda')
      .set(auth())
      .send({
        clienteId,
        tipoTransporteId,
        itens: [{ itemId, quantidade: 10 }],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CRIADA');
    ordemId = res.body.data._id;
    expect(ordemId).toBeDefined();
  });

  it('rejeita criação de OV com transporte não autorizado para o cliente (400)', async () => {
    const outroTipo = await request(server)
      .post('/tipos-transporte')
      .set(auth())
      .send({ codigo: `E2E-TT2-${sufixo}`, nome: 'Carreta E2E' })
      .expect(201);

    await request(server)
      .post('/ordens-venda')
      .set(auth())
      .send({
        clienteId,
        tipoTransporteId: outroTipo.body.data._id,
        itens: [{ itemId, quantidade: 1 }],
      })
      .expect(400);
  });

  it('impede ir direto para AGENDADA (transição inválida a partir de CRIADA) (409)', async () => {
    await request(server)
      .patch(`/ordens-venda/${ordemId}/status`)
      .set(auth())
      .send({ status: 'AGENDADA' })
      .expect(409);
  });

  it('define e confirma o agendamento da OV', async () => {
    const ag = await request(server)
      .post('/agendamentos')
      .set(auth())
      .send({
        ordemVendaId: ordemId,
        dataEntrega: '2026-12-15',
        janelaInicio: '08:00',
        janelaFim: '12:00',
      })
      .expect(201);
    agendamentoId = ag.body.data._id;
    expect(ag.body.data.status).toBe('PENDENTE');

    const confirmado = await request(server)
      .patch(`/agendamentos/${agendamentoId}/confirmar`)
      .set(auth())
      .expect(200);
    expect(confirmado.body.data.status).toBe('CONFIRMADO');
  });

  it('transiciona a OV: CRIADA → PLANEJADA → AGENDADA (com agendamento confirmado)', async () => {
    const planejada = await request(server)
      .patch(`/ordens-venda/${ordemId}/status`)
      .set(auth())
      .send({ status: 'PLANEJADA' })
      .expect(200);
    expect(planejada.body.data.status).toBe('PLANEJADA');

    const agendada = await request(server)
      .patch(`/ordens-venda/${ordemId}/status`)
      .set(auth())
      .send({ status: 'AGENDADA' })
      .expect(200);
    expect(agendada.body.data.status).toBe('AGENDADA');
  });

  it('registra eventos de auditoria da OV (criação e alterações de status)', async () => {
    // a auditoria é assíncrona (event-driven); aguarda a propagação dos eventos
    await new Promise((r) => setTimeout(r, 500));

    const res = await request(server)
      .get(`/auditoria?entidade=OrdemVenda&entidadeId=${ordemId}`)
      .set(auth())
      .expect(200);

    const eventos = res.body.data.result;
    expect(Array.isArray(eventos)).toBe(true);
    expect(eventos.length).toBeGreaterThanOrEqual(2);

    const tipos = eventos.map((e: any) => e.tipoAcao);
    expect(tipos).toContain('OV_CRIADA');
    expect(tipos).toContain('OV_STATUS_ALTERADO');
  });

  it('reagenda o agendamento (status REAGENDADO)', async () => {
    const res = await request(server)
      .patch(`/agendamentos/${agendamentoId}/reagendar`)
      .set(auth())
      .send({
        dataEntrega: '2027-01-20',
        janelaInicio: '14:00',
        janelaFim: '18:00',
      })
      .expect(200);

    expect(res.body.data.status).toBe('REAGENDADO');
    expect(res.body.data.dataEntrega).toContain('2027-01-20');
  });

  it('altera o transporte da OV para um tipo autorizado (200)', async () => {
    const novoTipo = await request(server)
      .post('/tipos-transporte')
      .set(auth())
      .send({ codigo: `E2E-TT3-${sufixo}`, nome: 'Bi-truck E2E' })
      .expect(201);
    segundoTipoId = novoTipo.body.data._id;

    // autoriza ambos os tipos para o cliente antes de trocar
    await request(server)
      .put(`/clientes/${clienteId}/tipos-transporte`)
      .set(auth())
      .send({ tiposTransporteIds: [tipoTransporteId, segundoTipoId] })
      .expect(200);

    const alterada = await request(server)
      .patch(`/ordens-venda/${ordemId}/transporte`)
      .set(auth())
      .send({ tipoTransporteId: segundoTipoId })
      .expect(200);

    expect(alterada.body.data.tipoTransporteId).toBe(segundoTipoId);
  });

  it('rejeita alteração de transporte para tipo não autorizado (400)', async () => {
    const tipoNaoAutorizado = await request(server)
      .post('/tipos-transporte')
      .set(auth())
      .send({ codigo: `E2E-TT4-${sufixo}`, nome: 'Não autorizado E2E' })
      .expect(201);

    await request(server)
      .patch(`/ordens-venda/${ordemId}/transporte`)
      .set(auth())
      .send({ tipoTransporteId: tipoNaoAutorizado.body.data._id })
      .expect(400);
  });

  it('monitora OVs com filtros combinados (cliente + status) e paginação', async () => {
    const res = await request(server)
      .get(
        `/ordens-venda?clienteId=${clienteId}&status=AGENDADA&take=10&skip=0`,
      )
      .set(auth())
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.result)).toBe(true);
    expect(res.body.data.count).toBeGreaterThanOrEqual(1);

    const ids = res.body.data.result.map((o: any) => o._id);
    expect(ids).toContain(ordemId);
    res.body.data.result.forEach((o: any) => {
      expect(o.clienteId).toBe(clienteId);
      expect(o.status).toBe('AGENDADA');
    });
  });

  it('registra o evento de alteração de transporte na auditoria', async () => {
    await new Promise((r) => setTimeout(r, 500));

    const res = await request(server)
      .get(`/auditoria?entidade=OrdemVenda&entidadeId=${ordemId}`)
      .set(auth())
      .expect(200);

    const tipos = res.body.data.result.map((e: any) => e.tipoAcao);
    expect(tipos).toContain('OV_TRANSPORTE_ALTERADO');
  });
});
