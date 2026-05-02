# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note:** This is Next.js 16 with breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before writing routing or data-fetching code.

---

## Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run typecheck  # TypeScript check (tsc --noEmit) — run before committing
npm run lint       # ESLint
```

No test suite exists. Validate with `typecheck` + manual testing.

---

## Architecture Overview

**Stack:** Next.js 16 App Router · Supabase (Postgres + Auth) · Upstash Redis · Anthropic Claude · Vercel (deploy + cron)

**Domain:** Azerbaijani-language travel booking platform (natourefly.com). AI sales agent named "Nigar" drives all chat interactions.

### External Integrations

| Service | Purpose | Lib |
|---------|---------|-----|
| Duffel API | Real-time flight search + booking | `lib/duffel.ts` |
| Booking.com (RapidAPI) | Hotel search (customer-facing) | `lib/hotels.ts` |
| RateHawk (WorldOTA) | Hotel search (AI price analysis) | `lib/ratehawk.ts` |
| Epoint.az | Payment gateway (AZN) | `lib/epoint.ts` |
| Anthropic Claude | AI sales agent + intent extraction | `lib/ai-agent.ts` |
| Upstash Redis | Rate limiting, conversation history, CBAR rate cache | throughout |
| Supabase | All persistent data + auth | `lib/supabase.ts` |
| Telegram | CRM alerts + operator handoff | `lib/telegram.ts` |
| WhatsApp / Instagram | Inbound customer messages | `app/api/whatsapp/`, `app/api/webhook/` |
| Voyage AI | Text embeddings for pgvector tour ranking | `lib/embeddings.ts` |

### Key Data Flows

**Customer chat flow:**
```
WhatsApp/Instagram → /api/whatsapp or /api/webhook
  → lib/conversation-store (Redis history)
  → lib/ai-agent (Claude agentic loop, max 5 rounds)
  → tools: search_flights (Duffel), search_hotels (RapidAPI), check_tour_availability (Supabase)
  → OPERATOR_HANDOFF → lib/telegram (notify staff)
```

**Booking + payment flow:**
```
/rezervasiya page → POST /api/bookings (Supabase insert)
  → POST /api/payment/create → lib/epoint (createEpointOrder)
  → Redirect to Epoint gateway
  → Epoint POST /api/payment/webhook (verifyEpointWebhook)
  → Update bookings.status + loyalty points (earn on paid, deduct on refunded)
