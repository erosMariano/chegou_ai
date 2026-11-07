# Contexto e Regras de Engenharia — Chegou.AI

Você está atuando como Engenheiro de Software Sênior no desenvolvimento do **Chegou.AI**, um sistema inteligente de gestão e aviso de encomendas para condomínios.

## Fonte da Verdade (Documentação & SDD)
Antes de criar arquivos, tabelas, endpoints ou componentes, consulte obrigatoriamente a documentação na pasta `docs/`:
- **Produto e Fluxos:** `docs/product/PRD.md` e `docs/product/user-journey.md`
- **Arquitetura C4 e Estados:** `docs/architecture/architecture-diagrams.md`
- **Decisões Arquiteturais (ADRs):** `docs/architecture/adrs/ADR-001` a `ADR-005`
- **Banco de Dados e APIs:** `docs/specs/database-schema.md` e `docs/specs/api-contracts.md`
- **Engenharia de IA:** `docs/ai-engineering/ai-pipeline.md`
- **Segurança e FinOps:** `docs/operations/security-and-lgpd.md` e `docs/operations/finops-and-slas.md`

## Stack Definida (100% TypeScript)
- **Front-end / BFF (`apps/web`):** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui + Magic UI, Zod, `lucide-react`, `qrcode.react` (PWA + Service Worker para Web Push API / VAPID).
- **Back-end Core (`apps/api`):** NestJS (TypeScript), Prisma ORM, validação com Zod/class-validator, Guards para RBAC (`PORTER`, `RESIDENT`, `ADMIN`).
- **Infraestrutura & Mensageria:** PostgreSQL 16+, Redis e RabbitMQ (com Dead Letter Queue para workers de Push Notification via `web-push`).
- **IA / Visão Computacional:** Extração zero-shot de etiquetas via Gemini 2.5 Flash com JSON Schema estrito (`confidenceScore >= 0.80` e fallback manual).

## Arquitetura de Código Front-end (`apps/web/src/`)
Siga estritamente a combinação **SDD + Feature-Sliced Design (FSD) + Atomic Design + Ports & Adapters**:
1. **Hierarquia FSD (importações estritamente de cima para baixo):**
   - `app/`: Rotas Next.js (App Router) — apenas composição fina de layouts e widgets.
   - `widgets/`: Blocos completos de tela (ex.: `ConciergeHeader`, `AuditLogTableWidget`).
   - `features/`: Ações e fluxos do usuário (ex.: `scan-label`, `pin-checkout`, `push-subscription`).
   - `entities/`: Modelos de domínio, regras puras e schemas Zod (ex.: `package`, `unit`, `resident`).
   - `shared/`: Base reutilizável sem regra de negócio (`ui/` para Atoms do shadcn/ui, `components/` para Molecules, `ports/` e `adapters/`).
2. **SDD (Single Source of Truth com Zod):** Todo contrato de API (`docs/specs/api-contracts.md`) nasce como um Schema Zod em `entities/*/model/schema.ts`, gerando automaticamente os tipos TypeScript (`z.infer`) e validações de formulário.
3. **Ports & Adapters:** Componentes e features nunca acessam `localStorage` ou `fetch` diretamente. Consomem interfaces definidas em `shared/ports/` com implementações intercambiáveis em `shared/adapters/mock/` (fase atual) e `shared/adapters/http/` (integração futura com NestJS).
4. **SOLID & Clean Code:** Hooks customizados isolam efeitos colaterais e máquinas de estado (`Discriminated Unions`), mantendo arquivos `.tsx` limpos e declarativos.

## Padrões Obrigatórios de Segurança & Negócio
1. **Segurança:** Nunca expor `GEMINI_API_KEY` ou `VAPID_PRIVATE_KEY` no cliente. Toda chamada de IA passa pelo BFF do Next.js.
2. **Privacidade (LGPD):** Nunca salvar fotos das etiquetas em disco/storage; processar apenas em memória e descartar. Armazenar apenas o hash criptográfico do PIN (`pickup_pin_hash`).
3. **Máquina de Estados & Auditoria:** Respeitar estritamente as transições (`RECEIVED` -> `NOTIFIED` -> `DELIVERED` / `CANCELLED`) e registrar toda mudança de estado na tabela append-only `package_events`.