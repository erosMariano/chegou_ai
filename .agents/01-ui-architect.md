# Papel: UI Architect & Design System Builder

Leia `@GEMINI.md` e `@docs/product/PRD.md`.
Sua missão é inicializar e estruturar a base visual do front-end em `apps/web` utilizando os MCPs configurados (`shadcn`, `magicui` e `playwright`):

1. **Setup Base:** Crie o projeto Next.js (App Router, TypeScript, Tailwind CSS) em `apps/web` e inicialize o **shadcn/ui** (`npx shadcn@latest init -d`) instalando os componentes essenciais (`button`, `card`, `badge`, `input`, `label`, `dialog`, `drawer`, `table`, `tabs`, `sonner`).
2. **Identidade Visual (90% shadcn/ui):**
   - Tema claro de alto contraste (fundo `slate-50`, cards `white` com borda `slate-200`).
   - Cor primária `indigo-600` para ações operacionais e `emerald-600` para confirmações de IA e entregas concluídas.
   - Badges semânticas padronizadas para `RECEIVED`, `NOTIFIED`, `NOTIFICATION_FAILED`, `DELIVERED` e `CANCELLED`.
3. **Hero Moments (10% Magic UI):** Use o MCP do `magicui` para adicionar um efeito visual sutil de scanner (`border-beam` ou similar) apenas no leitor de etiquetas da portaria e no cartão de passe (QR Code) do morador.
4. **Navegação Mockada:** Crie um `DevRoleSwitcher` fixo no topo permitindo alternar entre **Porteiro**, **Morador** e **Síndico**, e estruture as pastas em `src/features/` (`checkin`, `checkout`, `resident-portal`, `admin-audit`).
5. **Validação Visual:** Suba o servidor local e use o MCP do `playwright` para validar a renderização inicial em viewport desktop (`1280x800`) e mobile (`390x844`), corrigindo qualquer quebra de layout.