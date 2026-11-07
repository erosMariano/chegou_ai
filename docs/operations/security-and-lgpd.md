# Segurança da Informação, Controle de Acesso & LGPD (`Chegou.AI`)

Este documento detalha os controles técnicos de segurança aplicados ao ciclo de vida dos dados pessoais e operacionais no **Chegou.AI**, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).

---

## 1. Matriz de Controle de Acesso Baseado em Papéis (RBAC)

Cada perfil acessa estritamente os recursos necessários para sua função operacional:

| Recurso / Ação | `PORTER` (Porteiro) | `RESIDENT` (Morador) | `ADMIN` (Síndico) |
| :--- | :---: | :---: | :---: |
| Registrar encomenda (`POST /packages`) | ✅ | ❌ | ✅ |
| Extrair etiqueta via IA (`POST /bff/extract-label`) | ✅ | ❌ | ✅ |
| Validar retirada (`POST /packages/checkout`) | ✅ | ❌ | ✅ |
| Listar encomendas ativas da portaria | ✅ (dados mascarados) | ❌ | ✅ |
| Visualizar próprias encomendas e PIN/QR Code | ❌ | ✅ (apenas própria unidade) | ❌ |
| Gerenciar dispositivos Web Push (`push_subscriptions`) | ❌ | ✅ (apenas próprios dispositivos) | ❌ |
| Cadastrar/editar unidades e moradores | ❌ | ❌ | ✅ |
| Consultar trilha completa de auditoria (`package_events`) | ❌ | ❌ | ✅ |

---

## 2. Proteção de Tokens de Retirada (PIN & QR Code)

1. **Armazenamento Seguro do PIN:** O PIN numérico de 6 dígitos enviado na Push Notification **nunca é armazenado em texto claro** no banco de dados. O Core API persiste apenas o hash criptográfico (`Argon2id` ou `SHA-256 + salt` por encomenda) na coluna `pickup_pin_hash`.
2. **Prevenção de Força Bruta (Rate Limiting):** O endpoint `POST /packages/checkout` possui bloqueio progressivo no **Redis** (`5 tentativas falhas` em um intervalo de `5 minutos` por terminal/IP bloqueiam temporariamente novas tentativas e geram alerta de auditoria).
3. **Uso Único (Single-Use Token):** Assim que o check-out é concluído com sucesso (`status = DELIVERED`), o PIN e o `pickup_qr_token` são imediatamente invalidados. Tentativas posteriores de reuso retornam `409 Conflict`.

---

## 3. Privacidade by Design & Conformidade LGPD

* **Minimização de Dados:** O sistema coleta apenas o estritamente necessário para a entrega física e contato operacional (Nome, Unidade, E-mail, Telefone/WhatsApp e os 4 últimos dígitos do documento para desempate de homônimos). Não há coleta de CPF completo, RG ou biometria facial.
* **Descarte Imediato de Imagens:** As fotos das etiquetas capturadas na portaria trafegam exclusivamente em memória RAM (`Buffer`) durante a requisição ao provedor de IA e são descartadas imediatamente após a extração do JSON — nenhuma foto de pacote ou endereço é armazenada em disco ou object storage (S3).
* **Mascaramento de Dados na Portaria:** Na tela de consulta do porteiro, informações de contato dos moradores (como e-mail e telefone) são mascaradas (ex.: `ma****@gmail.com` e `(11) 9****-4321`), impedindo coleta indevida de dados pessoais conforme ADR-006.
* **Web Push Criptografado (VAPID):** Todo payload enviado aos navegadores/dispositivos utiliza criptografia ponta a ponta definida pela especificação Web Push (chaves `p256dh` e `auth`), e tokens expirados (`HTTP 410 Gone`) são removidos automaticamente do banco pelo worker.
