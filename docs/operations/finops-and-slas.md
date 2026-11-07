# FinOps (Análise de Custos) & Metas de SLA (`Chegou.AI`)

Este documento apresenta a modelagem financeira da operação e os acordos de nível de serviço (SLAs) técnicos, demonstrando viabilidade econômica para escala SaaS.

---

## 1. Cenário Base de Dimensionamento

Para projetar custos realistas, consideramos um **condomínio residencial de médio/grande porte**:
* **Unidades:** 300 apartamentos.
* **Volume médio diário:** 80 encomendas/dia (~2.400 encomendas/mês).
* **Picos operacionais:** 30 encomendas registradas em uma janela de 10 minutos (chegada de transportadoras em horário comercial).

---

## 2. Estimativa de Custos por Camada (FinOps)

### A. Inteligência Artificial (Visão Computacional — Gemini 2.5 Flash)
* **Otimização aplicada:** Compressão client-side para `1024px` (JPEG 80%), consumindo ~258 tokens de imagem + ~150 tokens de prompt de sistema = **~410 tokens de entrada** e **~90 tokens de saída (JSON)** por etiqueta.
* **Custo unitário estimado:** ~$0.00008 USD por etiqueta processada.
* **Custo mensal (2.400 etiquetas):** **~$0.19 USD/mês** (menos de R$ 1,20 por condomínio/mês).

### B. Notificações (Web Push API / VAPID)
* **Arquitetura:** Uso direto do protocolo padrão **Web Push (W3C)** com chaves VAPID próprias + Service Worker no PWA.
* **Custo de disparo:** **$0.00 USD** (custo zero por mensagem, diferentemente de gateways de SMS ou serviços proprietários de mensageria que cobram por conversa/disparo).

### C. Infraestrutura Base (Modelo SaaS Multi-tenant ou Instância Dedicada)
* **Compute + DB + Broker:** Um único nó VPS/Container (`2 vCPU, 4 GB RAM`) rodando Next.js + Core API + PostgreSQL + Redis + RabbitMQ suporta confortavelmente até **15 condomínios simultâneos** (~36.000 encomendas/mês) com custo fixo estimado entre **$15 e $25 USD/mês**.

| Item de Custo | Volume Mensal (1 Condomínio) | Custo Estimado (USD) | Custo Estimado (BRL) |
| :--- | :--- | :---: | :---: |
| **IA Multimodal (Extração Etiquetas)** | 2.400 scans | $0.19 | ~R$ 1,10 |
| **Push Notifications (Web Push)** | 3.600 disparos (média 1,5 disp./apto) | $0.00 | R$ 0,00 |
| **Infraestrutura Rateada (1/15 do servidor)** | 24/7 | $1.50 | ~R$ 8,70 |
| **Custo Operacional Total por Condomínio** | **2.400 encomendas/mês** | **~$1.69 / mês** | **~R$ 9,80 / mês** |

> **Conclusão de Negócio:** O custo marginal por encomenda processada com IA é inferior a **R$ 0,005 (meio centavo)**, garantindo margem bruta superior a 90% mesmo em planos SaaS econômicos.

---

## 3. Metas de SLA & Observabilidade

| Fluxo Crítico | Métrica | Meta (SLO) | Estratégia de Mitigação / Alerta |
| :--- | :--- | :---: | :--- |
| **Check-in Manual** | Latência API (P95) | `< 200 ms` | Pool de conexões otimizado + publicação assíncrona na fila |
| **Smart Check-in (IA)** | Latência Total (P95) | `< 2.500 ms` | Resize no cliente (1024px) + timeout rígido de 4s com fallback manual |
| **Entrega de Push** | Tempo entre Check-in e Push (P95) | `< 5.000 ms` | Workers concorrentes no RabbitMQ com prefetch calibrado |
| **Check-out (Retirada)** | Latência API (P99) | `< 150 ms` | Índice parcial no PostgreSQL + validação rápida no Redis |
| **Disponibilidade Geral** | Uptime Operacional | `99.9%` | Healthchecks automáticos (`/health`) + restart policy no Docker |
