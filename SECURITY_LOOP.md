# Arquivo de Controle de Segurança (SECURITY_LOOP.md)

**Stack:** Next.js (front), NestJS (back), PostgreSQL, Redis.  
**Auditor:** AppSec Senior Engineer  
**Status Atual:** CONCLUÍDO (Convergência com 2 iterações consecutivas sem achados críticos pendentes)

---

## 1. Tabela Consolidada de Achados

| ID | Severidade | Arquivo:Linha | Descrição | Status | Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | Crítico | `apps/api/src/modules/auth/auth.service.ts:227` | Reset de senha sem validação do token (Broken Auth / Account Takeover) | corrigido | `48b1218` |
| **SEC-002** | Alto | `apps/api/src/modules/units/units.controller.ts:22` | Rota `:id` interceptando rota estática `template-csv` com erro 400 UUID | corrigido | `a596305` |
| **SEC-003** | Médio | `apps/api/src/main.ts:34` | CORS Regex excessivamente permissivo na Vercel (`chegou-ai.*.vercel.app`) | corrigido | `d574b8b` |
| **SEC-004** | Médio | `apps/api/src/modules/audit/audit.service.ts:118` | CSV Injection / Formula Injection na exportação de auditoria | corrigido | `9f9bceb` |
| **SEC-005** | Médio | `apps/api/src/modules/auth/auth.controller.ts:39` | Falta de DTO com validação estrita em rotas de auth e perfil | corrigido | `1f8d6cd` |
| **SEC-006** | Baixo | `.env.example:30` | Segredo pré-preenchido em arquivo de exemplo | corrigido | `1c34dec` |
| **SEC-007** | Crítico | `apps/api/src/modules/auth/auth.service.ts:173` | Ativação de conta sem validação do token de convite e sobrescrita de senha | corrigido | `f9a6f40` |
| **SEC-008** | Médio | `apps/api/src/modules/packages/packages.service.ts:159` | Invalidação estrita de PIN e QR passes após cancelamento/devolução | corrigido | `3b15dce` |
| **SEC-009** | Médio | `apps/api/Dockerfile:16` | Containers Docker executando com usuário root em estágio runner | corrigido | `2ff0a5f` |
| **SEC-010** | Baixo | `docker-compose.prod.yml:8` | Senhas padrão com fallback fraco em compose de produção | corrigido | `a38f034` |
| **SEC-011** | Médio | `apps/api/src/modules/auth/auth.service.ts:333` | Race condition (TOCTOU) no setup do 1º administrador inicial | corrigido | `pendente-commit` |
| **SEC-012** | Baixo | `apps/api/src/main.ts:80` | Exposição irrestrita do Swagger UI em produção sem flag de controle | corrigido | `pendente-commit` |
| **SEC-013** | Baixo | `apps/api/src/modules/auth/dto/auth-requests.dto.ts:45` | Ausência de `@IsOptional()` e `@MaxLength()` em DTO de setup inicial | corrigido | `pendente-commit` |

---

## 2. Falsos Positivos e Riscos Aceitos

- **FP-001:** `npm audit` acusa `zod can exhaust memory while validating...` — Zod é utilizado para parsing de schemas conhecidos e sanitizados de API interna e formulários controlados, não para regex arbitrária de usuário final sem limite. Risco aceito na versão atual de dependências.
- **FP-002:** `npm audit` acusa `@angular-devkit/schematics` / `glob` no `@nestjs/cli` — Trata-se de dependência de build/desenvolvimento (`devDependencies`), não incluída no runtime de produção do container NestJS.
- **FP-003:** `npm audit` sugere atualização para NestJS v12 (`breaking change`) para pacotes do ecossistema NestJS (body-parser/multer). Mantido NestJS v10 com validação por Pipes e Helmet hardening ativo.

---

## 3. Histórico por Iteração

- **Iteração 0 (Baseline):** Builds OK (`apps/api` e `apps/web`), npm audit executado.
- **Iteração 1 (Injeção, Config & Infra):** 6 achados mapeados (1 Crítico, 1 Alto, 3 Médio, 1 Baixo) e 100% corrigidos.
- **Iteração 2 (Fluxos de Negócio & Autorização):** 2 achados mapeados (1 Crítico, 1 Médio) e 100% corrigidos.
- **Iteração 3 (Infraestrutura & Containers):** 2 achados mapeados (1 Médio, 1 Baixo) e 100% corrigidos.
- **Iteração 4 (Lente Par: Negócio & Autorização):** 0 achados novos.
- **Iteração 5 (Lente Ímpar: Injeção & Infra):** 0 achados novos (Convergência confirmada).
- **Iteração 6 (Auditoria das Novas Rotas & Swagger):** 3 achados mapeados (1 Médio, 2 Baixo) e 100% mitigados com Distributed Lock no Redis, controle de ambiente no Swagger e validação estrita em DTOs.
