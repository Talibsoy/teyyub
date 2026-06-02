# NatoureFly — Sistem Sənədləşməsi (Documentation)

**NatoureFly (natourefly.com)** — Azərbaycan dilində fəaliyyət göstərən, süni intellekt əsaslı fərdiləşdirilmiş səyahət sifarişi platformasıdır. Müştərilərin "Səyahət DNT-sini" analiz edərək onlara ən uyğun turları, uçuşları və otelləri tapır və vahid marşrut təqdim edir. Bütün müştəri yazışmalarını "Nigar" adlı AI satış agenti idarə edir.

---

## 🎯 Əsas Missiya və Konsept

1. **Səyahət DNT-sinin Analizi:** Müştərinin büdcəsi, maraqları və üstünlükləri əsasında holistik (bütöv) marşrutların yaradılması.
2. **AI Satış Agenti (Nigar):** WhatsApp və Instagram vasitəsilə daxil olan müraciətlərə real vaxt rejimində cavab verir, uçuş və otel axtarır, sifarişləri rəsmiləşdirir.
3. **Avtomatlaşdırılmış CRM:** Leads, bookings və ödənişlərin vahid idarəetmə panelindən izlənilməsi.

---

## 🧩 Texnologiya Stakı (Tech Stack)

* **Frontend/Backend:** Next.js 16 (App Router)
* **Verilənlər Bazası və Auth:** Supabase (PostgreSQL + Supabase Auth)
* **Keşləmə və Yaddaş:** Upstash Redis (Söhbət tarixçəsi, limitlər və valyuta məzənnələri)
* **Süni İntellekt (LLM):** Anthropic Claude API (Satış agenti və niyyət analizi)
* **Embedding-lər:** Voyage AI (pgvector vasitəsilə turların semantik analizi üçün)
* **Hostinq:** Vercel (Cron jobs və serverless funksiyalar)

---

## 🔌 Xarici İnteqrasiyalar və API-lər

| Servis | Məqsəd | Kitabxana / Fayl |
|--------|---------|------------------|
| **Duffel API** | Real vaxt rejimində uçuşların axtarışı və rezervasiyası | `lib/duffel.ts` |
| **Booking.com (RapidAPI)** | Müştəri üçün otel axtarışı | `lib/hotels.ts` |
| **RateHawk (WorldOTA)** | Süni intellektlə qiymət analizi və otel bronu | `lib/ratehawk.ts` |
| **Epoint.az** | AZN ilə yerli ödəniş şlüzü | `lib/epoint.ts` |
| **Telegram API** | CRM bildirişləri və operatora yönləndirmə | `lib/telegram.ts` |
| **WhatsApp / Instagram** | Daxil olan müştəri mesajlarının idarə edilməsi | `/api/whatsapp`, `/api/webhook` |
| **Resend** | E-poçt bildirişləri və invoice-lar | `lib/email.ts`, `/api/contact` |

---

## 🔄 Əsas Data Axınları (Key Data Flows)

### 1. Müştəri Söhbət Axını (Chat Flow)
```
Müştəri (WhatsApp/Instagram) ──> Webhook (/api/whatsapp və ya /api/webhook)
                                 │
                                 ▼
                     Redis Söhbət Tarixçəsi (lib/conversation-store)
                                 │
                                 ▼
                     AI Agent (lib/ai-agent - Claude Loop, maks 5 raund)
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
Uçuş Axtarışı (Duffel)     Otel Axtarışı (RapidAPI)     Turlar (Supabase)
     │                           │                           │
     └───────────────────────────┼───────────────────────────┘
                                 ▼
                     Cavabın Müştəriyə Göndərilməsi
```
*Əgər söhbətdə çətinlik yaranarsa və ya müştəri operator tələb edərsə, `OPERATOR_HANDOFF` işə düşür və Telegram vasitəsilə operatora bildiriş gedir.*

