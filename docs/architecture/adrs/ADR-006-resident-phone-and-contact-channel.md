# ADR-006: Inclusão do Telefone do Morador como Canal Operacional e Regras de Privacidade (LGPD)

* **Status:** Aceito
* **Data:** Novembro/2026
* **Decisores:** Arquitetura de Software & Segurança / LGPD

## Contexto
O canal primário de notificação do **Chegou.AI** é o **Web Push Notifications** (VAPID / Service Worker), implementado conforme a ADR-003. Contudo, na rotina condominial real ocorrem cenários críticos onde o Web Push é insuficiente ou indisponível:
1. Morador recém-chegado ou idoso que ainda não autorizou a subscrição do Web Push no navegador móvel.
2. Encomendas perecíveis, refrigeradas, medicamentos ou de grandes volumes ocupando espaço físico na portaria que exigem contato imediato.
3. Necessidade de fallback futuro de mensageria via WhatsApp (Meta Cloud API) ou SMS quando houver falha de entrega da notificação push (`NOTIFICATION_FAILED`).

A ausência de um número de telefone impedia a comunicação direta da portaria com a unidade em contingências operacionais.

## Decisão
1. **Adição do Campo no Modelo de Domínio e Banco:**
   - Adicionar a coluna `phone VARCHAR(20)` na tabela `residents` do PostgreSQL e no schema Zod (`ResidentSchema` e DTOs de cadastro/atualização).
   - O campo é opcional no schema base para compatibilidade, porém recomendado no formulário de cadastro de moradores sob o formato `(XX) 9XXXX-XXXX` ou padrão internacional E.164 (`+55XXXXXXXXXXX`).

2. **Privacidade e Proteção de Dados (LGPD - Lei nº 13.709/2018):**
   - **Minimização e Finalidade Estrita (Art. 6º):** O número é coletado unicamente para aviso de encomendas e emergências de entrega condominial. Não há compartilhamento com transportadoras, entregadores externos ou terceiros.
   - **Mascaramento Obrigatório na UI da Portaria:** Em listagens e visualizações operacionais gerais, o telefone deve ser exibido obrigatoriamente de forma mascarada (ex.: `(11) 9****-4321`), prevenindo captura indevida de dados por transeuntes na portaria.
   - **Edição Restrita:** Apenas o perfil `ADMIN` (Síndico) e o próprio `RESIDENT` (em sua conta) possuem permissão para visualizar e atualizar o número sem máscara nos formulários.

## Consequências
* **Positivas:**
  - Viabiliza comunicação humana em contingências e suporte a canais adicionais de notificação (WhatsApp / SMS fallback).
  - Reduz o tempo de permanência de pacotes críticos na portaria.
  - Alinhamento total com as exigências de privacidade da LGPD através de mascaramento de tela.
* **Negativas:**
  - Introduz a necessidade de validação e formatação de máscara telefônica nos formulários front-end e sanitização no backend.

