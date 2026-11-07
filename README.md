# Chegou.AI - Gestão Inteligente de Encomendas com Visão Computacional & Web Push

> **Check-in de encomendas em menos de 10 segundos na portaria** usando extração *zero-shot* de etiquetas por IA, alertas assíncronos via **Web Push Notifications** e baixa auditável com **QR Code / PIN único**.

---

## O Problema de Negócio

Portarias de condomínios residenciais e comerciais sofrem com filas em horários de pico, etiquetas rasgadas/ilegíveis, atrasos na comunicação com moradores e risco de entrega incorreta por falta de rastreabilidade.

O **Chegou.AI** resolve esse gargalo substituindo cadernos e digitação manual por um fluxo digital orientado a eventos:
1. **Smart Check-in (IA):** O porteiro fotografa a etiqueta; a IA extrai destinatário, bloco/apartamento, transportadora e código de rastreio em formato estruturado (`JSON Schema`), com fallback manual imediato em caso de baixa confiança.
2. **Notificação Assíncrona em Tempo Real:** O registro publica um evento em fila (`RabbitMQ`), disparando **Web Push Notifications** diretamente para os dispositivos inscritos do morador (custo zero de mensageria).
3. **Cadeia de Custódia Auditável:** A retirada só é concluída mediante validação atômica e idempotente de um **PIN de 6 dígitos** ou **QR Code**, gerando trilha de auditoria imutável (`append-only`).

---

## Arquitetura de Alto Nível (C4 - Contêineres)

```mermaid
flowchart TB
    subgraph Client ["Dispositivos dos Usuários"]
        PWA["📱 Web App / PWA + Service Worker\n[Next.js + TypeScript + Tailwind]"]
    end

    subgraph BackendBoundary ["Plataforma Chegou.AI"]
        BFF["🛡️ Camada BFF / Route Handlers\n[Next.js Server]"]
        CoreAPI["⚙️ Core API Service\n[Spring Boot / Node.js]"]
        Worker["⚡ Push Notification Worker\n[Background Consumer]"]
        
        DB[("🗄️ Banco Relacional\n[PostgreSQL 16]")]
        Cache[("⚡ Cache & Locks\n[Redis]")]
        Broker[["📨 Message Broker\n[RabbitMQ + DLQ]"]]
    end

    AI["🧠 LLM Vision API\n[Gemini 2.5 Flash - JSON Schema]"]
    PushGateway["🔔 Browser / OS Push Services\n[Web Push API / VAPID]"]

    PWA -->|"HTTPS / JSON"| BFF
    BFF -->|"Imagem comprimida (API Key protegida)"| AI
    BFF -->|"REST / JSON"| CoreAPI

    CoreAPI -->|"Transações ACID + Optimistic Lock"| DB
    CoreAPI -->|"Idempotência & Rate Limit"| Cache
    CoreAPI -->|"Publica PackageReceivedEvent"| Broker

    Broker -->|"Consome evento"| Worker
    Worker -->|"Envia Push criptografado"| PushGateway
    PushGateway -.->|"Acorda Service Worker"| PWA