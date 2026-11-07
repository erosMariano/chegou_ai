# Jornada do Usuário & Fluxos Operacionais

Este documento detalha os fluxos principais e os cenários de exceção da aplicação para garantir que todas as bordas operacionais sejam tratadas na arquitetura.

---

## 1. Fluxo Principal: Check-in Inteligente & Notificação (Happy Path)

```mermaid
sequenceDiagram
    actor Entregador
    actor Porteiro
    participant App as App Portaria (PWA)
    participant AI as Serviço de Visão (IA)
    participant Core as Core API + DB
    participant Queue as Fila (Broker)
    actor Morador

    Entregador->>Porteiro: Entrega pacote no balcão
    Porteiro->>App: Tira foto da etiqueta
    App->>AI: Envia imagem comprimida
    AI-->>App: Retorna JSON (Apto, Nome, Rastreio, Confiança: 0.95)
    Porteiro->>App: Confirma dados com 1 toque
    App->>Core: POST /packages
    Core->>Core: Salva encomenda + Gera PIN/QR Hash
    Core->>Queue: Publica evento PackageReceived
    Core-->>App: 201 Created (Sucesso)
    Note over Porteiro,Entregador: Porteiro libera entregador (< 10s)
    Queue->>Morador: Worker dispara Push Notification com PIN e Link QR