```

**Daily cron jobs** (vercel.json, all UTC):
- `07:00` — `/api/cron/generate-tours` — Duffel + RapidAPI → auto-create tours in Supabase
- `08:00` — `/api/cron/hotels` — RateHawk → sync hotel prices to Supabase
- `09:00` — `/api/cron/embed-tours` — Voyage AI → embed tours for pgvector
- `10:00` — `/api/cron/price-analysis` — RateHawk + Duffel → price report
- `06:00` — `/api/cron/travel-post` — AI-generated social content

---

## Critical Patterns

### Auth

Two auth patterns coexist — use the right one per context:

**API routes (Bearer token):**
```typescript
import { requireAuth, isAuthError } from "@/lib/require-auth";
const auth = await requireAuth(req);
if (isAuthError(auth)) return auth;  // auth IS the NextResponse error
// auth.userId is now available
```

**Staff/Admin routes:** Use `requireStaff(req)` — checks JWT + `staff` table role.

**CRM routes:** Protected by `middleware.ts` — checks Supabase session + `app_metadata.role === "admin"`. No additional auth needed inside CRM handlers.

**Admin service calls:** Use `getSupabaseAdmin()` (service role key). Never import the module-level `supabaseAdmin` proxy in server code that runs at module eval time — use the function.

### Security Rules — Do Not Bypass

- `payment/create`: amount always fetched from DB (`bookings.total_price`), never from client body
- `payment_type` in booking/finish is hardcoded `"deposit"` — client cannot change payment type
- Admin secrets use `timingSafeEqual` from `crypto` (timing-attack protection)
- Rate limiting: `lib/rate-limit.ts` uses Redis + in-memory fallback (never `return true` bypass)
- Instagram tokens stored AES-256-GCM encrypted (`INSTAGRAM_TOKEN_ENCRYPTION_KEY`)

### Pricing Rules — Do Not Break

- All prices shown in AZN (`₼`)
- Flight commission: `COMMISSION = 1.17` (17%) in `lib/duffel.ts`
- Hotel markup: `MARKUP = 1.17` (17%) in `lib/hotels.ts`; RateHawk uses `1.15`
- **`flight.price_azn` from Duffel = total for ALL passengers.** Never multiply by passenger count again — this caused a 2x inflation bug.
- CBAR (Central Bank of AZ) exchange rates cached 1 hour in Redis key `cbar:azn_rates`
- Loyalty points: 100₼ = 1 xal (earn on paid, deduct on refunded)

### Time Zones

Duffel returns departure/arrival times in the **airport's local timezone** (ISO 8601 with offset, e.g. `+03:00` for Istanbul). Always convert explicitly:

```typescript
new Date(iso).toLocaleTimeString("az-AZ", {
  hour: "2-digit", minute: "2-digit",
  timeZone: "Asia/Baku"   // ← mandatory, Vercel runs UTC
})
```

Omitting `timeZone` silently shows wrong times on production (Vercel = UTC).

### Conversation History

`lib/conversation-store.ts` — Redis-backed, falls back to in-memory Map.

- History key pattern: `<platform>:<senderId>` (e.g. `WA:+994501234567`)
- `saveHistory()` truncates to last 8 messages — be careful with agentic loops (tool calls add messages fast)
- Meta TTL: 48h (`META_TTL`); history TTL: 30 days (`TTL`) — they are intentionally different

### AI Agent

`lib/ai-agent.ts` — `getAIResponse()` runs an agentic loop up to `MAX_ROUNDS=5`, `MAX_TOKENS=8000`.

- Tools defined in `ALL_TOOLS` array; last tool gets `cache_control: ephemeral` for prompt caching
- System prompt split: static part cached once per module lifecycle (`_cachedStaticFinal`), dynamic tours/CRM context injected per-request
- Tool results surfaced back as `role: "user"` messages with `type: "tool_result"`
- When `stop_reason !== "tool_use"` → final answer; if max rounds hit → returns `""` (empty)
- WhatsApp/webhook routes use `after()` from `next/server` — AI runs after 200 is returned to Meta

### Package Parsing (Chat Route)

`app/api/chat/route.ts` uses **brace-depth extraction** (not regex) to parse `FLIGHT_PACKAGE:{...}`, `TOUR_PACKAGE:{...}`, `HOTEL_PACKAGE:{...}` from AI text. Supports multiline JSON. See `extractJsonBlock()` and `removeJsonBlock()` functions.

### Hotels Dest ID Cache

`lib/hotels.ts` — `getDestId()` caches Booking.com destination IDs in Redis for 24h (`hotel_dest:<query>` key). This reduces RapidAPI rate limit consumption significantly.

### ETG/RateHawk Booking

`lib/ratehawk-booking.ts` — full booking flow:
1. `/search/hp/` → `h-` prefixed hash
2. `/hotel/prebook/` → `p-` prefixed hash (from `data.hotels[0].rates[0].book_hash`)
3. `/hotel/order/booking/finish/` → needs `rooms`, `payment_type`, `partner.partner_order_id`
4. `/hotel/order/booking/finish/status/` → poll every 5s, max controlled by `ETG_POLLING_MAX` env (default 18 = 90s)

---

## Route Map (abbreviated)

```
/api/flights/search   POST  requireAuth + Redis rate limit (10/60s per user)
/api/flights/book     POST  requireAuth → Duffel createOrder → Supabase insert
/api/hotels/search    POST  → lib/hotels (RapidAPI Booking.com, dest cached 24h)
/api/bookings         POST  Create tour booking record (public, customer form)
/api/booking/finish   POST  ETG/RateHawk hotel booking → status poll
/api/payment/create   POST  → Epoint createEpointOrder (amount from DB)
/api/payment/webhook  POST  verifyEpointWebhook → update booking + loyalty ±points
/api/payment/widget   POST  Apple/Google Pay widget URL
/api/chat             POST  Website chatbot (brace-depth package parsing)
/api/whatsapp         POST  Meta WhatsApp webhook (verify + after() async AI)
/api/webhook          POST  Facebook/Instagram webhook (Redis dedup + in-memory fallback)
/api/crm/*            —     requireStaff() guards, full CRM CRUD
/api/admin/knowledge  —     CRON_SECRET via Authorization Bearer (timingSafeEqual)
/api/cron/*           GET   Vercel cron, authenticated via GENERATE_TOURS_SECRET header
```

---

## Environment Variables (required)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
DUFFEL_API_KEY
RAPIDAPI_KEY
RATEHAWK_API_KEY + RATEHAWK_SECRET + RATEHAWK_SANDBOX (true/false)
EPOINT_PUBLIC_KEY + EPOINT_PRIVATE_KEY
UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_APP_URL             # https://www.natourefly.com
NEXT_PUBLIC_SITE_URL            # same as APP_URL
CRON_SECRET                     # admin/knowledge + seed endpoint auth
GENERATE_TOURS_SECRET           # cron endpoint auth header
FB_VERIFY_TOKEN                 # Meta webhook verification
FB_APP_SECRET                   # Facebook/Instagram webhook HMAC
WA_ACCESS_TOKEN + WA_PHONE_NUMBER_ID
TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
INSTAGRAM_TOKEN_ENCRYPTION_KEY  # 32-byte hex, AES-256-GCM for Instagram tokens
ETG_POLLING_MAX                 # optional, default 18 (18×5s=90s polling window)
VOYAGE_API_KEY                  # optional, for pgvector embeddings
```
