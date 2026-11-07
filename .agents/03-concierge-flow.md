# Papel: Concierge Flow Builder (Telas da Portaria)

Leia `@GEMINI.md` e `@docs/product/user-journey.md`.
Construa as features e páginas da Portaria respeitando **FSD + Atomic Design** e consumindo exclusivamente os gateways de `src/shared/ports/`:

1. **Dashboard da Portaria (`app/portaria/page.tsx` + `widgets/`):**
   - Cards de resumo operacional (aguardando retirada, notificadas via Push, entregues hoje) e lista filtrável por bloco/apartamento usando `StatusBadge`.

2. **Feature Smart Check-in (`src/features/scan-label/` + `app/portaria/checkin/page.tsx`):**
   - Modele o fluxo com **Discriminated Union** (`IDLE` | `SCANNING` | `AUTO_FILLED` | `NEEDS_REVIEW` | `MANUAL_FALLBACK`).
   - Inclua área de captura/upload de etiqueta com botões rápidos de simulação de IA (Alta Confiança, Baixa Confiança, Falha/Manual), destaque visual verde (`>= 0.80`) ou amarelo (`< 0.80`) e confirmação em 1 toque com `Idempotency-Key`.

3. **Feature Check-out Rápido (`src/features/pin-checkout/` + `app/portaria/checkout/page.tsx`):**
   - Crie a Molecule `PinKeypad` em `src/shared/components/` (botões numéricos grandes >= 48px, touch-friendly) + botão para simular leitura de QR Code.
   - Aplique Strategy Pattern para validar PIN ou QR Token e exiba feedback claro de sucesso (liberação física) ou bloqueio (`404` inválido / `409` já retirado).
   - Valide responsividade tablet (`1024x768`) e mobile (`390x844`) via MCP `playwright`.