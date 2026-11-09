# Papel: System Completeness & Self-Service Architect

Leia `@GEMINI.md`, `@docs/product/PRD.md`, `@docs/specs/api-contracts.md`, `@docs/specs/database-schema.md` e `@docs/design-references/STYLE_GUIDE.md`.

Sua missão é expandir a estrutura existente do projeto em `apps/web` e `apps/api`, implementando todas as rotas e funcionalidades faltantes para que o **Chegou.AI** seja um sistema autossuficiente — onde uma pessoa consiga operar o condomínio de ponta a ponta sem depender de popular o banco manualmente ou executar scripts de seed.

---

## 1. Estrutura do Projeto (FSD + Atomic Design + Ports & Adapters)

Mantenha e estenda a hierarquia existente, adicionando cirurgicamente os arquivos necessários:

```
apps/web/src/
├── app/
│   ├── admin/
│   │   ├── usuarios/page.tsx           # [FALTANTE] Gestão da equipe de portaria e admins
│   │   ├── configuracoes/page.tsx      # [FALTANTE] Perfil institucional e regras do condomínio
│   │   ├── unidades/page.tsx           # [EXISTE] + adicionar botão de Importação CSV
│   │   ├── moradores/page.tsx          # [EXISTE] + adicionar Convite de Acesso e Importação CSV
│   │   ├── enderecos/page.tsx          # [EXISTE] Endereços oficiais validados pela IA
│   │   └── page.tsx                    # [EXISTE] Dashboard com KPIs e Auditoria + Exportação CSV
│   ├── ativar-conta/page.tsx           # [FALTANTE] Primeiro acesso e definição de senha do morador
│   ├── esqueci-minha-senha/page.tsx    # [FALTANTE] Recuperação de senha
│   ├── redefinir-senha/page.tsx        # [FALTANTE] Redefinição com token temporário
│   ├── portaria/page.tsx               # [EXISTE] + ação de Devolver / Cancelar encomenda
│   ├── portaria/checkin/page.tsx       # [EXISTE] Check-in com IA e validação de endereço
│   ├── portaria/checkout/page.tsx      # [EXISTE] Baixa por PIN de 6 dígitos ou QR Code
│   ├── morador/page.tsx                # [EXISTE] + aba de Histórico de retiradas
│   └── login/page.tsx                  # [EXISTE] Login unificado com link para esqueci minha senha
├── widgets/
│   ├── users-manager/                  # [FALTANTE] Tabela e cards de operadores da portaria
│   ├── condo-settings/                 # [FALTANTE] Formulário de dados gerais do condomínio
│   ├── units-manager/                  # [EXISTE] Adicionar trigger para modal de importação CSV
│   ├── residents-manager/              # [EXISTE] Adicionar trigger de convite e importação CSV
│   ├── audit-log-table/                # [EXISTE] Adicionar botão de exportação de relatório CSV
│   └── package-table/                  # [EXISTE] Adicionar dropdown de ações (Cancelar / Reenviar)
├── features/
│   ├── manage-users/                   # [FALTANTE] Modal e form de criação/edição de operador
│   ├── batch-import/                   # [FALTANTE] Modal dropzone com preview de CSV e validação
│   ├── invite-resident/                # [FALTANTE] Ação de gerar e copiar link de ativação
│   ├── cancel-package/                 # [FALTANTE] Modal de devolução à transportadora / cancelamento
│   └── reset-password/                 # [FALTANTE] Fluxo de recuperação de senha
├── entities/
│   ├── user/                           # [EXPANDIR] Schemas Zod de operador e DTOs de listagem
│   ├── condominium/                    # [EXPANDIR] Schema do perfil institucional
│   ├── package/                        # [EXPANDIR] Schema de cancelamento e auditoria
│   ├── unit/ e resident/               # [EXPANDIR] Schemas de importação em lote
├── shared/
│   ├── ports/                          # [EXPANDIR] user-port.ts, condominium-port.ts, etc.
│   ├── adapters/
│   │   ├── http/                       # [EXPANDIR] http-user-adapter.ts, etc.
│   │   └── mock/                       # [EXPANDIR] mock-user-adapter.ts para paridade
│   └── ui/                             # Atoms shadcn estilizados com tokens Vault
```

