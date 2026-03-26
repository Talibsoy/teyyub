-- ============================================
-- NATOURE CRM — Database Schema
-- Supabase SQL Editor-də run et
-- ============================================

-- UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TOURS (Tur kataloqu)
-- ============================================
create table if not exists tours (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  destination text not null,
  description text,
  price_azn numeric(10,2) not null default 0,
  price_usd numeric(10,2),
  price_eur numeric(10,2),
  start_date date,
  end_date date,
  max_seats int not null default 20,
  booked_seats int not null default 0,
  hotel text,
  includes text[],
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- CUSTOMERS (Müştərilər)
-- ============================================
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text,
  phone text,
  email text,
  passport_number text,
  passport_expiry date,
  tags text[] default '{}',  -- 'vip', 'repeat', 'potential'
  notes text,
  source text,               -- 'whatsapp', 'facebook', 'instagram', 'website', 'manual'
  wa_id text unique,         -- WhatsApp sender ID
  fb_id text unique,         -- Facebook sender ID
  ig_id text unique,         -- Instagram sender ID
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- LEADS (Potensial müştərilər)
-- ============================================
create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  name text,
  phone text,
  email text,
  platform text not null,    -- 'whatsapp', 'facebook', 'instagram'
  sender_id text not null,
  destination text,
  message text,
  status text default 'new', -- 'new', 'contacted', 'converted', 'lost'
  assigned_to uuid references auth.users(id),
  customer_id uuid references customers(id),
  created_at timestamptz default now()
);

-- ============================================
-- BOOKINGS (Rezervasiyalar)
-- ============================================
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  booking_number text unique not null,
  customer_id uuid references customers(id) on delete set null,
  tour_id uuid references tours(id) on delete set null,
  status text default 'new',   -- 'new','contacted','confirmed','paid','cancelled'
  passengers jsonb default '[]', -- [{name, passport, phone}]
  total_price numeric(10,2) not null default 0,
  currency text default 'AZN',
  notes text,
  assigned_to uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto booking number
create or replace function generate_booking_number()
returns trigger as $$
begin
  new.booking_number := 'NTR-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 9000 + 1000)::text;
  return new;
end;
$$ language plpgsql;

create trigger set_booking_number
  before insert on bookings
  for each row
  when (new.booking_number is null or new.booking_number = '')
  execute function generate_booking_number();

-- ============================================
-- PAYMENTS (Ödənişlər)
-- ============================================
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text default 'AZN',
  status text default 'pending',  -- 'pending','paid','failed','refunded'
  payment_method text,            -- 'payriff','cash','transfer'
  payriff_order_id text,
  payriff_session_id text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- MESSAGES (Söhbət lоqları)
-- ============================================
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  platform text not null,
  direction text not null,  -- 'in', 'out'
  content text not null,
  media_type text,          -- 'image','video','audio','file'
  media_url text,
  created_at timestamptz default now()
);

-- ============================================
-- ACTIVITY LOGS
-- ============================================
create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  entity_type text not null,  -- 'booking','customer','lead','payment'
  entity_id uuid not null,
  action text not null,       -- 'created','updated','status_changed'
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

-- ============================================
-- STAFF PROFİLLƏRİ (auth.users uzantısı)
-- ============================================
create table if not exists staff (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text default 'agent',  -- 'admin','manager','agent'
  phone text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- İNDEKSLƏR
-- ============================================
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_platform on leads(platform);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_customer on bookings(customer_id);
create index if not exists idx_payments_booking on payments(booking_id);
create index if not exists idx_messages_customer on messages(customer_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table tours enable row level security;
alter table customers enable row level security;
alter table leads enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table messages enable row level security;
alter table activity_logs enable row level security;
alter table staff enable row level security;

-- Authenticated users hər şeyi görə bilər (admin panel)
create policy "authenticated_all" on tours for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on customers for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on leads for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on bookings for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on payments for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on messages for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on activity_logs for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on staff for all using (auth.role() = 'authenticated');

-- Service role (webhook-lar üçün) hər şeyi edə bilər
create policy "service_all" on customers for all using (auth.role() = 'service_role');
create policy "service_all" on leads for all using (auth.role() = 'service_role');
create policy "service_all" on messages for all using (auth.role() = 'service_role');
