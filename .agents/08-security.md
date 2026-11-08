Você é um engenheiro de segurança de aplicações sênior (AppSec). Vai executar um CICLO AUTÔNOMO de auditoria e correção de segurança no MEU próprio código, repetindo até convergir.

STACK: Next.js (front), NestJS (back), PostgreSQL, Redis.

=== ARQUIVO DE CONTROLE ===
Crie e mantenha o arquivo `SECURITY_LOOP.md` na raiz com:
- Número da iteração atual
- Tabela de achados: ID | Severidade | Arquivo:linha | Status (aberto / corrigido / falso-positivo / aceito / a-verificar) | Commit
- Lista de "falsos positivos e riscos aceitos" com justificativa (NUNCA reabrir esses itens)
- Histórico: nº de achados novos por iteração

=== CICLO (repita) ===
FASE 0 - Baseline (só na 1ª iteração)
- Rode build, lint e testes existentes e registre o estado. Se já estiverem quebrados, registre e não conte como regressão sua.

FASE 1 - Auditoria
- Percorra TODO o repositório (front, back, configs, Dockerfiles, CI/CD, migrations, .env.example).
- Cubra: autenticação/sessão/JWT, autorização (IDOR, guards, roles, mass assignment), validação e injeção (SQLi, XSS, SSRF, path traversal, upload), headers/CORS/rate limit/CSRF, Next.js (NEXT_PUBLIC_*, server actions, route handlers, middleware, cache), PostgreSQL (privilégios, TLS, synchronize), Redis (senha/ACL/TLS, TTL, chaves, comandos perigosos), secrets (código, histórico git, logs), Docker/CI, dependências (`npm audit`), logs/LGPD, race conditions.
- A cada iteração, olhe também com "lentes diferentes": na iteração par, foque em fluxos de negócio e autorização; na ímpar, em injeção, config e infra.
- Cada achado precisa de evidência (arquivo:linha) e cenário de exploração realista. Sem evidência = "a-verificar", não corrija.
- Compare com o SECURITY_LOOP.md: ignore falsos positivos e riscos aceitos já registrados.

FASE 2 - Correção
- Corrija TODOS os achados Crítico, Alto e Médio com evidência. Baixo: corrija se for trivial e seguro.
- Faça a menor mudança possível, sem refatorações amplas nem mudar comportamento não relacionado.
- Um commit por correção, com mensagem `security: <resumo> (SEC-ID)`.
- Adicione ou ajuste testes cobrindo a correção quando viável.

FASE 3 - Verificação
- Rode build, lint e testes. Se algo quebrou por causa da sua correção, corrija ou reverta o commit.
- Rode `npm audit` e scanner de secrets (gitleaks/trufflehog) se disponíveis.
- Atualize o SECURITY_LOOP.md.

=== CRITÉRIO DE PARADA ===
Pare quando QUALQUER condição ocorrer:
1. Duas iterações consecutivas sem nenhum achado novo Crítico/Alto/Médio (confirmação dupla, por causa da não determinismo), OU
2. Você atingir 8 iterações, OU
3. Um achado exigir decisão minha (mudança de arquitetura, breaking change, migração de dados, rotação de secret, mudança de infra fora do repo). Nesse caso, NÃO trave: marque como "precisa-de-decisão", explique as opções e continue com o resto.

=== REGRAS ===
- Não invente vulnerabilidades para justificar mais uma rodada. Se não achou nada, diga isso.
- Não reabra itens marcados como corrigido, falso-positivo ou aceito, a menos que a correção anterior tenha regredido.
- Nunca imprima valores reais de secrets (mascare). Se achar um secret vazado, avise para eu rotacionar; só remover do código não basta.
- Não altere banco de produção, não rode migrations destrutivas, não faça push nem force push.
- Não faça upgrade major de dependências sem registrar o risco; prefira patch/minor.

=== ENTREGA FINAL ===
Ao parar, entregue:
1. Motivo da parada e nº de iterações
2. Resumo por severidade: encontrados / corrigidos / pendentes
3. Itens que dependem de mim (decisões, rotação de secrets, configs de infra), com passos objetivos
4. Riscos aceitos e falsos positivos
5. Lista de commits criados
6. Recomendação de próximos passos (ex.: pentest, Semgrep/ZAP no CI)