### 2. Rezervasiya və Ödəniş Axını (Booking & Payment)
1. Müştəri `/rezervasiya` səhifəsində formu doldurur `──>` `/api/bookings` API-na POST sorğusu gedir və Supabase-də qeyd yaradılır.
2. Ödəniş yaratmaq üçün `/api/payment/create` çağrılır. **Təhlükəsizlik üçün ödəniş məbləği heç vaxt müştəridən (client) götürülmür, birbaşa verilənlər bazasından (DB) oxunur.**
3. Epoint.az ödəniş səhifəsinə yönləndirmə baş verir.
4. Ödəniş tamamlandıqdan sonra Epoint `/api/payment/webhook` vasitəsilə statusu təsdiqləyir.
5. Uğurlu ödəniş zamanı loyallıq xalları qazanılır (Hər 100 AZN = 1 Xal), uğursuz və ya geri qaytarılan ödənişlərdə isə xallar silinir.

---

## 📊 Biznes və Qiymət Qaydaları

* **Valyuta:** Bütün qiymətlər mütləq şəkildə **AZN (₼)** ilə göstərilməlidir.
* **Uçuş Komissiyası:** Duffel-dən gələn uçuş qiymətlərinə **17% komissiya** əlavə olunur (`COMMISSION = 1.17`).
  * *Qeyd: Duffel-dən qayıdan uçuş qiyməti bütün sərnişinlər üçün ümumi qiymətdir. Onu yenidən sərnişin sayına vurmaq olmaz.*
* **Otel Komissiyası:** Booking.com qiymətlərinə **17%** (`MARKUP = 1.17`), RateHawk qiymətlərinə isə **15% markup** əlavə olunur.
* **Məzənnə Keşlənməsi:** Azərbaycan Mərkəzi Bankının (CBAR) valyuta məzənnələri Redis-də `cbar:azn_rates` açarı ilə **1 saatlıq** keşlənir.
* **Loyallıq Proqramı:** Hər ödənilən 100 AZN üçün müştəri 1 xal qazanır. Qazanılan xallar pulsuz transfer və ya otel səviyyəsinin qaldırılması (upgrade) üçün istifadə edilə bilər.

---

## ⏰ Gündəlik Cron Tapşırıqları (Daily Cron Jobs)

Vercel üzərində hər gün icra edilən tapşırıqlar (bütün vaxtlar UTC ilə):
* **07:00** — `/api/cron/generate-tours` — Duffel və RapidAPI məlumatları əsasında avtomatik turların yaradılması.
* **08:00** — `/api/cron/hotels` — RateHawk vasitəsilə otel qiymətlərinin Supabase-lə sinxronizasiyası.
* **09:00** — `/api/cron/embed-tours` — Yeni turların Voyage AI vasitəsilə embedding-lərinin yaradılması (semantik axtarış üçün).
* **10:00** — `/api/cron/price-analysis` — Qiymət analizi və hesabatının hazırlanması.
* **06:00** — `/api/cron/travel-post` — Sosial şəbəkələr üçün AI tərəfindən kontentin hazırlanması.

---

## 🔐 Təhlükəsizlik Qaydaları

1. **Admin/Staff Girişi:** `/api/crm/*` marşrutları admin rolu olan istifadəçilər üçün middleware tərəfindən qorunur.
2. **Həssas Məlumatlar:** Facebook/Instagram tokenləri verilənlər bazasında `INSTAGRAM_TOKEN_ENCRYPTION_KEY` istifadə edilməklə AES-256-GCM alqoritmi ilə şifrələnmiş şəkildə saxlanılır.
3. **Sorğu Limitləri (Rate Limiting):** Uçuş axtarışları və digər ağır API-lər üçün Redis əsaslı limitlər (`lib/rate-limit.ts`) mövcuddur (hər istifadəçi üçün 60 saniyədə maks 10 sorğu).
4. **Zaman Hücumlarından Qorunma:** Admin parollarının və cron secret-lərinin yoxlanılmasında `crypto` kitabxanasının `timingSafeEqual` funksiyasından istifadə olunur.
