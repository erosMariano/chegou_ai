# Arquitetura de Sistemas & Diagramas C4 (`Chegou.AI`)

Este documento apresenta a arquitetura do **Chegou.AI** utilizando o **Modelo C4** (Contexto e Contêineres) e a **Máquina de Estados** que governa o ciclo de vida de cada encomenda.

---

## 1. Modelo C4 — Nível 1: Diagrama de Contexto

Mostra como o sistema se posiciona no ambiente condominial e suas dependências externas.

```mermaid
flowchart TB
    Porteiro(["👤 Porteiro / Zelador\n(Operador da Portaria)"])
    Morador(["👤 Morador\n(Destinatário)"])
    Sindico(["👤 Síndico / Admin\n(Gestor)"])

    Sistema["🏢 Sistema de Gestão de Encomendas\n(Chegou.AI)\nAutomatiza check-in com IA, dispara Push Notifications\ne audita retiradas via PIN/QR Code"]

    PushService["🔔 Serviço de Web Push / FCM\n(Push Services dos Navegadores / OS)"]
    AIProvider["🧠 Provedor de IA Multimodal\n(Gemini Flash / OpenAI Vision)"]

    Porteiro -->|"Registra pacotes (foto/manual)\ne valida retiradas (HTTPS)"| Sistema
    Morador -->|"Recebe Push, abre QR Code/PIN\ne consulta histórico (HTTPS)"| Sistema
    Sindico -->|"Gerencia unidades, moradores\ne audita logs (HTTPS)"| Sistema

    Sistema -->|"Envia foto da etiqueta para\nextração estruturada (HTTPS/JSON)"| AIProvider
    Sistema -->|"Envia payload criptografado (VAPID)\npara entrega nos dispositivos (HTTPS)"| PushService
```

---

## 2. Modelo C4 — Nível 2: Diagrama de Contêineres

Descreve a fronteira interna dos contêineres e serviços que compõem o **Chegou.AI**, detalhando as responsabilidades do BFF, do Core API, da fila assíncrona e dos workers.

```mermaid
flowchart TB
    subgraph Users ["Usuários"]
        Porteiro(["👤 Porteiro / Zelador"])
        Morador(["👤 Morador"])
        Sindico(["👤 Síndico / Admin"])
    end

    subgraph Boundaries ["Sistema Chegou.AI"]
        BFF["💻 Web App & BFF (Next.js)\nPWA, SSR de QR Codes, Proxy IA & Auth"]
        CoreAPI["⚙️ Core API Service\nRegras de negócio, transações ACID e checkout"]
        Broker["📨 Message Broker (RabbitMQ)\nFilas de eventos e Dead Letter Queue"]
        Worker["⚡ Push Notification Worker\nConsome eventos e despacha Web Push VAPID"]
        Cache[("⚡ Redis Cache\nRate limiting e chaves de idempotência")]
        Database[("🗄️ PostgreSQL 16+\nPersistência transacional e auditoria append-only")]
    end

    subgraph External ["Serviços Externos"]
        AIProvider["🧠 Provedor de IA Multimodal\n(Gemini 2.5 Flash / OpenAI Vision)"]
        PushService["🔔 Serviço de Web Push / FCM\n(Mozilla / Chrome / Safari / Edge)"]
    end

    Porteiro -->|"Acessa PWA, tira foto da etiqueta\ne valida QR Code / PIN (HTTPS)"| BFF
    Morador -->|"Acessa portal do morador, visualiza\nQR Code e autoriza Push (HTTPS)"| BFF
    Sindico -->|"Acessa painel gerencial e auditoria (HTTPS)"| BFF

    BFF -->|"Envia imagem em memória para extração (HTTPS/JSON)"| AIProvider
    BFF -->|"Consome e encaminha requisições de negócio (HTTPS/JSON)"| CoreAPI
    BFF -->|"Verifica rate limits e cache de sessão"| Cache

    CoreAPI -->|"Valida idempotência de check-in (SETNX)"| Cache
    CoreAPI -->|"Persiste encomendas e auditoria (TCP/Pooling)"| Database
    CoreAPI -->|"Publica evento PackageReceived"| Broker

    Broker -->|"Entrega mensagens para processamento"| Worker
    Worker -->|"Consulta inscrições de Push ativas (TCP)"| Database
    Worker -->|"Despacha Web Push criptografado (VAPID/HTTPS)"| PushService
    Worker -->|"Registra evento de sucesso/falha na trilha"| Database
```

---

## 3. Máquina de Estados: Ciclo de Vida da Encomenda

Define os estados válidos e as transições possíveis de uma encomenda desde o check-in na portaria até a retirada ou eventual cancelamento.

```mermaid
stateDiagram-v2
    [*] --> RECEIVED: Check-in realizado (Portaria)\nPIN/QR Code gerados

    RECEIVED --> NOTIFIED: Evento processado\nPush entregue ao morador
    RECEIVED --> NOTIFICATION_FAILED: Falha permanente no Push / Sem dispositivo ativo

    NOTIFICATION_FAILED --> NOTIFIED: Reenvio de notificação / Novo dispositivo registrado

    NOTIFIED --> DELIVERED: Check-out validado\nLeitura de QR Code ou PIN correto
    RECEIVED --> DELIVERED: Check-out direto na portaria\n(retirada presencial imediata)
    NOTIFICATION_FAILED --> DELIVERED: Check-out validado\n(PIN fornecido presencialmente)

    RECEIVED --> CANCELLED: Cancelamento / Encomenda recusada
    NOTIFIED --> CANCELLED: Cancelamento / Devolução
    NOTIFICATION_FAILED --> CANCELLED: Cancelamento

    DELIVERED --> [*]
    CANCELLED --> [*]
```
