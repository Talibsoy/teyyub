# Flynatoure — AI-Powered Tourism CRM

**flynatoure.com** — Bakı əsaslı turizm şirkəti üçün tam avtomatlaşdırılmış CRM və AI satış sistemi.

## Xülasə

- **AI Chatbot** — Claude Sonnet 4.6 ilə Azərbaycanca danışan satış meneceri
- **Çox kanallı mesajlaşma** — Facebook Messenger, Instagram DM, WhatsApp
- **CRM** — 9 modul: leadlər, müştərilər, rezervasiyalar, ödənişlər, turlar, işçilər, workflowlar, fəaliyyət loqu
- **RAG** — Supabase-dəki aktiv turları AI agentinə real vaxtda ötürür
- **Media analizi** — Gemini 2.0 Flash ilə audio transkripti, şəkil/video təsviri

## Tech Stack

| Sahə | Texnologiya |
|------|-------------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| AI | Anthropic Claude Sonnet 4.6 |
| Media AI | Google Gemini 2.0 Flash |
| Mesajlaşma | WhatsApp Cloud API, Meta Webhook (FB/IG) |
| Email | Resend |
| Cache | Upstash Redis |
| PDF | @react-pdf/renderer |
| Deploy | Vercel |

## Quraşdırma

```bash
git clone https://github.com/Talibsoy/teyyub.git
cd teyyub
npm install
cp .env.example .env.local   # env dəyişənlərini doldurun
npm run dev
```

Env dəyişənlərinin tam siyahısı: [`docs/env-setup.md`](docs/env-setup.md)

## Canlı Sistem

- **Sayt:** https://www.natourefly.com
- **CRM:** https://www.natourefly.com/crm
- **Health:** https://www.natourefly.com/api/health

## CRM Modulları

| Modul | URL | Təsvir |
|-------|-----|--------|
| Dashboard | `/crm` | KPI-lər, pie chart-lar, son leadlər |
| Leadlər | `/crm/leads` | Gələn müştərilər, status idarəsi |
| Müştərilər | `/crm/customers` | Məlumatlar, pasport, qeydlər |
| Rezervasiyalar | `/crm/bookings` | Rezervasiya, PDF invoice, email |
| Ödənişlər | `/crm/payments` | Ödəniş izlənməsi |
| Turlar | `/crm/tours` | Tur kataloqu idarəsi |
| İşçilər | `/crm/staff` | Komanda, rollar, dəvət |
| Workflowlar | `/crm/workflows` | Avtomatik trigger/action qaydaları |
| Fəaliyyət loqu | `/crm/activity` | Audit loqları |

## API Endpoint-lər

Tam sənədləşmə: [`docs/api.md`](docs/api.md)

## Database Sxemi

[`docs/schema.sql`](docs/schema.sql)
