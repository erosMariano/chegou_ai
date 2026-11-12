# Arquivo de Controle de Segurança (SECURITY_LOOP.md)

**Stack:** Next.js (front), NestJS (back), PostgreSQL, Redis.  
**Auditor:** AppSec Senior Engineer  
**Status Atual:** CONCLUÍDO (Iteração 10 — Convergência dupla confirmada: 2 iterações consecutivas sem achados Crítico/Alto/Médio)

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
| **SEC-014** | Crítico | `apps/api/src/modules/auth/auth.service.ts:284` | Exposição direta de `resetToken` e `resetUrl` na resposta HTTP de `forgotPassword` (Account Takeover + User Enumeration) | corrigido | `3fab85b` |
| **SEC-015** | Alto | `apps/api/src/modules/packages/packages.controller.ts:71` | Quebra de isolamento multi-unidade (IDOR/BOLA) em `GET /packages` para `RESIDENT` sem `unitId` vinculado | corrigido | `3d603c2` |
| **SEC-016** | Médio | `apps/api/src/modules/ai/ai.service.ts:93` | Fallback de OCR simulado ativável em produção via substring `"mock"` no payload base64 | corrigido | `d765347` |
| **SEC-017** | Baixo | `apps/api/src/modules/ai/dto/extract-label.dto.ts:8` | Ausência de allowlist de MIME types de imagem no DTO `ExtractLabelDto` | corrigido | `bc5a184` |
| **SEC-018** | Baixo | `apps/api/src/common/mail/mail.service.ts:83` | Interpolação direta de dados em templates HTML de e-mail sem escape contra HTML Injection | corrigido | `aab8707` |
| **SEC-019** | Médio | `apps/api/src/modules/residents/residents.service.ts:151` | Importação em lote e atualização de morador sem proteção estrita contra colisão/alteração de contas `ADMIN`/`PORTER` | corrigido | `c6bd633` |

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
- **Iteração 7 (Lente Ímpar: Injeção, Config & Infra pós-refactor):** 5 achados mapeados (`SEC-014` Crítico, `SEC-015` Alto, `SEC-016` Médio, `SEC-017` Baixo, `SEC-018` Baixo) e 100% corrigidos.
- **Iteração 8 (Lente Par: Fluxos de Negócio & Autorização):** 1 achado mapeado (`SEC-019` Médio) e corrigido.
- **Iteração 9 (Lente Ímpar: Injeção, Config & Infra):** 0 achados novos Crítico/Alto/Médio.
- **Iteração 10 (Lente Par: Fluxos de Negócio & Autorização):** 0 achados novos Crítico/Alto/Médio (Convergência dupla confirmada).