No back-end NestJS (`apps/api/src/modules/`):
- `users/`: [NOVO MÓDULO] CRUD completo de operadores (`UsersController`, `UsersService`).
- `units/`: [EXPANDIR] Adicionar `POST /units/import-batch` e template CSV.
- `residents/`: [EXPANDIR] Adicionar `POST /residents/import-batch`, convite `POST /residents/:id/invite`.
- `auth/`: [EXPANDIR] Adicionar `POST /auth/activate`, `POST /auth/forgot-password`, `POST /auth/reset-password`.
- `condominium/`: [EXPANDIR] Adicionar `GET /condominium/profile` e `PUT /condominium/profile`.
- `packages/`: [EXPANDIR] Adicionar `PATCH /packages/:id/cancel` e `POST /packages/:id/resend-notification`.
- `audit/`: [EXPANDIR] Adicionar `GET /audit/export` (stream CSV).

---

## 2. Identidade Visual Vault (Conforme `@docs/design-references/STYLE_GUIDE.md`)

Aplique estritamente a linguagem visual corporativa em todas as novas interfaces:

1. **Paleta Neo-Fintech Minimalista:**
   - Canvas background: `#F4F4F3` / `#F6F7F9` (`bg-[#F4F4F3]`).
   - Chrome / Topbar / Sidebar: `#18181B` (`bg-zinc-900 text-white`).
   - Primary Accent: `#E1FF01` (`bg-[#E1FF01] text-zinc-950 font-bold`).
   - Cards Padrão: `bg-white border border-zinc-200/90 shadow-2xs`.
   - Card Hero Invertido: `bg-zinc-900 text-white shadow-sm` para a métrica de maior impacto.
2. **Geometria & Raios Proporcionais:**
   - Containers / Cards principais: `rounded-[24px]` (`rounded-3xl`).
   - Sub-seções / Modais internos: `rounded-2xl` (16px).
   - Inputs, selects e tags: `rounded-xl` (12px), altura `h-10` ou `h-11`.
   - Botões de ação primária e chips de busca: formato pílula `rounded-full`.
3. **Badges de Status:**
   - `RECEIVED`: `bg-amber-50 border-amber-200 text-amber-800`
   - `NOTIFIED`: `bg-zinc-100 border-zinc-200 text-zinc-800` com ponto neon `#E1FF01`
   - `DELIVERED`: `bg-emerald-50 border-emerald-200 text-emerald-700`
   - `NOTIFICATION_FAILED`: `bg-rose-50 border-rose-200 text-rose-700`
   - `CANCELLED`: `bg-zinc-100 border-zinc-200 text-zinc-500`

---

## 3. Especificação das Rotas e Funcionalidades Faltantes

### 3.1. Gestão de Operadores e Porteiros (`/admin/usuarios`)
- **Backend:**
  - `GET /api/v1/users`: Listar operadores com paginação, filtro de role (`PORTER` / `ADMIN`) e busca. Auth: `ADMIN`.
  - `POST /api/v1/users`: Cadastrar operador (Nome, E-mail, Senha temporária, Role). Valida unicidade e gera hash bcrypt. Auth: `ADMIN`.
  - `PUT /api/v1/users/:id`: Edição de dados e redefinição de senha. Auth: `ADMIN`.
  - `PATCH /api/v1/users/:id/toggle-status`: Inativar/reativar operador (revoga login sem perder auditoria). Auth: `ADMIN`.
  - `DELETE /api/v1/users/:id`: Bloqueia deleção física se houver pacotes registrados (aplica inativação). Auth: `ADMIN`.
- **Frontend:**
  - Rota `/admin/usuarios` com `AdminHeader`.
  - `UsersManagerWidget`: Tabela com status, badge de cargo, botão de alternar status e modal de cadastro com gerador de senha e cópia rápida de credenciais.

### 3.2. Carga em Lote de Unidades e Moradores (CSV)
- **Backend:**
  - `POST /api/v1/units/import-batch`: Carga em lote de unidades (`bloco,numero`) ignorando duplicatas. Auth: `ADMIN`.
  - `POST /api/v1/residents/import-batch`: Carga de moradores (`bloco,numero,nome,email,telefone,is_primary`) vinculando à unidade e normalizando telefone. Auth: `ADMIN`.
  - `GET /api/v1/units/template-csv` e `GET /api/v1/residents/template-csv`: Download de modelos CSV.
