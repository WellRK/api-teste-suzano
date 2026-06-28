#!/usr/bin/env python3
"""
Smoke test do OVGS — exercita TODAS as rotas da API na ordem da jornada
e valida os principais cenários de erro (401 / 409 / 400).

Não exige dependências externas (usa só a stdlib). Não precisa de jq.

Uso:
    python3 smoke-test.py                      # usa http://localhost:6789
    python3 smoke-test.py http://host:porta    # base customizada
    BASE_URL=http://host:porta python3 smoke-test.py

Credenciais de login: edite EMAIL e SENHA no topo do arquivo (use os mesmos valores
de SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD do .env). NÃO lê de variável de ambiente.

Pré-requisitos: API no ar + migrations aplicadas + seed executado.
Cada execução usa um sufixo único (timestamp), então é re-executável sem
colidir com documento/email/sku/codigo já cadastrados.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

BASE = (len(sys.argv) > 1 and sys.argv[1]) or os.environ.get(
    "BASE_URL", "http://localhost:6789"
)
SUFIXO = int(time.time())

# Credenciais de login — edite aqui (mesmos valores de SEED_ADMIN_* do .env).
EMAIL = 'EMAIL'
SENHA = 'SENHA'

# ---------------------------------------------------------------- infra HTTP
PASS = 0
FAIL = 0
GREEN = "\033[32m"
RED = "\033[31m"
DIM = "\033[2m"
RESET = "\033[0m"

TOKEN = None


def req(method, path, body=None, token=None, expected=None, label=None):
    """Dispara a requisição e registra PASS/FAIL conforme o status esperado."""
    global PASS, FAIL
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    if data is not None:
        r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", "Bearer " + token)

    try:
        resp = urllib.request.urlopen(r)
        status = resp.getcode()
        raw = resp.read().decode()
    except urllib.error.HTTPError as e:
        status = e.code
        raw = e.read().decode()
    except Exception as e:  # conexão recusada etc.
        status = -1
        raw = str(e)

    try:
        parsed = json.loads(raw)
    except Exception:
        parsed = raw

    name = label or f"{method} {path}"
    ok = (status == expected) if expected is not None else (200 <= status < 300)
    if ok:
        PASS += 1
        print(f"{GREEN}PASS{RESET} {name} {DIM}({status}){RESET}")
    else:
        FAIL += 1
        exp = f" esperado {expected}" if expected is not None else ""
        print(f"{RED}FAIL{RESET} {name} {DIM}(recebido {status},{exp}){RESET}")
        snippet = raw if isinstance(parsed, str) else json.dumps(parsed)
        print(f"     {DIM}{snippet[:200]}{RESET}")
    return parsed


def data_of(parsed):
    return parsed.get("data") if isinstance(parsed, dict) else None


def section(title):
    print(f"\n{DIM}── {title} ──{RESET}")


# ----------------------------------------------------------------- jornada
print(f"OVGS smoke test → {BASE}  (sufixo {SUFIXO})")

section("1. Autenticação")
login = req(
    "POST",
    "/app/authentication/authenticate",
    {"email": EMAIL, "password": SENHA},
    expected=200,
    label="POST /app/authentication/authenticate (login)",
)
d = data_of(login)
TOKEN = d.get("token") if d else None
if not TOKEN:
    print(f"{RED}Sem token — abortando.{RESET}")
    sys.exit(1)

req("GET", "/ordens-venda", token=None, expected=401,
    label="GET /ordens-venda sem token (401)")

# logins inválidos retornam 400 no controller
req("POST", "/app/authentication/authenticate",
    {"email": EMAIL, "password": "senha-errada"},
    expected=400, label="POST login senha inválida (400)")

section("2. Tipos de transporte")
lista_tt = req("GET", "/tipos-transporte", token=TOKEN, expected=200)
tipo_seed_id = data_of(lista_tt)[0]["_id"]

tt_novo = req("POST", "/tipos-transporte", token=TOKEN, expected=201,
              body={"codigo": f"SMOKE-TT-{SUFIXO}", "nome": "Tipo Smoke",
                    "descricao": "criado pelo smoke test"})
tipo_id = data_of(tt_novo)["_id"]
req("GET", f"/tipos-transporte/{tipo_id}", token=TOKEN, expected=200,
    label="GET /tipos-transporte/{id}")
req("PATCH", f"/tipos-transporte/{tipo_id}", token=TOKEN, expected=200,
    body={"descricao": "atualizado pelo smoke test"},
    label="PATCH /tipos-transporte/{id}")

# segundo tipo (para troca de transporte) e um não autorizado
tt_segundo = req("POST", "/tipos-transporte", token=TOKEN, expected=201,
                 body={"codigo": f"SMOKE-TT2-{SUFIXO}", "nome": "Tipo Smoke 2"},
                 label="POST /tipos-transporte (segundo)")
segundo_tipo_id = data_of(tt_segundo)["_id"]
tt_nao_aut = req("POST", "/tipos-transporte", token=TOKEN, expected=201,
                 body={"codigo": f"SMOKE-TTX-{SUFIXO}", "nome": "Tipo não autorizado"},
                 label="POST /tipos-transporte (não autorizado)")
nao_autorizado_id = data_of(tt_nao_aut)["_id"]

section("3. Itens")
lista_itens = req("GET", "/itens", token=TOKEN, expected=200)
item_novo = req("POST", "/itens", token=TOKEN, expected=201,
                body={"sku": f"SMOKE-SKU-{SUFIXO}", "nome": "Item Smoke",
                      "unidadeMedida": "UN"})
item_id = data_of(item_novo)["_id"]
req("GET", f"/itens/{item_id}", token=TOKEN, expected=200,
    label="GET /itens/{id}")

section("4. Clientes")
cli = req("POST", "/clientes", token=TOKEN, expected=201,
          body={"nome": "Cliente Smoke", "documento": f"SMOKE-{SUFIXO}",
                "email": f"smoke-{SUFIXO}@teste.com",
                "tiposTransporteIds": [tipo_id]})
cliente_id = data_of(cli)["_id"]
req("GET", "/clientes", token=TOKEN, expected=200)
req("GET", f"/clientes/{cliente_id}", token=TOKEN, expected=200,
    label="GET /clientes/{id}")
req("PATCH", f"/clientes/{cliente_id}", token=TOKEN, expected=200,
    body={"nome": "Cliente Smoke S.A."}, label="PATCH /clientes/{id}")
req("PUT", f"/clientes/{cliente_id}/tipos-transporte", token=TOKEN, expected=200,
    body={"tiposTransporteIds": [tipo_id]},
    label="PUT /clientes/{id}/tipos-transporte")

section("5. Ordem de Venda")
ov = req("POST", "/ordens-venda", token=TOKEN, expected=201,
         body={"clienteId": cliente_id, "tipoTransporteId": tipo_id,
               "itens": [{"itemId": item_id, "quantidade": 10}]})
ov_id = data_of(ov)["_id"]

req("POST", "/ordens-venda", token=TOKEN, expected=400,
    body={"clienteId": cliente_id, "tipoTransporteId": nao_autorizado_id,
          "itens": [{"itemId": item_id, "quantidade": 1}]},
    label="POST /ordens-venda transporte NÃO autorizado (400)")

req("GET", "/ordens-venda", token=TOKEN, expected=200)
req("GET", f"/ordens-venda?clienteId={cliente_id}&status=CRIADA&take=10&skip=0",
    token=TOKEN, expected=200, label="GET /ordens-venda (filtros + paginação)")
req("GET", f"/ordens-venda/{ov_id}", token=TOKEN, expected=200,
    label="GET /ordens-venda/{id}")

req("PATCH", f"/ordens-venda/{ov_id}/status", token=TOKEN, expected=409,
    body={"status": "AGENDADA"},
    label="PATCH status CRIADA→AGENDADA (pula etapa) (409)")

req("PATCH", f"/ordens-venda/{ov_id}/status", token=TOKEN, expected=200,
    body={"status": "PLANEJADA"}, label="PATCH status → PLANEJADA")

section("6. Agendamento")
ag = req("POST", "/agendamentos", token=TOKEN, expected=201,
         body={"ordemVendaId": ov_id, "dataEntrega": "2026-12-15",
               "janelaInicio": "08:00", "janelaFim": "12:00"})
agendamento_id = data_of(ag)["_id"]

req("POST", "/agendamentos", token=TOKEN, expected=400,
    body={"ordemVendaId": ov_id, "dataEntrega": "2026-12-16",
          "janelaInicio": "08:00", "janelaFim": "12:00"},
    label="POST /agendamentos duplicado na mesma OV (400)")

req("GET", f"/agendamentos/{agendamento_id}", token=TOKEN, expected=200,
    label="GET /agendamentos/{id}")
req("PATCH", f"/agendamentos/{agendamento_id}/confirmar", token=TOKEN,
    expected=200, label="PATCH /agendamentos/{id}/confirmar")

section("7. Ciclo de status até ENTREGUE")
req("PATCH", f"/ordens-venda/{ov_id}/status", token=TOKEN, expected=200,
    body={"status": "AGENDADA"}, label="PATCH status → AGENDADA")

# troca de transporte enquanto AGENDADA (autoriza ambos antes)
req("PUT", f"/clientes/{cliente_id}/tipos-transporte", token=TOKEN, expected=200,
    body={"tiposTransporteIds": [tipo_id, segundo_tipo_id]},
    label="PUT autoriza 2 tipos no cliente")
req("PATCH", f"/ordens-venda/{ov_id}/transporte", token=TOKEN, expected=200,
    body={"tipoTransporteId": segundo_tipo_id},
    label="PATCH /ordens-venda/{id}/transporte (autorizado)")
req("PATCH", f"/ordens-venda/{ov_id}/transporte", token=TOKEN, expected=400,
    body={"tipoTransporteId": nao_autorizado_id},
    label="PATCH transporte NÃO autorizado (400)")

req("PATCH", f"/agendamentos/{agendamento_id}/reagendar", token=TOKEN, expected=200,
    body={"dataEntrega": "2027-01-20", "janelaInicio": "14:00",
          "janelaFim": "18:00"}, label="PATCH /agendamentos/{id}/reagendar")

req("PATCH", f"/ordens-venda/{ov_id}/status", token=TOKEN, expected=200,
    body={"status": "EM_TRANSPORTE"}, label="PATCH status → EM_TRANSPORTE")
req("PATCH", f"/ordens-venda/{ov_id}/status", token=TOKEN, expected=200,
    body={"status": "ENTREGUE"}, label="PATCH status → ENTREGUE")
req("PATCH", f"/ordens-venda/{ov_id}/status", token=TOKEN, expected=409,
    body={"status": "CRIADA"}, label="PATCH status a partir de ENTREGUE (terminal) (409)")

section("8. Auditoria")
time.sleep(0.8)  # auditoria é event-driven (assíncrona)
req("GET", "/auditoria", token=TOKEN, expected=200)
req("GET", f"/auditoria?entidade=OrdemVenda&entidadeId={ov_id}", token=TOKEN,
    expected=200, label="GET /auditoria (filtro por OV)")

section("9. Observabilidade (públicas)")
req("GET", "/health", expected=200, label="GET /health (sem token)")
req("GET", "/metrics", expected=200, label="GET /metrics (sem token)")

# ------------------------------------------------------------------ resumo
total = PASS + FAIL
print(f"\n{'='*48}")
color = GREEN if FAIL == 0 else RED
print(f"{color}Resultado: {PASS}/{total} PASS, {FAIL} FAIL{RESET}")
sys.exit(1 if FAIL else 0)
