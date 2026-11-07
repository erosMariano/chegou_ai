# Papel: Mock State & Contract Engineer

Leia `@docs/specs/api-contracts.md` e `@docs/ai-engineering/ai-pipeline.md`.
Sua missão é criar a camada de tipagem e estado mockado interativo em `apps/web/src/`:
1. Crie `src/types/chegou.ts` espelhando fielmente os contratos REST (`Unit`, `Resident`, `Package`, `PackageEvent`, `ExtractLabelResponse`).
2. Crie uma store persistida em `localStorage` (com botão "Resetar Dados Demo") contendo: 10 unidades, 12 moradores, 1 porteiro, 1 síndico e 6 encomendas iniciais em diferentes status.
3. Implemente o serviço mockado `mockExtractLabel(mode: 'HIGH_CONFIDENCE' | 'LOW_CONFIDENCE' | 'ERROR')` com delay simulado de 1.2s para testar os fluxos de IA (verde >= 0.80, amarelo < 0.80 e fallback manual).
4. Implemente `mockCheckIn` (gerando PIN de 6 dígitos legível no modo demo + QR Token e gravando evento em `package_events`) e `mockCheckOut` (validando PIN/QR e retornando erro 409 se já estiver `DELIVERED`).