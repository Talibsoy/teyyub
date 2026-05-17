-- ============================================================
-- RLS FIX MIGRATION — Supabase Security Advisory
-- Run this in Supabase SQL Editor
-- Fixes: rls_disabled_in_public (05 May 2026)
-- ============================================================

-- ============================================================
-- 1. TRAVEL_POSTS — Blog məzmunu
-- ============================================================
alter table if exists travel_posts enable row level security;

drop policy if exists "public_read_travel_posts" on travel_posts;
drop policy if exists "service_write_travel_posts" on travel_posts;

create policy "public_read_travel_posts"
  on travel_posts for select
  using (true);

create policy "service_write_travel_posts"
  on travel_posts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 2. HOTELS — Otel kataloqu
-- ============================================================
alter table if exists hotels enable row level security;

drop policy if exists "public_read_hotels" on hotels;
drop policy if exists "service_write_hotels" on hotels;

create policy "public_read_hotels"
  on hotels for select
  using (true);

create policy "service_write_hotels"
  on hotels for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 3. REVIEWS — Müştəri rəyləri
-- ============================================================
alter table if exists reviews enable row level security;

drop policy if exists "public_read_reviews" on reviews;
drop policy if exists "anon_insert_reviews" on reviews;
drop policy if exists "service_all_reviews" on reviews;

create policy "public_read_reviews"
  on reviews for select
  using (true);

create policy "anon_insert_reviews"
  on reviews for insert
  with check (true);

create policy "service_all_reviews"
  on reviews for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 4. FLIGHT_BOOKINGS — Uçuş rezervasiyaları
-- ============================================================
alter table if exists flight_bookings enable row level security;

drop policy if exists "auth_read_own_flight_bookings" on flight_bookings;
drop policy if exists "service_all_flight_bookings" on flight_bookings;

create policy "auth_read_own_flight_bookings"
  on flight_bookings for select
  using (auth.role() = 'authenticated');

create policy "service_all_flight_bookings"
  on flight_bookings for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 5. LOYALTY_TRANSACTIONS — Loyallıq xalları
-- ============================================================
alter table if exists loyalty_transactions enable row level security;

drop policy if exists "auth_read_loyalty" on loyalty_transactions;
drop policy if exists "service_all_loyalty" on loyalty_transactions;

create policy "auth_read_loyalty"
  on loyalty_transactions for select
  using (auth.role() = 'authenticated');

create policy "service_all_loyalty"
  on loyalty_transactions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 6. KNOWLEDGE_BASE — AI bilik bazası
-- ============================================================
alter table if exists knowledge_base enable row level security;

drop policy if exists "auth_read_knowledge" on knowledge_base;
drop policy if exists "service_all_knowledge" on knowledge_base;

create policy "auth_read_knowledge"
  on knowledge_base for select
  using (auth.role() = 'authenticated');

create policy "service_all_knowledge"
  on knowledge_base for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 7. PRIVATE_PACKAGES — Özəl tur paketləri
-- ============================================================
alter table if exists private_packages enable row level security;

drop policy if exists "auth_read_private_packages" on private_packages;
drop policy if exists "service_all_private_packages" on private_packages;

create policy "auth_read_private_packages"
  on private_packages for select
  using (auth.role() = 'authenticated');

create policy "service_all_private_packages"
  on private_packages for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 8. PRICE_REPORTS — Qiymət hesabatları
-- ============================================================
alter table if exists price_reports enable row level security;

drop policy if exists "auth_read_price_reports" on price_reports;
drop policy if exists "service_all_price_reports" on price_reports;

create policy "auth_read_price_reports"
  on price_reports for select
  using (auth.role() = 'authenticated');

create policy "service_all_price_reports"
  on price_reports for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 9. INSTAGRAM_TOKENS — Şifrəli Instagram tokenləri (HƏSSASdir)
-- ============================================================
alter table if exists instagram_tokens enable row level security;

drop policy if exists "service_all_instagram_tokens" on instagram_tokens;

