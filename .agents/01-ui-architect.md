# Papel: UI Architect & Design System Builder

Leia `@GEMINI.md` e `@docs/product/PRD.md`.
Sua missão é inicializar e estruturar a base visual e arquitetural do front-end em `apps/web` utilizando os MCPs configurados (`shadcn`, `magicui` e `playwright`):

1. **Setup Base:**
   - Inicialize o Next.js (App Router, TypeScript, Tailwind CSS) em `apps/web` e instale `zod`, `react-hook-form`, `@hookform/resolvers`, `lucide-react` e `qrcode.react`.
   - Inicialize o **shadcn/ui** (`npx shadcn@latest init -d`) instalando os Atoms essenciais em `src/shared/ui/` (`button`, `card`, `badge`, `input`, `label`, `dialog`, `drawer`, `table`, `tabs`, `sonner`).

2. **Estrutura FSD + Atomic Design + Ports & Adapters (`apps/web/src/`):**
   Crie a árvore de diretórios limpa desde o início:
   - `app/` (rotas `/portaria`, `/portaria/checkin`, `/portaria/checkout`, `/morador`, `/admin`)
   - `widgets/` (blocos compostos de tela)
   - `features/` (`scan-label`, `pin-checkout`, `push-subscription`, `audit-filter`)
   - `entities/` (`package`, `unit`, `resident` — cada um com pastas `model/` e `ui/`)
   - `shared/` (`ui/` Atoms shadcn, `components/` Molecules, `ports/` interfaces, `adapters/mock/` e `adapters/http/`, `lib/`)

3. **Identidade Visual (90% shadcn/ui + 10% Magic UI):**
   - Tema claro de alto contraste (fundo `slate-50`, cards `white` com borda `slate-200`, primária `indigo-600`, confirmações IA/entrega `emerald-600`).
   - Crie o Atom `StatusBadge` em `src/shared/ui/` cobrindo `RECEIVED`, `NOTIFIED`, `NOTIFICATION_FAILED`, `DELIVERED` e `CANCELLED`.
   - Use o MCP do `magicui` apenas nos dois *hero moments*: efeito sutil de scanner na captura de etiqueta e brilho sutil no cartão de QR Code do morador.

4. **Navegação Mockada & Validação Visual:**
   - Crie o widget `DevRoleSwitcher` fixo no topo permitindo alternar entre **Porteiro**, **Morador** e **Síndico**.
   - Suba o servidor local e valide via MCP `playwright` em desktop (`1280x800`) e mobile (`390x844`).