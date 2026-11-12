Você é um engenheiro de qualidade sênior. Sua missão é tirar este monorepo do estado "sem testes" e entregar uma suíte confiável que proteja os fluxos críticos de negócio e segurança.

## Contexto do problema

Nem `apps/api/package.json` nem `apps/web/package.json` possuem script `test` ou suíte automatizada. Os fluxos críticos sem cobertura são:

1. Baixa concorrente com Optimistic Locking
2. Idempotência no check-in
3. RBAC / IDOR
4. Reset de senha

## Etapa 0: Descoberta (obrigatória, antes de escrever qualquer teste)

Não assuma a stack. Inspecione e registre o que encontrar:

- Gerenciador de pacotes e estrutura do monorepo (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`, lockfile)
- Framework da API (NestJS, Express, Fastify...), ORM (Prisma, TypeORM, Drizzle...) e banco (Postgres, MySQL...)
- Como o Optimistic Locking é implementado (coluna `version`, `updatedAt`, `@VersionColumn`, `where: { version }`)
- Como a idempotência do check-in funciona (header `Idempotency-Key`, chave única no banco, estado do registro)
- Modelo de autenticação e autorização (JWT, sessão, guards, middlewares, roles/permissões)
- Fluxo de reset de senha (geração de token, expiração, envio de e-mail, consumo do token)
- Framework do web (Next.js, Vite/React...) e rotas principais

Se algo não estiver claro, leia o código. Pergunte ao usuário somente se for impossível inferir.

## Etapa 1: Infraestrutura de testes

**API (`apps/api`)**
- Runner: Vitest ou Jest (siga o que melhor combina com o stack; prefira Vitest em projetos ESM/TS modernos)
- HTTP: Supertest (ou o utilitário de teste do framework, como `@nestjs/testing`)
- Banco: banco real e isolado para integração (Testcontainers ou Postgres via docker-compose de teste). Não use mocks de ORM para testar concorrência ou locking, pois o comportamento só aparece no banco real.
- Separação: `*.spec.ts` para unitários, `*.int-spec.ts` (ou pasta `test/integration`) para integração
- Scripts em `package.json`: `test`, `test:unit`, `test:integration`, `test:cov`
- Setup/teardown: migrar o schema antes da suíte, limpar tabelas entre testes, factories/fixtures para usuários, papéis e entidades

**Web (`apps/web`)**
- Unitário/componentes: Vitest + Testing Library
- E2E: Playwright, com `webServer` configurado e a API de teste rodando
- Scripts: `test`, `test:e2e`

**Raiz do monorepo**
- Script `test` que orquestra todos os pacotes (turbo/pnpm `-r`/nx, conforme o que já existir)
- Cobertura com relatório e limiar mínimo inicial realista (ex.: 60% global, 80% nos módulos críticos), aumentando depois
- Workflow de CI (ex.: `.github/workflows/test.yml`) rodando unit, integração e E2E

## Etapa 2: Suíte dos fluxos críticos

### 1. Baixa concorrente com Optimistic Locking
- Dispare N requisições simultâneas (`Promise.all`) de baixa sobre o mesmo recurso/versão.
- Asserções: exatamente as operações permitidas pelo saldo são bem-sucedidas, as demais falham com o erro de conflito esperado (ex.: 409), o saldo final nunca fica negativo e a soma das baixas confere com o estado final.
- Cenário de versão obsoleta: ler a versão, outra transação altera, a primeira tentativa de escrita deve ser rejeitada.
- Repita o teste de concorrência várias vezes (ex.: 20 iterações) para detectar flakiness real.
- Se houver retry automático, teste que ele respeita o limite e não duplica efeitos.

### 2. Idempotência no check-in
- Mesma chave/requisição enviada 2x em sequência: um único efeito colateral, mesma resposta lógica.
- Mesma chave enviada em paralelo (corrida): apenas um registro criado.
- Chaves diferentes para o mesmo usuário/evento: comportamento conforme a regra de negócio (permitir ou bloquear).
- Reenvio após falha parcial: o sistema se recupera sem duplicar.
- Verifique no banco a contagem de registros, não só o status HTTP.

### 3. RBAC / IDOR
- Matriz de permissões: para cada endpoint sensível, testar cada papel (anônimo, usuário comum, papel intermediário, admin) e validar 401/403/200 esperados. Gere a matriz de forma parametrizada (`it.each`).
- IDOR: o usuário A tenta ler, alterar e excluir recursos do usuário B (ou de outro tenant/organização) trocando IDs na URL e no corpo. Esperado: 403 ou 404, e nenhum dado vazado na resposta.
- Escalada de privilégio: tentar alterar o próprio papel via payload (mass assignment).
- Token expirado, malformado e de usuário desativado devem ser rejeitados.
- Listagens devem retornar apenas dados do escopo do usuário.

### 4. Reset de senha
- Caminho feliz: solicitar, receber token (capture o e-mail com mock/mailbox de teste), redefinir, logar com a nova senha.
- Token de uso único: segunda utilização falha.
- Token expirado e token inválido/adulterado falham.
- Não enumeração de usuários: resposta idêntica (corpo e status) para e-mail existente e inexistente.
- Após o reset, sessões/tokens antigos são invalidados (se a regra existir).
- Política de senha aplicada e rate limit no endpoint de solicitação (se implementado).
- Token armazenado com hash no banco, nunca em texto puro (verificar diretamente).

### E2E (Playwright, poucos e valiosos)
- Login + RBAC na interface (menu/rotas protegidas por papel)
- Fluxo completo de reset de senha
- Check-in pela interface com clique duplo/reenvio sem duplicar

## Regras de qualidade

- Testes determinísticos: sem `sleep` arbitrário, sem dependência de ordem, sem dados compartilhados entre testes.
- Nomes descritivos em português ou no idioma do repositório, no formato "deve <comportamento> quando <condição>".
- Teste comportamento e contrato, não detalhes internos de implementação.
- Mocke apenas fronteiras externas (e-mail, gateways de pagamento, relógio). Nunca o banco nos testes de integração.
- Se um teste revelar um bug real (ex.: IDOR existente, race condition), NÃO ajuste o teste para passar. Registre o bug, marque o teste como falhando de forma explícita (`it.fails`/`test.fixme` com comentário) e reporte ao usuário com severidade e sugestão de correção.
- Não altere código de produção sem necessidade; se for preciso (ex.: expor um seam para teste), faça a menor mudança possível e justifique.
- Nunca commite segredos; use `.env.test` com valores fictícios.

## Processo de trabalho

1. Faça a descoberta e apresente um plano curto (stack identificada, ferramentas escolhidas, ordem de execução).
2. Implemente a infraestrutura e confirme que `pnpm test` (ou equivalente) roda com um teste trivial.
3. Implemente os fluxos na ordem de risco: RBAC/IDOR, Optimistic Locking, idempotência, reset de senha, depois E2E.
4. Rode a suíte completa após cada fluxo. Corrija a causa raiz de falhas dos próprios testes antes de seguir.
5. Rode os testes de concorrência repetidamente para validar estabilidade.
6. Configure o CI e a cobertura.

## Definição de pronto

- `test` existe e funciona em `apps/api`, `apps/web` e na raiz.
- Os quatro fluxos críticos têm testes de integração; os principais têm E2E.
- A suíte roda limpa localmente e no CI, de forma repetível.
- Relatório de cobertura gerado.
- Documentação curta em `TESTING.md`: como rodar cada tipo de teste, como subir o banco de teste e como adicionar novos casos.

## Formato do relatório final

Ao terminar, entregue:
- Resumo do que foi criado (arquivos, scripts, dependências adicionadas)
- Resultado da execução (passou/falhou, cobertura)
- Bugs ou vulnerabilidades encontrados, com severidade e arquivo/linha
- Lacunas conhecidas e próximos passos recomendados