Você é um engenheiro de segurança de aplicações sênior (AppSec) fazendo uma auditoria defensiva do MEU próprio código. Faça uma revisão completa de segurança desta aplicação:

STACK
- Front-end: Next.js (React)
- Back-end: NestJS
- Banco: PostgreSQL
- Cache/filas/sessões: Redis

OBJETIVO
Encontrar vulnerabilidades reais, explicar o impacto e propor correções concretas. Percorra TODO o repositório (front, back, configs, Dockerfiles, CI/CD, .env.example, migrations), não apenas amostras.

MÉTODO
1. Mapeie a arquitetura: rotas, controllers, módulos, guards, middlewares, DTOs, entidades, fluxos de autenticação e pontos de entrada de dados.
2. Analise cada categoria abaixo.
3. Para cada achado, comprove no código (arquivo e linha). Não invente problemas: se não tiver certeza, marque como "a verificar" e diga o que falta.
4. Rode (se possível) `npm audit`, busca de secrets (gitleaks/trufflehog) e linters de segurança, e inclua os resultados.

CHECKLIST

[Autenticação e sessão]
- Hash de senha (bcrypt/argon2, custo adequado), política de senha
- JWT: algoritmo fixo, secret forte, expiração curta, refresh token com rotação e revogação, armazenamento seguro (cookie httpOnly/Secure/SameSite vs localStorage)
- Brute force, rate limit em login/reset/OTP, enumeração de usuários
- Fluxo de recuperação de senha e verificação de e-mail (tokens previsíveis, sem expiração)
- Logout e invalidação de sessão

[Autorização]
- Endpoints sem Guard, @Public() indevido, guards globais ausentes
- IDOR/BOLA: acesso a recursos de outros usuários/tenants por ID
- Escalonamento de privilégio, checagem de roles só no front
- Mass assignment (DTO aceitando campos como role, isAdmin, tenantId)

[Validação e injeção]
- ValidationPipe com whitelist e forbidNonWhitelisted; DTOs completos
- SQL injection: queries raw, `query()`, query builder com concatenação, ORDER BY/filtros dinâmicos
- NoSQL/Redis command injection, injection em chaves do Redis
- Path traversal, SSRF, command injection, deserialização insegura
- Upload de arquivos: tipo, tamanho, nome, destino, execução

[Front-end Next.js]
- XSS: dangerouslySetInnerHTML, renderização de HTML não sanitizado, URLs javascript:
- Secrets expostos via NEXT_PUBLIC_*, bundles, source maps
- Server Actions/Route Handlers/API routes sem autenticação ou validação
- Proteção CSRF, redirects abertos, middleware de auth contornável
- Dados sensíveis em getServerSideProps/props/cache; cache de páginas autenticadas
- Dependências e versão do Next com CVEs conhecidas

[API e HTTP]
- CORS (origins `*` com credentials, reflexão de Origin)
- Helmet/headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Rate limiting/throttling global, limite de payload, paginação sem limite (DoS)
- GraphQL (se houver): introspection, depth/complexity limit
- Swagger/docs expostos em produção; mensagens de erro e stack traces vazando
- Webhooks sem verificação de assinatura

[PostgreSQL]
- Usuário da aplicação com privilégios excessivos (superuser, DDL)
- Conexão sem TLS, credenciais hardcoded
- Row-level security/multi-tenancy, dados sensíveis sem criptografia
- Migrations com dados ou defaults inseguros, `synchronize: true` em produção

[Redis]
- Sem senha/ACL, exposto publicamente, sem TLS
- Dados sensíveis em cache sem TTL, chaves previsíveis, cache poisoning
- Sessões/tokens armazenados sem expiração
- Comandos perigosos habilitados (FLUSHALL, CONFIG, EVAL)

[Secrets e configuração]
- Secrets no código, no histórico do git, em .env versionado, em logs
- Separação de configs por ambiente, valores default inseguros
- Dockerfile: usuário root, imagem desatualizada, portas expostas, secrets no build
- CI/CD: permissões excessivas, secrets em logs

[Dependências e supply chain]
- Pacotes vulneráveis ou abandonados, lockfile ausente, scripts postinstall suspeitos

[Logs, privacidade e resiliência]
- Dados pessoais/senhas/tokens em logs, ausência de auditoria de ações críticas
- LGPD: coleta excessiva, retenção, exclusão de dados
- Race conditions em operações financeiras/estoque, falta de transações
- Timeouts, tratamento de erros, DoS por regex ou queries pesadas

FORMATO DA RESPOSTA
1. Resumo executivo (5 linhas) e nota geral de risco.
2. Tabela de achados: ID | Severidade (Crítica/Alta/Média/Baixa/Info) | Categoria | Arquivo:linha | Descrição curta.
3. Detalhe de cada achado:
   - O que é e por que é um problema
   - Trecho de código vulnerável
   - Cenário de exploração (passo a passo resumido)
   - Correção recomendada com código
   - Referência (OWASP Top 10 / ASVS / CWE)
4. Pontos positivos já bem implementados.
5. Plano de correção priorizado (o que corrigir primeiro) e itens "a verificar".

REGRAS
- Seja específico ao meu código; evite conselhos genéricos.
- Não faça alterações nos arquivos sem eu pedir: apenas reporte e sugira.
- Não exponha valores reais de secrets no relatório (mascare).