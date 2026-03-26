# Environment Variables — Quraşdırma Təlimatı

`.env.local` faylı yaradın və aşağıdakı dəyişənləri doldurun.

---

## Anthropic (AI)

```env
ANTHROPIC_API_KEY=sk-ant-...
```

**Hardan alınır:** https://console.anthropic.com → API Keys

---

## Supabase (Database + Auth)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Hardan alınır:** https://supabase.com → Project → Settings → API

> DB sxemini qurmaq üçün: `docs/schema.sql` faylını Supabase SQL Editor-də icra edin.

---

## Facebook / Instagram

```env
FB_PAGE_TOKEN=EAH...          # Page Access Token
FB_APP_ID=344...              # App ID
FB_APP_SECRET=26b...          # App Secret
FB_PAGE_ID=393...             # Facebook Səhifə ID
FB_VERIFY_TOKEN=flynatoure2024
```

**Hardan alınır:** https://developers.facebook.com → App → Messenger API Settings → Generate Token

**Webhook URL:** `https://yourdomain.com/api/webhook`

---

## WhatsApp Cloud API

```env
WA_ACCESS_TOKEN=EAH...
WA_PHONE_NUMBER_ID=123...
WA_APP_ID=344...
WA_BUSINESS_ACCOUNT_ID=456...
```

**Hardan alınır:** https://developers.facebook.com → App → WhatsApp → API Setup

**Webhook URL:** `https://yourdomain.com/api/whatsapp`

---

## Google Gemini (Media AI)

```env
GEMINI_API_KEY=AIza...
```

**Hardan alınır:** https://aistudio.google.com/app/apikey

---

## Upstash Redis (Conversation Memory)

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

**Hardan alınır:** https://console.upstash.com → Redis → REST API

---

## Resend (Email)

```env
RESEND_API_KEY=re_...
```

**Hardan alınır:** https://resend.com → API Keys

---

## Telegram (Bildiriş)

```env
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=7294077950
```

**Bot yaratmaq:** Telegram-da @BotFather → /newbot

**Chat ID almaq:** @userinfobot-a mesaj göndərin

---

## Google Sheets (Yedəkləmə)

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1xxx...
```

**Hardan alınır:** https://console.cloud.google.com → Service Accounts → Keys

> Sheet-i service account email-inə **Editor** kimi paylaşın.
> Sheet-də `Leads` adlı tab olmalıdır (A:I sütunları).

---

## Vercel-ə əlavə etmək

```bash
npx vercel env add VARIABLE_NAME production
```

və ya Vercel Dashboard → Project → Settings → Environment Variables
