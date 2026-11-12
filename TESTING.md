# Guia de Testes — Chegou.AI

## Visão Geral da Suíte

| Camada | Ferramenta | Localização | Comando |
| :--- | :--- | :--- | :--- |
| **Unitários (API)** | Vitest + SWC | `apps/api/src/**/*.spec.ts` | `npm --prefix apps/api run test:unit` |
| **Unitários (Web)** | Vitest + Testing Library | `apps/web/src/**/*.spec.{ts,tsx}` | `npm --prefix apps/web run test` |
| **Integração (API)** | Vitest + Supertest + Postgres + Redis | `apps/api/test/integration/*.int-spec.ts` | `npm --prefix apps/api run test:integration` |
| **E2E (Web)** | Playwright | `apps/web/e2e/*.spec.ts` | `npm --prefix apps/web run test:e2e` |
| **Cobertura** | V8 (`@vitest/coverage-v8`) | `apps/*/coverage/` | `npm run test:cov` |

---

## 1. Testes Unitários (Sem dependências externas)

Na raiz do monorepo:

```bash
npm run test:unit
```

Para gerar relatório de cobertura:

```bash
npm run test:cov
```

---

## 2. Banco e Redis de Teste (Integração)

Os testes de integração rodam contra PostgreSQL 16 e Redis 7 reais e isolados (portas `5433` e `6380`), usando variáveis fictícias de `.env.test`.

### Subir a infraestrutura de teste
```bash
docker compose -f docker-compose.test.yml up -d
```

### Executar os testes de integração
```bash
npm run test:integration
```

O `setup-integration.ts` executa `prisma migrate deploy` automaticamente e o helper `resetTestState` limpa tabelas e Redis entre os testes.

### Derrubar a infraestrutura de teste
```bash
docker compose -f docker-compose.test.yml down -v
```

---

## 3. Testes E2E (Playwright)

```bash
npx --prefix apps/web playwright install chromium
npm run test:e2e
```

Por padrão, o `playwright.config.ts` sobe o Next.js em modo isolado (`NEXT_PUBLIC_USE_MOCKS=true`) na porta `3005`. Para rodar contra a API real de teste, defina `E2E_USE_REAL_API=true`.

---

## 4. Como Adicionar Novos Casos

- **Unitários (API):** Crie `<arquivo>.spec.ts` ao lado do código-fonte em `apps/api/src/` seguindo o padrão `"deve <comportamento> quando <condição>"`.
- **Integração (API):** Crie `<fluxo>.int-spec.ts` em `apps/api/test/integration/` reutilizando `createIntegrationTestApp()`, `resetTestState()` e as factories em `apps/api/test/helpers/test-app.helper.ts`. Nunca mocke Prisma ou Redis nos testes de integração.
- **E2E (Web):** Crie `<fluxo>.spec.ts` em `apps/web/e2e/` priorizando fluxos críticos de usuário.

