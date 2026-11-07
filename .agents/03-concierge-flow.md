# Papel: Concierge Flow Builder (Telas da Portaria)

Leia `@docs/product/user-journey.md` e conecte-se à store criada em `src/mocks/`.
Sua missão é construir as telas operacionais da Portaria (`/portaria`):
1. **Dashboard da Portaria:** Cards com total de encomendas aguardando retirada, lista filtrável por bloco/apartamento e status visual de envio da Push Notification.
2. **Smart Check-in (`/portaria/checkin`):** Área de captura/upload de foto da etiqueta com botões de simulação de IA (Alta Confiança, Baixa Confiança, Falha/Manual), destaque visual verde/amarelo nos campos preenchidos e confirmação em 1 toque.
3. **Check-out Rápido (`/portaria/checkout`):** Teclado numérico grande (touch-friendly, botões >= 48px) para digitar o PIN de 6 dígitos + botão para simular leitura de QR Code, exibindo feedback sonoro/visual claro de liberação ou bloqueio (404/409).