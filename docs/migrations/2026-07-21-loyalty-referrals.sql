-- ============================================
-- NATOURE — Loyalty, referrals & badges (Faza 7)
-- Supabase SQL Editor-də run et
-- ============================================
-- Additive by design: this does NOT touch the existing bookings/points logic.
-- It adds a USD-based ledger, a referral system and badges alongside it, so the
-- old AZN "xal" flow keeps working until it is migrated deliberately.

create extension if not exists "uuid-ossp";

-- ============================================
-- LEDGER — every point movement is an immutable row
-- ============================================
-- An append-only ledger (rather than a mutable balance column) means a balance
-- can always be recomputed and audited, and a double-credit bug is visible.
create table if not exists loyalty_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Positive = earned, negative = spent/reversed
  points int not null,

  -- 'booking_earned' | 'referral_bonus' | 'signup_bonus' | 'redeemed' | 'refund_reversal' | 'manual'
  reason text not null,

  -- What caused it (a saga, a booking, a referral…)
  source_type text,
  source_id text,

  usd_amount numeric(10,2),          -- the spend that generated the points, if any
  note text,

  created_at timestamptz default now()
);

create index if not exists loyalty_ledger_user_idx
  on loyalty_ledger (user_id, created_at desc);

-- Prevents the same booking from being credited twice.
create unique index if not exists loyalty_ledger_unique_source
  on loyalty_ledger (user_id, reason, source_type, source_id)
  where source_id is not null;

create or replace view loyalty_balances as
  select
    user_id,
    coalesce(sum(points), 0)::int                              as points_balance,
    coalesce(sum(points) filter (where points > 0), 0)::int    as points_earned,
    coalesce(sum(usd_amount) filter (where points > 0), 0)     as lifetime_usd
  from loyalty_ledger
  group by user_id;

-- ============================================
-- REFERRALS
-- ============================================
create table if not exists referral_codes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  code text unique not null,
  created_at timestamptz default now()
);

create table if not exists referrals (
  id uuid primary key default uuid_generate_v4(),

  referrer_id uuid not null references auth.users(id) on delete cascade,
  -- A person can only ever be referred once.
  referred_id uuid not null unique references auth.users(id) on delete cascade,
  code text not null,

  -- 'pending' until the referred traveller completes a paid trip
  status text not null default 'pending',
  qualified_at timestamptz,

  created_at timestamptz default now(),

  -- No self-referrals.
  constraint referrals_no_self check (referrer_id <> referred_id)
);

create index if not exists referrals_referrer_idx
  on referrals (referrer_id, status);

-- ============================================
-- BADGES
-- ============================================
create table if not exists badges (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  description text,
  icon text,
  sort_order int default 0
);

create table if not exists user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_slug text not null references badges(slug) on delete cascade,
  awarded_at timestamptz default now(),
  unique (user_id, badge_slug)
);

insert into badges (slug, title, description, icon, sort_order) values
  ('first-trip',     'First Trip',      'Completed your first Natoure adventure',        '🥾', 1),
  ('explorer',       'Explorer',        'Visited three different destinations',          '🧭', 2),
  ('summit-seeker',  'Summit Seeker',   'Completed a challenging-rated experience',      '⛰️', 3),
  ('trail-regular',  'Trail Regular',   'Booked five or more trips',                     '🌲', 4),
  ('friend-guide',   'Friend Guide',    'Referred a traveller who completed a trip',     '🤝', 5)
on conflict (slug) do nothing;

-- ============================================
-- RLS — travellers read their own data; all writes are service-role only
-- ============================================
alter table loyalty_ledger enable row level security;
alter table referral_codes enable row level security;
alter table referrals      enable row level security;
alter table user_badges    enable row level security;
alter table badges         enable row level security;

drop policy if exists "loyalty_ledger_owner_read" on loyalty_ledger;
create policy "loyalty_ledger_owner_read"
  on loyalty_ledger for select using (auth.uid() = user_id);

drop policy if exists "referral_codes_owner_read" on referral_codes;
create policy "referral_codes_owner_read"
  on referral_codes for select using (auth.uid() = user_id);

drop policy if exists "referrals_owner_read" on referrals;
create policy "referrals_owner_read"
  on referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

drop policy if exists "user_badges_owner_read" on user_badges;
create policy "user_badges_owner_read"
  on user_badges for select using (auth.uid() = user_id);

-- The badge catalogue itself is public reference data.
drop policy if exists "badges_public_read" on badges;
create policy "badges_public_read"
  on badges for select using (true);

-- Points are never granted client-side: no insert/update policies anywhere.
