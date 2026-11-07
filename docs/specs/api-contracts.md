# Contratos de API REST & Estratégia de Idempotência (`Chegou.AI`)

Todas as rotas seguem o padrão RESTful sobre HTTPS com payloads em JSON (`application/json`).

---

## 1. Padrão de Erros (RFC 7807 - Problem Details)

Todas as respostas de erro retornam estrutura padronizada para facilitar o tratamento no front-end:

```json
{
  "type": "https://chegou.ai/errors/package-already-delivered",
  "title": "Encomenda já retirada",
  "status": 409,
  "detail": "Esta encomenda já teve baixa registrada em 07/11/2026 às 14:32.",
  "instance": "/api/v1/packages/checkout"
}
```

---

## 2. Endpoints Principais

### 2.1. Extração Inteligente de Etiqueta (Camada BFF / IA)
Recebe a foto capturada pelo tablet da portaria e retorna os dados estruturados antes da confirmação final.

* **Endpoint:** `POST /api/bff/packages/extract-label`
* **Auth:** `Bearer Token` (`PORTER` ou `ADMIN`)
* **Request (`multipart/form-data`):**
  * `image`: Arquivo JPEG/WebP (comprimido no cliente para max 1024px)

**Response (`200 OK`):**
```json
{
  "extracted": {
    "recipientName": "Mariana Costa Silva",
    "unitBlock": "B",
    "unitNumber": "402",
    "trackingCode": "BR26984120984ML",
    "carrier": "Mercado Livre"
  },
  "matchedUnitId": "8f14e45f-ea9a-4c31-9b2a-112233445566",
  "confidenceScore": 0.94,
  "requiresReview": false,
  "processingTimeMs": 1180
}
```

---

### 2.2. Registrar Encomenda (Check-in)
Persiste a encomenda, gera o PIN/QR Code e publica o evento na fila para disparo da Web Push Notification.

* **Endpoint:** `POST /api/v1/packages`
* **Auth:** `Bearer Token` (`PORTER` ou `ADMIN`)
* **Headers:** `Idempotency-Key: <uuid-gerado-no-cliente>` (evita duplicidade se o porteiro clicar duas vezes no botão salvar em rede lenta)

**Request Body:**
```json
{
  "unitId": "8f14e45f-ea9a-4c31-9b2a-112233445566",
  "recipientNameRaw": "Mariana Costa Silva",
  "trackingCode": "BR26984120984ML",
  "carrier": "Mercado Livre",
  "aiConfidenceScore": 0.94
}
```

**Response (`201 Created`):**
```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "status": "RECEIVED",
  "unit": {
    "block": "B",
    "number": "402"
  },
  "pickupPin": "482910",
  "pickupQrToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "receivedAt": "2026-11-07T15:10:00Z"
}
```

---

### 2.3. Validar e Dar Baixa na Encomenda (Check-out)
Valida o PIN de 6 dígitos ou o Token do QR Code apresentado pelo morador e conclui a entrega de forma atômica.

* **Endpoint:** `POST /api/v1/packages/checkout`
* **Auth:** `Bearer Token` (`PORTER` ou `ADMIN`)

**Request Body:**
```json
{
  "code": "482910",
  "codeType": "PIN",
  "residentId": "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f"
}
```

**Response (`200 OK`):**
```json
{
  "packageId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "status": "DELIVERED",
  "unit": "Bloco B - 402",
  "recipientName": "Mariana Costa Silva",
  "deliveredAt": "2026-11-07T18:45:12Z"
}
```

**Códigos de Erro Específicos:**
* `404 Not Found`: PIN ou QR Token inválido/inexistente.
* `409 Conflict`: Encomenda já entregue (`DELIVERED`) ou cancelada (`CANCELLED`).

---

### 2.4. Registrar Dispositivo para Web Push (Portal do Morador)
Salva a inscrição `PushSubscription` gerada pelo Service Worker do navegador do morador.

* **Endpoint:** `POST /api/v1/residents/me/push-subscriptions`
* **Auth:** `Bearer Token` (`RESIDENT`)

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/eXampleToken...",
  "keys": {
    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM=",
    "auth": "tBHItJI5svbpez7KI4CCXg=="
  },
  "userAgent": "Mozilla/5.0 (Linux; Android 14) Chrome/130.0"
}
```

**Response (`201 Created`):**
```json
{
  "subscriptionId": "99887766-5544-3322-1100-ffeeddccbbaa",
  "active": true
}
```

---

### 2.5. Listar Encomendas Pendentes do Morador
Utilizado quando o morador toca na Push Notification para abrir o QR Code e o PIN de retirada.

* **Endpoint:** `GET /api/v1/residents/me/packages?status=PENDING`
* **Auth:** `Bearer Token` (`RESIDENT`)

**Response (`200 OK`):**
```json
{
  "items": [
    {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "carrier": "Mercado Livre",
      "trackingCode": "BR26984120984ML",
      "status": "NOTIFIED",
      "pickupPin": "482910",
      "pickupQrToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "receivedAt": "2026-11-07T15:10:00Z"
    }
  ]
}
```

---

## 3. Estratégia de Idempotência & Concorrência

* **No Check-in (`Idempotency-Key`):** O cliente gera um UUID antes de enviar o `POST /packages`. O Core API verifica no Redis (`SETNX idempotency:<key> <response> EX 86400`). Se a requisição for reenviada por instabilidade do Wi-Fi da portaria, o servidor retorna o `201 Created` original sem criar pacote duplicado nem disparar duas Push Notifications.
* **No Check-out (ACID + Version Check):** A atualização de status verifica `status IN ('RECEIVED', 'NOTIFIED', 'NOTIFICATION_FAILED')` dentro de uma transação relacional, garantindo que um mesmo PIN/QR Code nunca valide duas retiradas.
