<!-- Product Requirements Document -->
# PRD - Sistema Inteligente de Gestão e Aviso de Encomendas (`CHEGOU.AI`)

| Metadado | Detalhe |
| :--- | :--- |
| **Status** | Aprovado para Arquitetura (v1.0) |
| **Autor** | Eros Mariano |
| **Última Atualização** | Novembro/2026 |
| **Stack Alvo** | Next.js (PWA/BFF), Back-end Core, PostgreSQL, Filas Assíncronas, Multimodal Vision AI |

---

## 1. Visão Geral & Problema de Negócio

Com o crescimento contínuo do e-commerce, portarias de condomínios residenciais e comerciais tornaram-se gargalos logísticos. O processo tradicional - baseado em cadernos físicos, planilhas locais ou digitação manual lenta - gera quatro dores críticas:

1. **Filas na Portaria:** Em horários de pico (entregas em lote de transportadoras), o registro manual leva de 45 a 90 segundos por pacote, travando o fluxo de entrada e saída.
2. **Falha na Comunicação:** Moradores demoram para saber que têm encomendas aguardando, superlotando a sala de pacotes.
3. **Risco de Extravio e Fraude:** Entregas feitas sem validação criptográfica/única resultam em pacotes entregues ao vizinho errado ou sem comprovação auditável de quem retirou.
4. **Erros de Leitura:** Etiquetas amassadas, molhadas ou com nomes abreviados causam falhas na identificação da unidade.

### Proposta de Valor
O **`CHEGOU.AI`** automatiza o check-in de encomendas via **Visão Computacional (Extração Estruturada de Etiquetas)**, dispara alertas multicanal assíncronos em tempo real e garante uma **cadeia de custódia auditável** por meio de validação via QR Code / PIN único na retirada.

---

## 2. Personas & Job to be Done (JTBD)

| Persona | Contexto de Uso | Job to be Done (JTBD) |
| :--- | :--- | :--- |
| **Carlos (Porteiro / Zelador)** | Opera em pé, sob pressão, usando tablet ou celular da portaria durante entregas em lote. | *"Quando chega uma van com 20 caixas, quero registrar cada pacote apenas apontando a câmera para a etiqueta, para liberar o entregador rápido sem digitar dados."* |
| **Mariana (Moradora)** | Recebe alertas no celular enquanto trabalha ou está fora de casa. | *"Quando uma encomenda chega para mim, quero ser avisada imediatamente no WhatsApp/Push e ter um código rápido para retirar na portaria sem burocracia."* |
| **Roberto (Síndico / Admin)** | Gerencia a operação do condomínio e resolve disputas de pacotes perdidos. | *"Quando um morador alegar que não recebeu um pacote, quero consultar uma trilha de auditoria imutável mostrando quem recebeu, quando notificou e quem validou a retirada."* |

---

## 3. Escopo do Produto: MVP (v1.0) vs. Roadmap Futuro

### Escopo MVP (Versão 1.0)
* **Gestão de Unidades e Moradores:** Cadastro de blocos, apartamentos e moradores vinculados (com canal preferencial de contato).
* **Smart Check-in com IA:** Captura de foto da etiqueta com extração automática de destinatário, bloco/apartamento, transportadora e código de rastreio (com fallback manual imediato).
* **Geração de Token de Retirada:** Criação de PIN numérico de 6 dígitos + QR Code único por encomenda/lote.
* **Notificação Assíncrona:** Envio automático de alerta via fila de mensageria (WhatsApp / E-mail / Push) com política de retentativa.
* **Check-out Validado (Idempotente):** Baixa da encomenda mediante leitura do QR Code ou digitação do PIN, bloqueando baixas duplicadas.
* **Trilha de Auditoria (Audit Log):** Histórico completo de eventos (`RECEIVED`, `NOTIFIED`, `DELIVERED`, `CANCELLED`).

### Fora de Escopo no MVP (Roadmap v2.0+)
* Integração física com armários inteligentes (*Smart Lockers*).
* Assinatura biométrica facial na retirada.
* Módulo de controle de acesso de visitantes e prestadores de serviço.
* Lembretes automáticos escalonados para pacotes parados há mais de 5 dias.

---

## 4. Requisitos Funcionais (RF) & Não-Funcionais (RNF)

### Requisitos Funcionais
* **RF01:** O sistema deve permitir o cadastro de unidades (Bloco + Número) e múltiplos moradores por unidade.
* **RF02:** O operador da portaria deve conseguir registrar uma encomenda via foto da etiqueta (OCR/IA) ou preenchimento manual.
* **RF03:** Caso o score de confiança da extração de IA seja inferior a `0.80`, a interface deve destacar os campos incertos para revisão humana antes de salvar.
* **RF04:** Ao concluir o check-in, o sistema deve gerar um código de retirada único e disparar uma notificação assíncrona ao(s) morador(es) da unidade.
* **RF05:** O check-out só deve ser concluído mediante apresentação de PIN/QR Code válido vinculado à encomenda ativa.

### Requisitos Não-Funcionais
* **RNF01 (Latência de IA):** A extração de dados da etiqueta via IA deve responder em **menos de 2,5 segundos** (P95).
* **RNF02 (Resiliência):** Falhas ou lentidão em provedores externos (WhatsApp/Push) não podem bloquear ou causar erro na tela de check-in do porteiro.
* **RNF03 (Consistência & Idempotência):** Operações de entrega devem garantir consistência forte (ACID), impedindo que duas requisições simultâneas deem baixa duplicada no mesmo pacote.
* **RNF04 (Privacidade / LGPD):** Dados sensíveis (telefone completo, CPF) não devem ser expostos em texto claro na tela pública da portaria.

---

## 5. Métricas de Sucesso (KPIs de Produto & Engenharia)

| Categoria | Métrica | Meta Alvo (MVP) | Como Medir |
| :--- | :--- | :--- | :--- |
| **Eficiência Operacional** | Tempo médio de Check-in | Menor que 10 segundos por pacote | Timestamp entre abertura da câmera e persistência no banco |
| **Precisão de IA** | Taxa de acerto sem edição manual | Maior que 85% das etiquetas legíveis | Razão entre check-ins confirmados sem alteração vs. total via IA |
| **Confiabilidade** | Latência de Notificação (E2E) | Menor que 5 segundos após check-in | Diferença entre `created_at` do pacote e `sent_at` do worker |
| **Segurança** | Taxa de entrega incorreta | 0% | Auditoria de pacotes com divergência de titularidade |