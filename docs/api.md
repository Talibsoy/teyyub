# API Endpoint-lər

Base URL: `https://www.natourefly.com`

---

## GET /api/health

Sistem sağlamlığını yoxlayır.

**Response:**
```json
{
  "status": "ok",
  "supabase": "connected",
  "redis": "connected",
  "timestamp": "2026-03-27T10:00:00.000Z"
}
```

---

## POST /api/webhook

Facebook Messenger və Instagram DM mesajlarını qəbul edir.

**Meta tərəfindən çağrılır** — manual çağırılmır.

**Dəstəklənən event-lər:**
- `message.text` — mətn mesajı
- `message.attachments` — şəkil, audio, video, fayl
- `postback` — Get Started düyməsi

**Daxili məntiq:**
1. Rate limit yoxlanılır (20 msg/dəq)
2. Media varsa Gemini ilə analiz edilir
3. Claude AI cavab yaradır (RAG ilə tur konteksti)
4. Cavab göndərilir
5. Lead Supabase-ə, Google Sheets-ə yazılır
6. Telegram bildirişi göndərilir

---

## POST /api/whatsapp

WhatsApp Cloud API mesajlarını qəbul edir.

**Meta tərəfindən çağrılır** — manual çağırılmır.

**Dəstəklənən mesaj tipləri:**
- `text`, `image`, `video`, `audio`, `voice`, `document`, `sticker`

---

## POST /api/crm/send-message

CRM-dən WhatsApp mesajı göndərir.

**Request:**
```json
{
  "to": "+994501234567",
  "message": "Salam, rezervasiyanız təsdiqləndi!"
}
```

**Response:**
```json
{ "success": true }
```

---

## POST /api/crm/send-email

Rezervasiya təsdiqi və ya ödəniş qəbzi göndərir.

**Request:**
```json
{
  "type": "booking_confirm",
  "bookingId": "uuid"
}
```

`type` dəyərləri: `booking_confirm` | `payment_receipt`

---

## GET /api/crm/invoice

PDF invoice yaradır və endirir.

**Query parametr:**
```
GET /api/crm/invoice?bookingId=uuid
```

**Response:** `application/pdf` — fayl birbaşa endirilir.

---

## POST /api/crm/invite

Yeni işçini email ilə sistemə dəvət edir.

**Request:**
```json
{
  "email": "worker@example.com",
  "name": "Əli Həsənov",
  "role": "agent"
}
```

`role` dəyərləri: `admin` | `manager` | `agent`

**Response:**
```json
{ "success": true }
```

---

## Webhook Quraşdırma

### Facebook / Instagram
1. `developers.facebook.com` → App → Messenger API Settings
2. Callback URL: `https://www.natourefly.com/api/webhook`
3. Verify Token: `flynatoure2024`
4. Subscribe: `messages`, `messaging_postbacks`

### WhatsApp
1. `developers.facebook.com` → App → WhatsApp → Configuration
2. Callback URL: `https://www.natourefly.com/api/whatsapp`
3. Verify Token: `flynatoure2024`
4. Subscribe: `messages`
