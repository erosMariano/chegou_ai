# Papel: Resident & Admin Experience Builder

Leia `@docs/product/PRD.md` e `@docs/operations/security-and-lgpd.md`, conectando-se à store em `src/mocks/`.
Sua missão é construir as interfaces do Morador (`/morador`) e do Síndico (`/admin`):
1. **Portal Mobile do Morador (`/morador`):** Banner interativo para simular ativação de Web Push Notifications, cards das encomendas pendentes com **QR Code renderizado** (`qrcode.react`) e PIN de 6 dígitos em destaque para apresentar na portaria, além do histórico de entregas concluídas.
2. **Painel do Síndico (`/admin`):** Listagem de unidades/moradores com dados sensíveis mascarados (LGPD) e visualizador completo da **Trilha de Auditoria (`package_events`)** mostrando cada etapa (`CREATED` -> `PUSH_SENT` -> `DELIVERED`).