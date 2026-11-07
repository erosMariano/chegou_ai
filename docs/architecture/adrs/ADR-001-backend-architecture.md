# ADR-001: Arquitetura Desacoplada (Next.js como BFF + Core API Dedicado)

* **Status:** Aceito
* **Data:** Novembro/2026
* **Decisores:** Arquitetura de Software

## Contexto
A aplicação exige uma interface web responsiva com acesso à câmera (PWA) para a portaria, páginas de carregamento instantâneo via link mobile para moradores e processamento assíncrono confiável para disparo de notificações e controle transacional de entregas.

## Opções Consideradas
1. **Monólito Full-Stack exclusivo no Next.js (API Routes + Serverless):** Rápido para iniciar, mas apresenta limitações para manter *workers* contínuos escutando filas de mensageria e sofre com *timeouts* em ambientes *serverless*.
2. **Next.js como BFF/UI + Back-end Core Dedicado:** Separa responsabilidades de apresentação/proxy seguro (Next.js) das regras de negócio transacionais, filas e workers (Core Service).

## Decisão
Adotar a **Opção 2 (Next.js como Front-end/BFF + Back-end Core dedicado)**. O Next.js gerencia a interface, autenticação de sessão, renderização rápida para o morador e atua como proxy seguro para a API de Visão Computacional. O Core Service gerencia a persistência ACID, controle de concorrência no check-out e publicação de eventos na fila.

## Consequências
* **Positivas:** Escalabilidade independente; workers de notificação rodam sem risco de timeout HTTP; domínio de negócio isolado e facilmente testável.
* **Negativas:** Maior complexidade inicial de infraestrutura (orquestração de dois serviços no `docker-compose.yml` e contratos de API entre BFF e Core).