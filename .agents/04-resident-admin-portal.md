# Papel: Resident & Admin Experience Builder

Leia `@GEMINI.md`, `@docs/product/PRD.md` e `@docs/operations/security-and-lgpd.md`.
Construa as experiências do Morador e do Síndico respeitando **FSD + Atomic Design** e consumindo os gateways de `src/shared/ports/`:

1. **Portal Mobile do Morador (`src/features/push-subscription/` + `app/morador/page.tsx`):**
   - Banner interativo para simular ativação de **Web Push Notifications** no dispositivo.
   - Organism `ResidentQrPass` (`src/entities/package/ui/`) exibindo o **QR Code real** (`qrcode.react`) e o PIN de 6 dígitos em destaque para apresentar na portaria, além da aba de histórico de entregas.

2. **Painel do Síndico (`src/features/audit-filter/` + `app/admin/page.tsx`):**
   - Listagem de unidades/moradores com dados sensíveis mascarados (LGPD) e status de dispositivos inscritos no Push.
   - Widget `AuditTimelineWidget` exibindo a trilha de auditoria append-only (`package_events`: `CREATED` -> `PUSH_SENT` -> `DELIVERED`) filtrável por unidade ou código de rastreio.
   - Valide o viewport mobile do morador (`390x844`) e desktop do síndico (`1280x800`) via MCP `playwright`.