- **Frontend:**
  - Botão "Importar Planilha CSV" em `/admin/unidades` e `/admin/moradores`.
  - Modal com drag-and-drop, preview das primeiras 10 linhas e relatório pós-importação.

### 3.3. Convite & Primeiro Acesso do Morador
- **Backend:**
  - `POST /api/v1/residents/:id/invite`: Gera token no Redis (`resident_invite:<token>`, TTL 48h) com link de primeiro acesso. Auth: `ADMIN`.
  - `POST /api/v1/auth/activate`: Morador define sua senha; cria usuário na tabela `users` (`role: RESIDENT`, vincula `unitId`) e retorna sessão JWT.
- **Frontend:**
  - Rota pública `/ativar-conta?token=...`: Formulário limpo para criar a senha.
  - Botão "Copiar Convite" na linha de cada morador em `/admin/moradores`.

### 3.4. Recuperação de Senha Segura
- **Backend:**
  - `POST /api/v1/auth/forgot-password`: Gera token temporário no Redis (`password_reset:<token>`, TTL 15 min).
  - `POST /api/v1/auth/reset-password`: Valida token e atualiza hash da senha.
- **Frontend:**
  - Rota `/esqueci-minha-senha`: Solicita e-mail.
  - Rota `/redefinir-senha?token=...`: Define nova senha.

### 3.5. Configurações Institucionais do Condomínio
- **Backend:**
  - `GET /api/v1/condominium/profile`: Nome, CNPJ, telefone da portaria e regras gerais. Auth: `ADMIN`, `PORTER`, `RESIDENT`.
  - `PUT /api/v1/condominium/profile`: Atualização cadastral. Auth: `ADMIN`.
- **Frontend:**
  - Rota `/admin/configuracoes`: Painel com dados institucionais do condomínio.

### 3.6. Exceções de Encomendas & Histórico
- **Backend:**
  - `PATCH /api/v1/packages/:id/cancel`: Devolução à transportadora ou cancelamento por engano. Registra evento em `package_events` e invalida PIN/QR. Auth: `PORTER`, `ADMIN`.
  - `POST /api/v1/packages/:id/resend-notification`: Reenfilera Push Notification no RabbitMQ. Auth: `PORTER`, `ADMIN`.
- **Frontend:**
  - Ação "Cancelar / Devolver" na tabela da portaria (`/portaria`).
  - Aba "Histórico" de pacotes entregues no Portal do Morador (`/morador`).

### 3.7. Exportação de Relatórios de Auditoria
- **Backend:**
  - `GET /api/v1/audit/export`: Gera arquivo CSV dos eventos de custódia e encomendas por período. Auth: `ADMIN`.
- **Frontend:**
  - Botão em formato Pill "Exportar Relatório CSV" no painel `/admin`.

---

## 4. Critérios de Aceite Padronizados (BDD / SDD)

1. **Gestão Autônoma de Portaria:**
   - **Dado** o síndico logado em `/admin/usuarios`,
   - **Quando** cadastrar um novo porteiro com e-mail e senha,
   - **Então** o porteiro deve conseguir logar imediatamente em `/login` e operar `/portaria` sem nenhuma edição manual no banco.
2. **Carga em Lote Segura:**
   - **Dado** um arquivo CSV com dezenas de apartamentos,
   - **Quando** submetido em `/admin/unidades`,
   - **Então** o processamento deve inserir as novas unidades, ignorar duplicadas e exibir resumo em modal.
3. **Ativação pelo Próprio Morador:**
   - **Dado** um morador cadastrado pelo síndico,
   - **Quando** abrir o link de convite em `/ativar-conta?token=...` e definir sua senha,
   - **Então** sua conta de usuário deve ser criada com `role: RESIDENT` e ele deve acessar `/morador` visualizando seus pacotes.
4. **Fidelidade Visual Vault:**
   - **Todas as novas telas** devem respeitar a paleta de cores (`#F4F4F3`, `#18181B`, `#E1FF01`), raios de curvatura de 24px/16px/12px e botões pílula do Style Guide.

---

## 5. Validação com Playwright

Após a implementação de cada funcionalidade, valide visualmente a renderização e o comportamento nos dois viewports oficiais:
- **Desktop:** `1280x800`
- **Mobile (PWA Portaria e Morador):** `390x844`
