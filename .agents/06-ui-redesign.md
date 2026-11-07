# Papel: Senior UI/UX Designer & Design System Refactorer

Leia `@GEMINI.md` e `@docs/design-references/STYLE_GUIDE.md`.
Sua missão é refatorar exclusivamente a camada visual de `apps/web` (`globals.css`, `shared/ui/`, `widgets/` e `app/`) para atingir a estética exata do `STYLE_GUIDE.md`, **mantendo 100% intactos os schemas Zod (`entities/*/model/`) e os adapters (`shared/adapters/mock/`)**.

## Regras de Isolamento de Mock na UI (Fácil Remoção Futura)
1. **Centralização em `src/shared/dev-tools/`:** Todo componente visual exclusivo de teste/mock (como botões de simular cenários de IA `Alta/Baixa Confiança/Erro`, atalhos de login rápido 1-toque, botão `Resetar Dados Demo` e leitura automática de QR Code simulada) DEVE ser isolado dentro de `src/shared/dev-tools/` (ex.: `DevToolsDrawer.tsx`, `MockAiScenarioBar.tsx`, `DemoQuickLoginCards.tsx`).
2. **Feature Flag de Ambiente:** Renderize esses componentes exclusivamente atrás da verificação `process.env.NEXT_PUBLIC_ENABLE_MOCK_UI === 'true'` (ou um helper `isMockUiEnabled()`). Nunca espalhe botões de teste diretamente dentro do JSX das telas de produção (`app/` ou `features/`).
3. **Visual Discreto na Tela:** Agrupe os controles de simulação em um único botão flutuante discreto no canto inferior (`Mock Tools`) ou em um slot dedicado claramente identificado, deixando 100% da interface principal com aparência de produto final em produção.

## Regras de Refactor Visual
1. **Tokens Globais (`globals.css`):** Aplique a paleta, tipografia, sombras e `--radius` exatos do `STYLE_GUIDE.md`.
2. **Elimine Redundâncias e "Cara de Formulário Cru":**
   - Remova inputs empilhados sem hierarquia. Use Steppers visuais, seleção rápida de unidade por pills/chips e cards de resumo editáveis.
   - Substitua listas extensas por cards limpos, Drawers/Sheets laterais e estados vazios (*Empty States*) bem ilustrados.
3. **Refatore Tela por Tela:**
   - **Login (`/login`):** Card centralizado limpo com a identidade visual do Chegou.AI (isolando os cards de login rápido 1-toque via `DemoQuickLoginCards`).
   - **Portaria (`/portaria`, `/checkin`, `/checkout`):** Bento Grid para KPIs no topo, dropzone de câmera estilizada com efeito sutil de scanner (`magicui`) e teclado numérico grande (`>= 48px`) com feedback visual imediato no check-out.
   - **Morador (`/morador`):** Transforme cada encomenda pendente em um **Passe Digital (estilo Apple Wallet)** com QR Code centralizado, PIN espaçado (`482 • 910`) e banner limpo para ativar Push Notifications.
   - **Síndico (`/admin`):** Tabela limpa com dados LGPD mascarados e timeline visual para a trilha de auditoria (`package_events`).
4. **Validação Visual com Playwright:** Suba o app e inspecione `/login`, `/portaria`, `/portaria/checkin`, `/morador` e `/admin` no MCP `playwright` em viewport mobile (`390x844`) e desktop (`1280x800`), corrigindo qualquer corte ou desalinhamento.