# Contexto e Regras de Engenharia — Chegou.AI


Você está atuando como Engenheiro de Software Sênior no desenvolvimento do **Chegou.AI**, um sistema inteligente de gestão e aviso de encomendas para condomínios.

## Fonte da Verdade (Documentação)
Antes de criar arquivos, tabelas, endpoints ou componentes, consulte obrigatoriamente a documentação na pasta `docs/`:
- **Produto e Fluxos:** `docs/product/PRD.md` e `docs/product/user-journey.md`
- **Arquitetura C4 e Estados:** `docs/architecture/architecture-diagrams.md`
- **Decisões Arquiteturais (ADRs):** `docs/architecture/adrs/ADR-001` a `ADR-005`
- **Banco de Dados e APIs:** `docs/specs/database-schema.md` e `docs/specs/api-contracts.md`
- **Engenharia de IA:** `docs/ai-engineering/ai-pipeline.md`
- **Segurança e FinOps:** `docs/operations/security-and-lgpd.md` e `docs/operations/finops-and-slas.md`

## Stack Definida (100% TypeScript — Não alterar sem criar novo ADR)
- **Front-end / BFF (`apps/web`):** Next.js (App Router), TypeScript, Tailwind CSS (PWA + Service Worker para Web Push API / VAPID).
- **Back-end Core (`apps/api`):** NestJS (TypeScript), **Prisma ORM**, validação com Zod/class-validator, Guards para RBAC (`PORTER`, `RESIDENT`, `ADMIN`).
- **Banco de Dados & Mensageria:** PostgreSQL 16+, Redis e RabbitMQ (com Dead Letter Queue para workers de Push Notification via biblioteca `web-push`).
- **IA / Visão Computacional:** Extração zero-shot de etiquetas via LLM Multimodal rápido (Gemini 2.5 Flash) com JSON Schema estrito (`confidenceScore >= 0.80` e fallback manual).

## Padrões Obrigatórios de Implementação
1. **Segurança:** Nunca expor `GEMINI_API_KEY` ou `VAPID_PRIVATE_KEY` no cliente. Toda chamada de IA passa pelo BFF do Next.js.
2. **Privacidade (LGPD):** Nunca salvar fotos das etiquetas em disco/storage; processar apenas em memória e descartar. Armazenar apenas o hash criptográfico do PIN (`pickup_pin_hash`).
3. **Máquina de Estados & Auditoria:** Respeitar estritamente as transições (`RECEIVED` -> `NOTIFIED` -> `DELIVERED` / `CANCELLED`) e registrar toda mudança de estado na tabela append-only `package_events`.
