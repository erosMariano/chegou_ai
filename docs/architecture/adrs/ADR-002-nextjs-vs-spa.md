# ADR-002: Adoção de Next.js em vez de React Puro (SPA)

* **Status:** Aceito
* **Data:** Novembro/2026

## Contexto
O sistema atende dois perfis de uso distintos: operadores internos na portaria (uso contínuo) e moradores externos o app via App em conexões móveis (4G/5G) para visualizar seu QR Code de retirada.

## Decisão
Utilizar **Next.js (App Router)** em vez de um SPA puro (Vite + React).

## Justificativa & Trade-offs
1. **Proteção de Credenciais (Camada BFF):** As Route Handlers do Next.js permitem receber imagens da portaria e invocar o provedor de IA mantendo as `API_KEYS` estritamente no servidor, sem precisar expor chaves no cliente.
2. **Performance Mobile (SSR):** Quando o morador clica no push notification, o servidor entrega a página com o PIN/QR Code já renderizado, eliminando telas de carregamento em redes móveis instáveis na entrada do condomínio.
3. **Roteamento e Middlewares Nativos:** Facilita a separação de permissões entre rotas de Porteiro, Morador e Síndico.