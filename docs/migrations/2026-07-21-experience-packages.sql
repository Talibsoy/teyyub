-- ============================================
-- NATOURE — Experience Packages (Faza 3)
-- Supabase SQL Editor-də run et
-- ============================================
-- The primary product of the US pivot: an authored outdoor experience
-- (e.g. "7-Day Alaska Wildlife Adventure") that a social ad links to.
-- Flights / hotels / tours are attached later at booking time from live
-- provider inventory — this table holds the marketing + itinerary shell only.

create extension if not exists "uuid-ossp";

create table if not exists experience_packages (
  id uuid primary key default uuid_generate_v4(),

  -- Routing / identity
  slug text unique not null,              -- /experience/alaska-wildlife-adventure
  title text not null,                    -- "7-Day Alaska Wildlife Adventure"
  subtitle text,

  -- Where it happens
  destination text not null,              -- "Anchorage, Alaska" (shown to users)
  destination_query text,                 -- what we feed the hotel search, e.g. "Los Angeles"
  destination_iata text,                  -- prefills the flight search, e.g. "ANC"

  -- Marketing content
  hero_image_url text,
  gallery_urls text[] default '{}',
  summary text,
  description text,
  highlights text[] default '{}',
  included text[] default '{}',
  excluded text[] default '{}',

  -- Trip shape
  duration_days int not null default 7,
  difficulty text default 'moderate',     -- 'easy' | 'moderate' | 'challenging'
  max_group_size int,
  best_season text,
  recommended_months text[] default '{}',

  -- Pricing (display only — real prices always come from providers at booking)
  base_price_usd numeric(10,2),           -- "from $X per person"

  -- Structured extras
  itinerary jsonb default '[]'::jsonb,    -- [{ day, title, description }]
  faq jsonb default '[]'::jsonb,          -- [{ question, answer }]

  -- SEO (Flow 2 organic entry)
  seo_title text,
  seo_description text,

  -- Publishing
  is_active boolean default true,
  sort_order int default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists experience_packages_slug_idx
  on experience_packages (slug);

create index if not exists experience_packages_active_idx
  on experience_packages (is_active, sort_order);

-- ============================================
-- RLS — public may read published packages; writes are service-role only
-- ============================================
alter table experience_packages enable row level security;

drop policy if exists "experience_packages_public_read" on experience_packages;
create policy "experience_packages_public_read"
  on experience_packages
  for select
  using (is_active = true);

-- Inserts/updates/deletes intentionally have no policy: only the service-role
-- key (admin panel / server) can write, matching the rest of the schema.

-- ============================================
-- Seed example (safe to re-run)
-- ============================================
insert into experience_packages (
  slug, title, subtitle, destination, destination_query, destination_iata,
  summary, highlights, included, excluded,
  duration_days, difficulty, best_season, base_price_usd
)
values (
  'alaska-wildlife-adventure',
  '7-Day Alaska Wildlife Adventure',
  'Glaciers, grizzlies and the last great wilderness',
  'Anchorage, Alaska',
  'Anchorage',
  'ANC',
  'A week tracking wildlife and hiking glacier country, built around small-group guided days and comfortable nights in Anchorage.',
  array['Glacier cruise in Prince William Sound', 'Denali wildlife drive', 'Coastal trail hikes', 'Small groups, expert local guides'],
  array['7 nights accommodation', 'Guided wildlife excursions', 'Park entry fees', 'Airport transfers'],
  array['International flights', 'Travel insurance', 'Lunches and dinners'],
  7,
  'moderate',
  'June–August',
  1890.00
)
on conflict (slug) do nothing;