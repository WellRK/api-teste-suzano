// Executado pelo Jest (setupFiles) ANTES de qualquer import dos módulos do app.
// O Jest define NODE_ENV=test por padrão; como não há config/env/test.env,
// usamos 'dev' (Postgres local em localhost:8765) para os testes de integração.
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'test') {
  process.env.NODE_ENV = 'dev';
}
