# OVGS — Sistema de Gestão de Ordens de Venda (API)

<!-- Substitua OWNER/REPO pelo caminho do repositório no GitHub para o badge refletir o status real. -->
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

API REST para gerir o **ciclo de vida completo de Ordens de Venda (OVs)**: cadastros
de apoio (clientes, tipos de transporte, itens), criação e acompanhamento de OVs,
máquina de estados do fluxo operacional, central de agendamento de entregas e
**auditoria orientada a eventos** das principais alterações.

> Solução back-end do *Desafio Técnico OVGS*, construída sobre uma fundação NestJS +
> TypeORM + PostgreSQL madura (camada `shared` reaproveitável, autenticação JWT,
> migrations, seeds e Swagger).

> 💡 Há um **smoke test** (`scripts/smoke-test.py`) que simula a jornada completa e
> popula dados de exemplo em vários cenários (cadastros, ciclo de status, agendamento,
> auditoria) batendo em todas as rotas — útil para validar a API rapidamente. Ver
> [seção 9](#9-testes).

---

## Sumário

- [1. Instruções de execução](#1-instruções-de-execução)
- [2. Tecnologias utilizadas](#2-tecnologias-utilizadas)
- [3. Decisões arquiteturais](#3-decisões-arquiteturais)
- [4. Modelagem do domínio](#4-modelagem-do-domínio)
- [5. Estratégia de persistência](#5-estratégia-de-persistência)
- [6. Escalabilidade](#6-considerações-de-escalabilidade)
- [7. Performance](#7-considerações-de-performance)
- [8. Trade-offs assumidos](#8-trade-offs-assumidos)
- [9. Testes](#9-testes)
- [10. Mapa de endpoints](#10-mapa-de-endpoints)

---

## 1. Instruções de execução

### Pré-requisitos
- Node.js 18+ (testado em Node 22), Yarn 1.x
- Docker + Docker Compose (para o PostgreSQL)

### Opção A — Tudo via Docker Compose (recomendado)

O Compose sobe o Postgres, **aplica as migrations e o seed no boot** e inicia a API.

```bash
docker-compose up --build
```

- API: http://localhost:6789
- Swagger/OpenAPI: http://localhost:6789/docs
- Postgres exposto no host em `localhost:8765`

As variáveis ficam centralizadas em [`.env`](./.env) (consumido pelo Compose).
Dentro da rede do Compose, a API fala com o banco pelo host `postgres`; o `.env`
mantém Postgres, app e portas alinhados.

### Opção B — Postgres no Docker + API local

Útil para desenvolvimento com hot reload e para reproduzir o fluxo de validação.

```bash
# 1. Subir apenas o Postgres (porta 8765 no host)
docker-compose up -d postgres

# 2. Instalar dependências
yarn

# 3. Criar o schema (migrations)
yarn migration:run:dev

# 4. Popular dados base (usuário de login, tipos de transporte, itens)
yarn seed:dev

# 5. Subir a API (porta 6789)
NODE_ENV=dev npx ts-node src/main.ts
# (ou: yarn start:dev — com watch)
```

### Autenticação (obter o token)

Todos os endpoints de negócio são protegidos por JWT. Apenas o login e o `/docs`
são públicos.

```bash
curl -X POST http://localhost:6789/app/authentication/authenticate \
  -H 'Content-Type: application/json' \
  -d '{"email":"[EMAIL]","password":"[SENHA]"}'
```

A resposta segue o envelope padrão; use `data.token` como **Bearer token**:

```json
{ "success": true, "data": { "email": "...", "token": "<JWT>" }, "errors": null }
```

```bash
curl http://localhost:6789/ordens-venda -H 'Authorization: Bearer <JWT>'
```

### Scripts úteis

| Script | Descrição |
|---|---|
| `yarn start` | Sobe a API com `ts-node` (lê `NODE_ENV`). |
| `yarn start:dev` | Sobe a API em modo watch (`NODE_ENV=dev`). |
| `yarn build` | Compila para `build/`. |
| `yarn migration:run:dev` | Aplica as migrations pendentes. |
| `yarn migration:revert:dev` | Reverte a última migration. |
| `yarn seed:dev` | Executa o seed idempotente. |
| `yarn test` | Testes unitários (Jest). |
| `yarn test:e2e` | Teste de integração (Supertest; requer Postgres no ar + seed). |

---

## 2. Tecnologias utilizadas

- **Node.js + TypeScript**
- **NestJS** (módulos, DI, guards, interceptors, exception filters)
- **TypeORM** + **PostgreSQL** (migrations + seeds)
- **@nestjs/event-emitter** (auditoria event-driven)
- **Passport + JWT** (`@nestjs/jwt`, `passport-jwt`) — autenticação/autorização
- **class-validator / class-transformer** (validação declarativa nos DTOs)
- **@nestjs/swagger** (OpenAPI em `/docs`)
- **Jest + Supertest** (testes unitários e de integração)
- **Docker Compose** (PostgreSQL + app)

---

## 3. Decisões arquiteturais

### 3.1. Arquitetura modular em camadas
Cada módulo de negócio segue a separação de responsabilidades exigida:

```
modules/<modulo>/
  controllers/   # HTTP, Swagger, validação de entrada, envelope ResponseDto
  services/      # orquestração + regras de negócio; emite eventos de auditoria
  domain/        # regras puras e testáveis (ex.: OrderStateMachine)
  repositories/  # persistência (estende BaseRepository), queries otimizadas
  models/        # entidades TypeORM
  dtos/          # contratos de entrada/saída desacoplados das entidades
  enums/
```

Módulos do domínio OVGS: `clientes`, `tipos-transporte`, `itens`, `ordens-venda`
(+ `domain`), `agendamentos`, `auditoria`. Autenticação reutiliza o módulo
`client` existente (login + JWT + guards). A camada `shared` concentra
`BaseModel`/`BaseRepository`, envelope `ResponseDto`, paginação, guards,
strategies, filtros e o logger estruturado.

### 3.2. Máquina de estados como domain service
O fluxo `CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE` é modelado em
`OrderStateMachine` — uma classe **pura, sem dependências de framework**, com as
transições declaradas em um mapa explícito (`Record<Status, Status[]>`).
Transições inválidas lançam `InvalidStatusTransitionError`, traduzido para
**HTTP 409**. Isso isola a regra mais crítica do sistema e a torna trivialmente
testável.

**Acoplamento agendamento ↔ status:** a transição para `AGENDADA` exige um
agendamento `CONFIRMADO` (senão 409), garantindo consistência operacional.

### 3.3. Auditoria orientada a eventos (Event-Driven)
Os serviços emitem eventos de domínio (`ov.criada`, `ov.status.alterado`,
`ov.transporte.alterado`, `agendamento.alterado`) via `EventEmitter2`. Um
`AuditoriaListener` desacoplado persiste cada `EventoAuditoria` (com estado
anterior/posterior em `jsonb`). Benefício: a regra de negócio não conhece a
auditoria; falhas de auditoria não derrubam a operação principal.

### 3.4. Extensibilidade de tipos de transporte (Open/Closed)
Novos tipos de transporte são **linhas na tabela**, não código. Não há
`switch/if` por tipo — a autorização é verificada por associação N:N entre
cliente e tipos autorizados.

### 3.5. Autenticação/Autorização
JWT (Bearer) protege todos os endpoints de negócio via `JwtClientAuthGuard`
(`@UseGuards`). Login e Swagger são as únicas rotas públicas. Senhas com hash
`bcrypt`.

### 3.6. Tratamento de erros e logs
- **`HttpExceptionFilter` global**: toda resposta de erro segue o envelope
  `ResponseDto { success, data, errors }`, inclusive erros não capturados (404 de
  rota, falhas de `ValidationPipe`, 500).
- **Logs estruturados** (`StructuredLogger`): cada linha de log é um JSON com
  `timestamp`, `level`, `context` e `message` — pronto para coletores (ELK/Loki).

### 3.7. Observabilidade (health + métricas)
Módulo `observabilidade` (rotas **públicas**, sem guard):
- **`GET /health`** (`@nestjs/terminus`): liveness/readiness com **ping ao
  Postgres** — pronto para sondas de Docker/K8s. Retorna o formato padrão do
  Terminus (`{ status, info, details }`).
- **`GET /metrics`**: exposição **Prometheus** (`text/plain`) via `prom-client` —
  métricas padrão do processo Node + métricas HTTP da aplicação.
- **`MetricsInterceptor`** (global, arquivo novo em `shared/interceptors/`):
  instrumenta `http_requests_total` (contador) e `http_request_duration_seconds`
  (histograma), rotulados por `method`/`route`/`status`. Usa o **padrão da rota**
  (`/ordens-venda/:id`) em vez da URL concreta para evitar alta cardinalidade.

> Os endpoints `/health` e `/metrics` seguem as convenções idiomáticas de
> observabilidade (formato Terminus e exposição Prometheus); por isso **não**
> usam o envelope `ResponseDto`, que continua valendo para todos os endpoints de
> negócio. Como guards executam antes dos interceptors no NestJS, requisições
> rejeitadas por autenticação (401) não entram nas métricas HTTP.

---

## 4. Modelagem do domínio

| Entidade | Campos principais | Relacionamentos |
|---|---|---|
| **Cliente** | `nome`, `documento`, `email`, `ativo` | N:N TipoTransporte (autorizados); 1:N OrdemVenda |
| **TipoTransporte** | `codigo` (único), `nome`, `descricao`, `ativo` | N:N Cliente; 1:N OrdemVenda |
| **Item** | `sku` (único), `nome`, `descricao`, `unidadeMedida` | N:N OrdemVenda via OrdemVendaItem |
| **OrdemVenda** | `numero` (único), `status` (enum), datas | N:1 Cliente; N:1 TipoTransporte; 1:N OrdemVendaItem; 1:1 Agendamento |
| **OrdemVendaItem** | `quantidade` | N:1 OrdemVenda; N:1 Item (único por OV) |
| **Agendamento** | `dataEntrega`, `janelaInicio`, `janelaFim`, `status` | 1:1 OrdemVenda |
| **EventoAuditoria** | `dataHora`, `tipoAcao`, `entidade`, `entidadeId`, `estadoAnterior` (jsonb), `estadoPosterior` (jsonb) | — |

**Invariantes de negócio principais:**
1. OV só é criada se o tipo de transporte estiver **autorizado para o cliente**.
2. OV exige **≥ 1 item**, e os itens devem **existir previamente** (validação por id/SKU).
3. Sem item repetido na mesma OV.
4. Transições de status seguem **estritamente** a máquina de estados.
5. `AGENDADA` exige agendamento `CONFIRMADO`.
6. Agendamento é **1:1** com a OV (`UNIQUE(ordem_venda_id)`); janela válida exige `inicio < fim`.

Identificadores: UUID (`_id`, via `BaseModel`) + chaves de negócio legíveis
(`numero`, `sku`, `codigo`).

---

## 5. Estratégia de persistência

- **TypeORM + PostgreSQL** com `synchronize: false` — o schema é gerido
  **exclusivamente por migrations** versionadas em
  `src/modules/_database/migrations/`, garantindo reprodutibilidade entre ambientes.
- **Seed idempotente** (`nestjs-command`): cria o usuário de login, os tipos de
  transporte (Caminhão, Carreta, Bi-truck) e itens de exemplo — só insere o que
  ainda não existe.
- **Estado anterior/posterior da auditoria em `jsonb`**: snapshot flexível, sem
  exigir tabelas normalizadas por tipo de evento.
- **Repositórios** estendem `BaseRepository` (CRUD + paginação) e sobrescrevem
  consultas quando precisam de `relations` ou query builder.

---

## 6. Considerações de escalabilidade

- **API stateless** (JWT) → escala horizontalmente atrás de um load balancer.
- **Paginação** em todas as listagens pesadas (`take`/`skip` → `PaginateResultDto`),
  evitando varreduras completas.
- **Auditoria desacoplada por eventos** → não acopla latência de escrita de log à
  transação de negócio; pode evoluir para um broker (Kafka/RabbitMQ) sem alterar
  os serviços, apenas o transporte de eventos.
- **Extensibilidade por dado** (tipos de transporte) → evolução do catálogo sem
  deploy.
- **Readiness real** (`GET /health` com ping ao Postgres) → orquestradores só
  roteiam tráfego para instâncias com a dependência crítica saudável.

---

## 7. Considerações de performance

- **Índices** alinhados aos filtros de monitoramento: `status`, `cliente`,
  `tipo_transporte`, `created_at` (índice dedicado para ordenação/range de data),
  e em auditoria por `(entidade, entidade_id)`, `tipo_acao` e `data_hora`.
- **Query builder** em `findByFiltros` para gerar SQL enxuto, com `andWhere`
  condicionais e `BETWEEN`/`>=`/`<=` para intervalos de data.
- **`getManyAndCount`** retorna página + total em uma ida, alimentando a navegação.
- Filtros usam **caminhos de propriedade da entidade** (não nomes crus de coluna),
  evitando que o TypeORM 0.3 falhe ao montar a subconsulta de paginação distinta.
- **Métricas de latência** (`http_request_duration_seconds`, via
  `MetricsInterceptor` + `/metrics`) permitem identificar rotas lentas e definir
  SLOs sem instrumentação manual por endpoint.

---

## 8. Trade-offs assumidos

| Decisão | Escolha | Justificativa / trade-off |
|---|---|---|
| ORM | TypeORM | Atende o requisito; migrations/seed já consolidados. |
| Validação | `class-validator` + `ValidationPipe` | Declarativa e idiomática no Nest. |
| Auditoria | Event-Driven (`@nestjs/event-emitter`) | Desacopla auditoria da regra; trade-off: consistência eventual do log. |
| Autenticação | Reutilizar login JWT do módulo `client` | Aproveita um diferencial pronto e testado, sem reescrever auth. |
| Estado da auditoria | Snapshot `jsonb` | Flexível e simples; menos normalizado para consultas analíticas. |
| Multi-tenant | **Não** particionar OVs por usuário | Fora do escopo; todo usuário autenticado opera o mesmo conjunto. |
| Disponibilidade de agendamento | Simplificada (sem calendário real) | Permitido pelo enunciado; foco nas regras de ciclo de vida. |
| Camada `shared` | Mantida intacta (S3/SendGrid/Zenvia/CEP) | Infra/diferenciais disponíveis sem custo de manutenção adicional. |
| Cache de leitura | `CacheModule` (`@nestjs/common`) em memória nos catálogos `GET /tipos-transporte` e `GET /itens` | **Latência vs. consistência:** catálogos de baixa volatilidade ganham respostas ~7x mais rápidas no cache hit; a consistência é preservada por **invalidação explícita** (`del` da chave no create/update) + **TTL curto (60s)** como rede de segurança. Trade-off do store em memória: não compartilhado entre réplicas — para escala horizontal real, trocar por Redis (`cache-manager` suporta sem alterar os services). Optou-se pelo `CacheModule` nativo do `@nestjs/common` (não `@nestjs/cache-manager`, que é do Nest 9+) por compatibilidade com o NestJS 8 da base. |

---

## 9. Testes

```bash
# Unitários (não precisam de banco) — 44 testes
yarn test

# Integração e2e (requer Postgres no ar + migrations + seed) — 13 testes
yarn test:e2e

# Cobertura (aplica metas mínimas nos serviços de negócio)
yarn test:cov

# Smoke test — simula a jornada completa e popula dados em vários cenários,
# batendo em TODAS as rotas + casos de erro (requer a API no ar).
# Antes de rodar, edite as variáveis EMAIL e SENHA no topo do script
# (scripts/smoke-test.py) — ele NÃO lê de variável de ambiente.
python3 scripts/smoke-test.py
```

- **Unitários** (`*.spec.ts`, 44 testes):
  - `order-state-machine.spec.ts` — transições válidas/inválidas e estado terminal.
  - `ordem-venda.service.spec.ts` — `create` (autorização de transporte,
    existência de cliente/tipo/itens, item repetido, evento `ov.criada`),
    `updateStatus` (transição válida/inválida → 409, acoplamento AGENDADA ↔
    agendamento CONFIRMADO) e `updateTransporte` (revalidação de autorização,
    no-op, 404/400).
  - `cliente.service.spec.ts` — `setTiposTransporte` (sucesso, tipo inexistente,
    cliente inexistente, lista vazia) e unicidade de documento/e-mail no `create`.
  - `agendamento.service.spec.ts` — `definir`/`confirmar`/`reagendar`, validação
    de janela (início < fim), regra 1:1 com a OV e emissão de eventos.
- **Integração** (`test/ovgs.e2e-spec.ts`, Supertest, 13 testes):
  login → cadastros → criar OV (CRIADA) → 409 ao pular para AGENDADA →
  agendar → confirmar → PLANEJADA → AGENDADA → auditoria → **reagendar** →
  **alterar transporte (autorizado 200 e negado 400)** → **monitoramento com
  filtros (cliente + status) e paginação** → auditoria de transporte; inclui
  401 sem token e 400 para transporte não autorizado na criação.

- **Smoke test** (`scripts/smoke-test.py`, sem dependências externas): simula a
  jornada de ponta a ponta (login → cadastros → OV → status até ENTREGUE →
  agendamento → auditoria → health/metrics), **populando dados de exemplo** e
  exercitando **todas as rotas** + os cenários de erro (401/409/400). As credenciais
  de login são definidas **direto no topo do script** (variáveis `EMAIL` e `SENHA`) —
  ele **não** lê de variável de ambiente. É re-executável (usa sufixo de timestamp).

**Cobertura (`yarn test:cov`):** o foco é a **lógica de negócio**, não a fundação
herdada (`shared/`, login `client`, repositórios, migrations) — por isso a meta é
definida **por arquivo** via `coverageThreshold`, e não globalmente. Os núcleos de
domínio ficam em níveis altos: `order-state-machine` ~100%, `ordem-venda.service`
~94%, `agendamento.service` ~98% (linhas). Metas mínimas configuradas garantem que
regressões nesses arquivos quebrem o relatório.

> No ambiente sandbox, os workers do Jest podem exigir `--runInBand`
> (ex.: `yarn test --runInBand`).

---

## 10. Mapa de endpoints

> Todos exigem `Authorization: Bearer <JWT>`, exceto o login.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/app/authentication/authenticate` | Login → retorna JWT (público) |
| POST/GET/GET`:id`/PATCH`:id` | `/clientes` | CRUD de clientes |
| PUT | `/clientes/:id/tipos-transporte` | Define tipos de transporte autorizados |
| POST/GET/GET`:id`/PATCH`:id` | `/tipos-transporte` | CRUD de tipos de transporte |
| POST/GET/GET`:id` | `/itens` | Cadastro e consulta de itens |
| POST | `/ordens-venda` | Cria OV (valida autorização + itens) |
| GET | `/ordens-venda` | Lista com filtros (status, cliente, tipo, data) + paginação |
| GET | `/ordens-venda/:id` | Detalhe da OV |
| PATCH | `/ordens-venda/:id/status` | Atualiza status (máquina de estados) |
| PATCH | `/ordens-venda/:id/transporte` | Altera o tipo de transporte (revalida autorização) |
| POST | `/agendamentos` | Define data/janela de entrega |
| PATCH | `/agendamentos/:id/confirmar` | Confirma o agendamento |
| PATCH | `/agendamentos/:id/reagendar` | Reagenda (nova data/janela) |
| GET | `/agendamentos/:id` | Detalhe do agendamento |
| GET | `/auditoria` | Consulta eventos (entidade, id, tipo, período) + paginação |
| GET | `/health` | Liveness/readiness + ping ao Postgres (**público**) |
| GET | `/metrics` | Métricas no formato Prometheus (**público**) |
