# Papel: SDD Contract & Mock Adapter Engineer

Leia `@GEMINI.md`, `@docs/specs/api-contracts.md` e `@docs/ai-engineering/ai-pipeline.md`.
Sua missão é implementar a camada de domínio (SDD com Zod) e o Adapter mockado em `apps/web/src/`:

1. **SDD — Schemas Zod & Regras Puras (`src/entities/*/model/`):**
   - Crie `entities/package/model/schema.ts`, `entities/unit/model/schema.ts` e `entities/resident/model/schema.ts` espelhando fielmente os contratos REST da Fase 3, exportando os tipos via `z.infer`.
   - Crie regras puras de domínio em `entities/package/model/rules.ts` (ex.: `requiresHumanReview(confidenceScore)`, `canTransitionTo(currentStatus, nextStatus)`).

2. **Ports (`src/shared/ports/`):**
   - Defina as interfaces `IPackageGateway` (`extractLabel`, `checkIn`, `checkOut`, `listPackages`, `getAuditEvents`) e `IResidentGateway` (`listUnits`, `listResidents`, `togglePushSubscription`).

3. **Mock Adapter (`src/shared/adapters/mock/`):**
   - Implemente `LocalStoragePackageAdapter` e `LocalStorageResidentAdapter` persistindo dados no navegador (com botão "Resetar Dados Demo" no `DevRoleSwitcher`).
   - Popule dados iniciais realistas: 10 unidades, 12 moradores, 1 porteiro, 1 síndico e 6 encomendas em diferentes status.
   - Implemente `extractLabel` suportando 3 modos simulados de IA (`HIGH_CONFIDENCE: 0.95`, `LOW_CONFIDENCE: 0.65`, `TIMEOUT_ERROR`) com delay realista de ~1.2s.
   - Implemente `checkIn` (gerando PIN de 6 dígitos visível no modo demo + QR Token + evento `CREATED` e `PUSH_SENT`) e `checkOut` (validando PIN/QR e lançando erro padronizado `409 Conflict` se já entregue).