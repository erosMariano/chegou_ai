# ADR-001: Arquitetura Desacoplada (Next.js como BFF + Core API em NestJS)

* **Status:** Aceito
* **Data:** Novembro/2026
* **Decisores:** Arquitetura de Software

## Contexto
A aplicação exige uma interface web responsiva com acesso à câmera (PWA) para a portaria, páginas de carregamento instantâneo via link mobile para moradores e processamento assíncrono confiável para disparo de Web Push Notifications e controle transacional de entregas.

## Opções Consideradas
1. **Monólito Full-Stack exclusivo no Next.js (API Routes + Serverless):** Rápido para iniciar, mas apresenta limitações para manter *workers* contínuos escutando filas de mensageria e sofre com *timeouts* em ambientes *serverless*.
2. **Next.js como BFF/UI + Core API em Java Spring Boot:** Alta robustez corporativa, mas introduz troca de contexto de linguagem (TypeScript $\leftrightarrow$ Java) e duplicação de contratos/tipos em um time enxuto.
3. **Next.js como BFF/UI + Core API Dedicado em NestJS (TypeScript):** Separa responsabilidades de apresentação/proxy seguro (Next.js) das regras de negócio transacionais, filas e workers (NestJS), mantendo tipagem unificada end-to-end.

## Decisão
Adotar a **Opção 3 (Next.js como Front-end/BFF + Back-end Core dedicado em NestJS)**. O Next.js gerencia a interface PWA, autenticação de sessão, renderização rápida para o morador e atua como proxy seguro para a API de Visão Computacional. O NestJS gerencia a persistência ACID no PostgreSQL (via Prisma ou Drizzle ORM), controle de concorrência no check-out, Guards de RBAC e consumo/publicação de eventos na fila.

## Consequências
* **Positivas:** 100% TypeScript ponta a ponta (reuso de schemas Zod/DTOs); arquitetura modular e testável com Injeção de Dependência nativa; workers de Push Notification rodando em processo contínuo sem risco de timeout HTTP.
* **Negativas:** Necessidade de orquestrar dois serviços Node.js no `docker-compose.yml` e manter contratos HTTP bem versionados entre BFF e Core API.