create policy "service_all_instagram_tokens"
  on instagram_tokens for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 10. WORKFLOWS — İş axını tərifi
-- ============================================================
alter table if exists workflows enable row level security;

drop policy if exists "auth_read_workflows" on workflows;
drop policy if exists "service_all_workflows" on workflows;

create policy "auth_read_workflows"
  on workflows for select
  using (auth.role() = 'authenticated');

create policy "service_all_workflows"
  on workflows for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 11. WORKFLOW_LOGS — İş axını logları
-- ============================================================
alter table if exists workflow_logs enable row level security;

drop policy if exists "auth_read_workflow_logs" on workflow_logs;
drop policy if exists "service_all_workflow_logs" on workflow_logs;

create policy "auth_read_workflow_logs"
  on workflow_logs for select
  using (auth.role() = 'authenticated');

create policy "service_all_workflow_logs"
  on workflow_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 12. PERSONA_USERS — AI şəxsiyyət profili (tracking)
-- ============================================================
alter table if exists persona_users enable row level security;

drop policy if exists "anon_all_persona_users" on persona_users;
drop policy if exists "service_all_persona_users" on persona_users;

create policy "anon_all_persona_users"
  on persona_users for all
  using (true)
  with check (true);

create policy "service_all_persona_users"
  on persona_users for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 13. USER_PROFILES — İstifadəçi arxetip profili (tracking)
-- ============================================================
alter table if exists user_profiles enable row level security;

drop policy if exists "anon_all_user_profiles" on user_profiles;
drop policy if exists "service_all_user_profiles" on user_profiles;

create policy "anon_all_user_profiles"
  on user_profiles for all
  using (true)
  with check (true);

create policy "service_all_user_profiles"
  on user_profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 14. BEHAVIORAL_EVENTS — Davranış izləmə
-- ============================================================
alter table if exists behavioral_events enable row level security;

drop policy if exists "anon_insert_behavioral_events" on behavioral_events;
drop policy if exists "service_all_behavioral_events" on behavioral_events;

create policy "anon_insert_behavioral_events"
  on behavioral_events for insert
  with check (true);

create policy "service_all_behavioral_events"
  on behavioral_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 15. QUIZ_RESPONSES — Quiz cavabları (tracking)
-- ============================================================
alter table if exists quiz_responses enable row level security;

drop policy if exists "anon_all_quiz_responses" on quiz_responses;
drop policy if exists "service_all_quiz_responses" on quiz_responses;

create policy "anon_all_quiz_responses"
  on quiz_responses for all
  using (true)
  with check (true);

create policy "service_all_quiz_responses"
  on quiz_responses for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 16. CUSTOMER_PROFILES — Müştəri arxetip profili
-- ============================================================
alter table if exists customer_profiles enable row level security;

drop policy if exists "anon_all_customer_profiles" on customer_profiles;
drop policy if exists "service_all_customer_profiles" on customer_profiles;

create policy "anon_all_customer_profiles"
  on customer_profiles for all
  using (true)
  with check (true);

create policy "service_all_customer_profiles"
  on customer_profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 17. SUBSCRIBERS — Xəbər bülleteni abunəçiləri
-- ============================================================
alter table if exists subscribers enable row level security;

drop policy if exists "anon_insert_subscribers" on subscribers;
drop policy if exists "service_all_subscribers" on subscribers;

create policy "anon_insert_subscribers"
  on subscribers for insert
  with check (true);

create policy "service_all_subscribers"
  on subscribers for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 18. ITINERARIES — Səyahət marşrutları
-- ============================================================
alter table if exists itineraries enable row level security;

drop policy if exists "anon_all_itineraries" on itineraries;
drop policy if exists "service_all_itineraries" on itineraries;

create policy "anon_all_itineraries"
  on itineraries for all
  using (true)
  with check (true);

create policy "service_all_itineraries"
  on itineraries for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- YOXLAMA — Run after migration to verify
-- ============================================================
-- select tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
-- order by tablename;
