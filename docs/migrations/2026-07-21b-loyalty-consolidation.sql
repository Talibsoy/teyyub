-- ============================================
-- NATOURE — Loyalty consolidation (Faza 7 düzəlişi)
-- Supabase SQL Editor-də run et
-- ============================================
-- The previous migration created a parallel points system before we noticed the
-- app ALREADY has one (`loyalty_transactions` + `customer_profiles.referral_code`,
-- surfaced by /panel/rewards). Two balances would be worse than none, so this
-- migration consolidates onto the existing table and drops the duplicates.
--
-- Kept from the earlier migration: `referrals` (who invited whom — genuinely new)
-- and `badges` / `user_badges` (no equivalent existed).

-- ============================================
-- 1) Make the EXISTING ledger safely idempotent
-- ============================================
-- Without this, a retried webhook or a refreshed return page could credit the
-- same trip twice. `source_id` records what caused the entry.
alter table loyalty_transactions
  add column if not exists source_id text;

create unique index if not exists loyalty_transactions_unique_source
  on loyalty_transactions (user_id, type, source_id)
  where source_id is not null;

-- ============================================
-- 2) Drop the duplicates created earlier today
-- ============================================
-- Safe: these were created minutes ago and never written to. The live points
-- system remains `loyalty_transactions`.
drop view if exists loyalty_balances;
drop table if exists loyalty_ledger;
drop table if exists referral_codes;

-- ============================================
-- 3) Referral tracking keeps pointing at the existing referral_code
-- ============================================
-- `customer_profiles.referral_code` stays the single source for a user's code;
-- `referrals` only records the relationship and whether it has qualified.
comment on table referrals is
  'Who referred whom. The code itself lives on customer_profiles.referral_code.';
