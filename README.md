# Chegou.AI — Smart Parcel Delivery & Custody for Condominiums

[![CI Status](https://github.com/erosMariano/chegou_ai/actions/workflows/test.yml/badge.svg)](https://github.com/erosMariano/chegou_ai/actions/workflows/test.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-000000?logo=next.dot.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Chegou.AI** é uma plataforma corporativa *full-stack* orientada a eventos para condomínios residenciais e comerciais. Reduz o tempo de check-in na portaria para **menos de 10 segundos** utilizando extração *zero-shot* de etiquetas via **Visão Computacional (Gemini 2.5 Flash)**, despacho assíncrono de notificações por **Web Push PWA (VAPID)** e baixa com garantia de custódia via **QR Code / PIN de uso único**, blindada contra concorrência e ataques de injeção/enumeração.

---

## Sumário

- [Destaques de Engenharia & Decisões Arquiteturais](#destaques-de-engenharia--decisões-arquiteturais)
- [Evidências Visuais do Fluxo Completo (Do Zero ao PIN)](#evidências-visuais-do-fluxo-completo-do-zero-ao-pin)
- [Arquitetura de Alto Nível (C4 - Containers)](#arquitetura-de-alto-nível-c4---containers)
- [Padrões de Projeto & Código Limpo](#padrões-de-projeto--código-limpo)
- [Segurança Ofensiva & Defensiva (LGPD & OWASP)](#segurança-ofensiva--defensiva-lgpd--owasp)
- [Estratégia de Testes Automatizados (Pirâmide Completa)](#estratégia-de-testes-automatizados-pirâmide-completa)
- [Stack Tecnológica](#stack-tecnológica)
- [Documentação Interativa da API (OpenAPI / Swagger)](#documentação-interativa-da-api-openapi--swagger)
- [Instalação & Execução Local](#instalação--execução-local)
- [Pipeline de CI/CD & Automação](#pipeline-de-cicd--automação)
- [Sobre o Autor](#sobre-o-autor)

---

## Destaques de Engenharia & Decisões Arquiteturais

| Desafio de Produção | Solução Implementada | Impacto / Garantia |
|---|---|---|
| **Duplo clique do porteiro / Retentativas de rede** | Idempotência atômica com **Redis** (`SET ... EX NX` via header `Idempotency-Key`). | Bloqueia duplicidade de encomendas na mesma requisição com replay seguro da resposta. |
| **Baixas simultâneas do mesmo pacote (Race Condition)** | **Optimistic Concurrency Control (OCC)** no PostgreSQL via Prisma (`version` column). | A primeira requisição comita; a requisição obsoleta falha de imediato com `409 Conflict`. |
| **Falhas transitórias no envio de Web Push** | **RabbitMQ** com cadeia de 3 filas de retry progressivo (`5s`, `15s`, `45s`) + **DLQ**. | Garantia de entrega assíncrona sem travar a thread de check-in e isolamento de falhas. |
| **Força bruta de PIN na portaria** | Rate limiting atômico no Redis (`MULTI/INCR/EXPIRE`) bloqueando após 5 tentativas. | Proteção contra ataques de dicionário ou adivinhação do PIN de 6 dígitos. |
| **Privacidade da imagem da encomenda (LGPD)** | Processamento da imagem estritamente em memória no BFF com descarte imediato (Zero-Storage). | Nenhuma foto de dados pessoais de etiquetas trafega para disco ou S3. |
| **Integridade de Senhas e PINs** | Hash criptográfico **bcrypt** (salt 10) para senhas e **SHA-256** para PIN de retirada. | Impossibilidade de vazamento de credenciais ou PINs mesmo em caso de dump do banco relacional. |
| **Anti-Enumeração de Contas** | Respostas uniformes (status e body idênticos) em `forgot-password`. | Atacantes não conseguem mapear quais e-mails existem na base de condôminos. |

---

## Evidências Visuais do Fluxo Completo (Do Zero ao PIN)

Todas as telas abaixo foram capturadas através de automação **Playwright** executada diretamente sobre a versão de produção (`next build` & `next start`, sem overlays ou insights de desenvolvimento), cobrindo o ciclo completo a partir do banco de dados PostgreSQL e Redis 100% zerados:

### 1. Primeiro Acesso e Onboarding do Condomínio (Do Zero)
| Tela de Login (Alerta de Condomínio Não Inicializado) | Etapa 1 — Criação do Condomínio & Busca Automática por CEP |
|:---:|:---:|
| ![Login Banco Zerado](docs/assets/screenshots/01-login-banco-zerado-aviso.png) | ![Criação Condomínio](docs/assets/screenshots/03-criar-condominio-etapa-1-preenchida.png) |

| Etapa 2 — Credenciais do Síndico / Administrador | Login Seguro no Sistema Ativo |
|:---:|:---:|
| ![Síndico Admin](docs/assets/screenshots/05-criar-condominio-etapa-2-preenchida.png) | ![Login Sistema Ativo](docs/assets/screenshots/10-login-sistema-ativo.png) |

### 2. Gestão Administrativa (Unidades, Moradores e Portaria)
| Unidades & Apartamentos Cadastrados | Cadastro de Moradores Vinculados à Unidade (com E-mail) | Email Recebido do usuário após o cadastro |
|:---:|:---:|:---:|
| ![Unidades](docs/assets/screenshots/07-admin-unidades-cadastradas.png) | ![Moradores](docs/assets/screenshots/10-admin-moradores-cadastrados.png) |![Moradores](docs/assets/screenshots/20-email-usuario.png) |

| Operadores de Portaria (Controle RBAC) | Configurações Gerais do Condomínio |
|:---:|:---:|
| ![Porteiros](docs/assets/screenshots/09-admin-usuarios-porteiro-cadastrado.png) | ![Configurações](docs/assets/screenshots/19-admin-configuracoes.png) |

### 3. Operação de Portaria (Check-in & Checkout de Encomendas)
| Check-in de Encomenda na Recepção | Confirmação e Registro com Idempotência |
|:---:|:---:|
| ![Checkin Preenchido](docs/assets/screenshots/13-portaria-checkin-preenchido.png) | ![Sucesso](docs/assets/screenshots/14-portaria-checkin-sucesso.png) |

| Painel de Encomendas Pendentes na Portaria | Checkout com Validação de PIN de 6 Dígitos |
|:---:|:---:|
| ![Pendentes](docs/assets/screenshots/15-portaria-encomenda-pendente.png) | ![Checkout](docs/assets/screenshots/16-portaria-checkout-tela.png) |

### 4. Portal do Morador & Documentação OpenAPI
| Portal do Morador — Sem Encomendas Esperando (Empty State) | Portal do Morador - Push notification |Portal do Morador — Encomenda com PIN e QR Code Ativo |
|:---:|:---:|:---:|
| ![Morador Sem Encomendas](docs/assets/screenshots/11-morador-sem-encomendas-esperando.png) | ![Morador push notification](docs/assets/screenshots/21-push-notification.png) | ![Morador PIN](docs/assets/screenshots/17-morador-portal-encomenda-pin.png) |

| Documentação Interativa Swagger / OpenAPI 3.0 |
|:---:|
| ![Swagger Docs](docs/assets/screenshots/18-swagger-api-docs.png) |

---

## Arquitetura de Alto Nível (C4 - Containers)

```mermaid
flowchart TB
    subgraph Client ["Client Layer (Dispositivos dos Usuários)"]
        PWA["Web App / PWA & Service Worker\n[Next.js + TypeScript + Tailwind + shadcn/ui]"]
    end

    subgraph BackendBoundary ["Plataforma Core Chegou.AI"]
        BFF["BFF / Next.js Server Handlers\n[Zero-Storage OCR Proxy & Session Guard]"]
        CoreAPI["Core API Service\n[NestJS + TypeScript + RFC 7807 + Throttler]"]
        Worker["Push Notification Worker\n[RabbitMQ Consumer com Backoff & DLQ]"]
        
        DB[("PostgreSQL 16\n[Prisma ORM + Transações ACID + OCC]")]
        Cache[("Redis 7\n[Idempotência, Rate Limits, Locks & Tokens]")]
        Broker[["RabbitMQ 3.13\n[Exchange + Filas de Retry 5s/15s/45s + DLQ]"]]
    end

    AI["Google Gemini 2.5 Flash\n[Structured Outputs / Strict JSON Schema]"]
    PushGateway["Web Push Services\n[VAPID Protocol / W3C Push API]"]
    MailGateway["Resend SDK / SMTP\n[E-mails Transacionais com Fallback]"]

    PWA -->|"HTTPS / JSON"| BFF
    BFF -->|"Imagem em Buffer (API Key Oculta)"| AI
    BFF -->|"REST / JSON"| CoreAPI

    CoreAPI -->|"Transações ACID & Version Lock"| DB
    CoreAPI -->|"SET NX, INCR com TTL & Hashes"| Cache
    CoreAPI -->|"Publica PackageReceivedEvent"| Broker
    CoreAPI -->|"Convites & Reset de Senha"| MailGateway

    Broker -->|"Consome evento"| Worker
    Worker -->|"Envia Push Criptografado"| PushGateway
    PushGateway -.->|"Acorda Service Worker"| PWA
```

---

## Padrões de Projeto & Código Limpo

O projeto adota uma combinação de metodologias modernas de engenharia aplicadas tanto no front-end quanto no back-end:

1. **Feature-Sliced Design (FSD) no Front-end (`apps/web`):**
   - Hierarquia estrita de importação de cima para baixo: `app/` (rotas do App Router) → `widgets/` (composição rica de telas) → `features/` (interações do usuário com hooks de estado) → `entities/` (modelos e schemas do domínio) → `shared/` (primitivas de UI, design system e adaptadores).
2. **Ports & Adapters (Hexagonal Architecture):**
   - O consumo de APIs externas e repositórios é desacoplado por interfaces em `shared/ports/` e implementações intercambiáveis em `shared/adapters/` (`mock` para testes/demonstração e `http` para integração real com o back-end NestJS).
3. **Schema-Driven Development (SDD) com Zod:**
   - Contratos definidos como Schemas Zod únicos em `entities/*/model/schema.ts`, gerando simultaneamente a inferência estática de tipos TypeScript (`z.infer<T>`) e a validação em tempo de execução de formulários via `react-hook-form`.
4. **Padronização RFC 7807 (Problem Details):**
   - Respostas de erro consistentes em toda a API através de filtro global do NestJS (`Rfc7807ExceptionFilter`), expondo `type`, `title`, `status`, `detail`, `instance` e timestamps padronizados.
5. **Observabilidade com Healthcheck Ativo:**
   - Endpoint dedicado `GET /api/v1/health` que executa sondagens reais em tempo de execução no PostgreSQL (`SELECT 1`), Redis (`PING`) e RabbitMQ (`channel.isOpen`), permitindo que orquestradores (Docker, Kubernetes, Railway) monitorem o estado de degradação da aplicação.

---

## Segurança Ofensiva & Defensiva (LGPD & OWASP)

- **Role-Based Access Control (RBAC):** Matriz estrita de permissões com três papéis (`ADMIN`, `PORTER`, `RESIDENT`), validada por Guards customizados (`JwtAuthGuard`, `RolesGuard`, `AuthGuard`).
- **Prevenção a Broken Object Level Authorization (BOLA/IDOR):** Moradores só têm acesso a encomendas e dados explicitamente vinculados à sua própria unidade (`unitId`). Tentativas de consultar encomendas de terceiros resultam em `403 Forbidden` ou lista vazia (*fail-closed*).
- **Proteção contra Mass Assignment:** O `ValidationPipe` do NestJS rejeita propriedades não documentadas nos DTOs através de `whitelist: true` e `forbidNonWhitelisted: true`.
- **Proteção contra CSV Injection:** Toda exportação de relatórios de auditoria higieniza campos de texto iniciados por caracteres executáveis (`=`, `+`, `-`, `@`).
- **Defesa em Camadas contra DoS & Brute-Force:**
  - Rate limiting global por IP: 120 req/min.
  - Rate limiting sensível de autenticação: 5 req/min em rotas de login e recuperação de senha.
  - Rate limiting atômico por encomenda: máximo de 5 tentativas incorretas de PIN antes do bloqueio temporário.
- **Tokens Criptográficos de Uso Único:** Tokens de convite e recuperação de senha utilizam entropia de 256 bits gerada via `crypto.randomBytes`, persistidos no Redis como hash SHA-256 e invalidados imediatamente no primeiro consumo.

---

## Estratégia de Testes Automatizados (Pirâmide Completa)

A suíte de testes foi construída para validar a aplicação em todas as camadas da pirâmide de testes:

```
          / \
         / E2E \        -> 4 testes Playwright (fluxos de ponta a ponta em navegador real)
        /-------\
       / Integr. \      -> 33 testes de Integração (API real + Postgres 16 + Redis 7)
      /-----------\
     /  Unitários  \    -> 22 testes Unitários (Vitest: guards, services, OCC, retry)
    /---------------\
```

### O que é coberto nos testes:
- **Testes Unitários (`npm run test:unit`):** Lógica pura de autenticação, guards de RBAC, política de retries com backoff do RabbitMQ, healthcheck e detecção de colisões.
- **Testes de Integração (`npm run test:integration --prefix apps/api`):** Executados contra PostgreSQL e Redis reais em contêineres:
  - Matriz completa de RBAC e bloqueio de IDOR multi-unidade.
  - Idempotência no check-in sob disparo de requisições concorrentes paralelas.
  - Optimistic locking na baixa com colisão simultânea de PINs.
  - Fluxo completo de reset de senha, política de força e anti-enumeração.
- **Testes End-to-End (`npm run test:e2e`):** Executados via Playwright em Chromium headless:
  - Proteção de rotas e redirecionamento de perfis no front-end.
  - Check-in na portaria com duplo clique no botão de confirmação.
  - Fluxo de recuperação e redefinição de senha via interface do usuário.

---

## Stack Tecnológica

### Front-end & Mobile (PWA)
- **Framework:** Next.js 16 (App Router, Server Components & Route Handlers)
- **Linguagem:** TypeScript 5 (Strict Mode)
- **Estilização & UI:** Tailwind CSS, shadcn/ui, Radix UI, Magic UI, Lucide Icons
- **Gerenciamento de Formulários:** React Hook Form + Zod
- **Notificações:** Service Worker nativo (W3C Push API / Web Push)
- **Geração de Códigos:** `qrcode.react` (Renderização vetorial SVG)

### Back-end & Arquitetura Core
- **Framework:** NestJS 11 (Modular Architecture, Injeção de Dependências)
- **ORM & Migrações:** Prisma ORM com PostgreSQL 16
- **Cache & Concorrência:** Redis 7 (`ioredis`)
- **Mensageria Assíncrona:** RabbitMQ 3.13 (`amqplib`) com TTL Exchanges & DLQ
- **Inteligência Artificial:** Google Gemini 2.5 Flash via `@google/genai`
- **Segurança:** Passport JWT, bcryptjs, Helmet, Throttler
- **Documentação:** Swagger UI / OpenAPI 3.0

### DevOps, CI/CD & Testes
- **Test Runners:** Vitest (Unitários & Integração) e Playwright (E2E)
- **Contêineres:** Docker & Docker Compose (`docker-compose.prod.yml`)
- **Pipeline de CI/CD:** GitHub Actions com testes automatizados, build, lint e `npm audit` de vulnerabilidades.

---

## Documentação Interativa da API (OpenAPI / Swagger)

A API possui documentação viva e interativa em conformidade com o padrão OpenAPI 3.0:

- **Swagger UI:** `http://localhost:8080/api/docs`
- **OpenAPI Schema (JSON):** `http://localhost:8080/api/docs-json`

### Principais Grupos de Endpoints (33 rotas documentadas):
- `POST /api/v1/auth/login` — Autenticação com rate limiting (5 req/min).
- `POST /api/v1/packages` — Check-in de encomendas com suporte a `Idempotency-Key`.
- `POST /api/v1/packages/checkout` — Baixa com validação de PIN/QR Code e Optimistic Locking.
- `POST /api/v1/bff/packages/extract-label` — OCR de etiquetas via Gemini 2.5 Flash.
- `GET /api/v1/residents/me/packages` — Encomendas pendentes e PINs isolados por morador.
- `POST /api/v1/residents/me/push-subscriptions` — Registro de chaves VAPID do morador.
- `GET /api/v1/health` — Verificação de integridade operacional do PostgreSQL, Redis e RabbitMQ.
- `GET /api/v1/audit/events` — Trilha append-only de auditoria de eventos de encomendas.

---

## Instalação & Execução Local

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 20 ou 22 LTS
- [Docker](https://www.docker.com/) & Docker Compose

### 1. Clonar o Repositório e Instalar Dependências
```bash
git clone https://github.com/erosMariano/chegou_ai.git
cd chegou_ai

# Instalar dependências da raiz e dos workspaces
npm install
npm --prefix apps/api install
npm --prefix apps/web install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

### 3. Subir a Infraestrutura (PostgreSQL, Redis e RabbitMQ)
```bash
docker compose up -d
```

### 4. Executar Migrações e Seeds do Banco de Dados
```bash
# Gera o cliente Prisma e aplica as migrações no banco
npm --prefix apps/api run prisma:generate
npm --prefix apps/api run prisma:migrate

# Opcional: Popular banco com dados de demonstração
npm run db:seed
```

### 5. Iniciar Aplicação em Modo Desenvolvimento
```bash
# Terminal 1 — Back-end NestJS (porta 8080):
npm --prefix apps/api run start:dev

# Terminal 2 — Front-end Next.js (porta 3000):
npm --prefix apps/web run dev
```

Acesse a aplicação no navegador em `http://localhost:3000` e o Swagger em `http://localhost:8080/api/docs`.

---

## Pipeline de CI/CD & Automação

O pipeline automatizado do **GitHub Actions** (`.github/workflows/test.yml`) é executado a cada push ou pull request nas branches principais:

1. **Job `unit-and-build`:**
   - Instalação limpa (`npm ci`), compilação TypeScript, linting estrito no front-end, execução dos testes unitários e build de produção dos dois módulos (`apps/api` e `apps/web`).
2. **Job `integration`:**
   - Sobe contêineres de serviço efêmeros (PostgreSQL 16 e Redis 7), aplica as migrações do Prisma e roda os testes de concorrência, idempotência e isolamento multi-unidade.
3. **Job `e2e`:**
   - Instala o navegador Chromium e executa a suíte ponta a ponta do Playwright.
4. **Job `security-audit`:**
   - Executa `npm audit` em busca de vulnerabilidades críticas em dependências de produção antes de permitir merges.

---

## Sobre o Autor

Desenvolvido por **Eros Mariano** como demonstração prática de engenharia de software de alta maturidade, unindo arquitetura distribuída, segurança defensiva, concorrência atômica e inteligência artificial aplicada a problemas reais de negócio.

- **GitHub:** [@erosMariano](https://github.com/erosMariano)
- **LinkedIn:** [Eros Mariano](https://www.linkedin.com/in/erosmariano/)

---

<p align="center">
  <sub>Construído com orgulho para modernizar a logística condominial brasileira.</sub>
</p>
