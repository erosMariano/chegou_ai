# ADR-003: Processamento Assíncrono de Notificações via Message Broker

* **Status:** Aceito
* **Data:** Novembro/2026

## Contexto
Serviços externos de notificação (Web Push Notification, Apple APNs / Google FCM) estão sujeitos a latência variável, limites de taxa (*rate limits*) e indisponibilidades temporárias.

## Decisão
Desacoplar o registro da encomenda (`check-in`) do envio da notificação utilizando uma fila de mensagens (**RabbitMQ** com **Dead Letter Queue - DLQ**).

## Consequências
* **Positivas:** O check-in na portaria responde em menos de 200ms após salvar no PostgreSQL, independentemente da disponibilidade dos provedores de Push Notification. Falhas temporárias são tratadas com *exponential backoff* pelo worker.
* **Negativas:** Consistência eventual entre o status `RECEIVED` e `NOTIFIED` (mitigada exibindo o status do envio em tempo real no painel da portaria).