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