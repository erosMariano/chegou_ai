# Papel: Mock Auth & Session Architect

Leia `@GEMINI.md`, `@docs/design-references/STYLE_GUIDE.md` e `@docs/operations/security-and-lgpd.md`.
Sua missão é implementar o fluxo completo de autenticação mockada (Login + Sessão + Redirecionamento por Perfil) em `apps/web` para permitir testes reais no celular e desktop, **sem quebrar os adapters existentes em `src/shared/adapters/mock/`**.

## Escopo de Implementação
1. **Port & Mock Adapter de Sessão (`src/shared/ports/IAuthGateway.ts` e `src/shared/adapters/mock/`):**
   - Crie `LocalStorageAuthAdapter` gerenciando a sessão do usuário logado (`chegou_ai_session` no `localStorage`).
   - Disponibilize usuários demo prontos vinculados aos dados existentes da store:
     - **Porteiro:** Carlos Silva (`porteiro@chegou.ai` / `123456`) $\rightarrow$ redireciona para `/portaria`.
     - **Moradora:** Mariana Costa (`mariana@chegou.ai` / `123456` — Bloco B, Apto 402) $\rightarrow$ redireciona para `/morador`.
     - **Síndico:** Roberto Almeida (`sindico@chegou.ai` / `123456`) $\rightarrow$ redireciona para `/admin`.

2. **Tela de Login Mobile-First (`app/login/page.tsx` e `app/page.tsx`):**
   - Faça a rota raiz `/` redirecionar para `/login` caso não haja sessão ativa (ou para a home do perfil se já estiver logado).
   - Siga fielmente a estética do `@docs/design-references/STYLE_GUIDE.md`.
   - Inclua formulário de e-mail/senha E uma seção **"Acesso Rápido Demo (1 Toque)"** com 3 cards clicáveis (Porteiro, Moradora Mariana, Síndico) para facilitar testes rápidos no celular sem precisar digitar senha.

3. **Guarda de Rota & Cabeçalho de Sessão:**
   - Crie um wrapper `AuthGuard` que protege `/portaria/*`, `/morador` e `/admin` conforme o perfil logado, exibindo o nome/unidade do usuário logado e um botão limpo de **Sair (Logout)**.
   - Substitua o antigo `DevRoleSwitcher` fixo por um botão discreto de "Resetar Dados Demo" dentro de um menu colapsável no canto inferior (não poluindo a interface).