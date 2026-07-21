-- ============================================
-- NATOURE — Booking orchestration (Faza 4)
-- Supabase SQL Editor-də run et
-- ============================================
-- One saga per paid order. Every provider call is recorded so that a partial
-- failure is auditable and an operator can see exactly what is really booked.
-- Nothing here is ever silently rewritten — a step that cannot be cancelled is
-- kept as 'manual_intervention' until a human resolves it.

create extension if not exists "uuid-ossp";

create table if not exists booking_sagas (
  id uuid primary key default uuid_generate_v4(),

  user_id uuid references auth.users(id),
  experience_slug text,                      -- which landing page this came from, if any

  -- Payment happened once, before any provider booking started.
  payment_ref text,                          -- Stripe payment intent id
  paid_total_usd numeric(10,2) not null default 0,

  -- 'running' | 'completed' | 'rolled_back' | 'needs_attention'
  status text not null default 'running',
  failed_service text,                       -- which step broke the chain

  contact_email text,
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists booking_saga_steps (
  id uuid primary key default uuid_generate_v4(),
  saga_id uuid not null references booking_sagas(id) on delete cascade,

  service text not null,                     -- 'flight' | 'hotel' | 'tour' | ...
  step_order int not null default 0,

  -- The REAL provider identifiers involved
  option_id text not null,                   -- what the customer confirmed
  provider_ref text,                         -- provider's booking reference once issued

  price_usd numeric(10,2) not null default 0,
  reversible boolean not null default false, -- can this be cancelled programmatically?

  -- 'pending' | 'confirmed' | 'failed' | 'compensated' | 'manual_intervention'
  status text not null default 'pending',
  reason text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists booking_saga_steps_saga_idx
  on booking_saga_steps (saga_id, step_order);

create index if not exists booking_sagas_status_idx
  on booking_sagas (status, created_at desc);

-- Operator queue: everything still needing a human decision.
create or replace view booking_sagas_needing_attention as
  select
    s.id            as saga_id,
    s.user_id,
    s.contact_email,
    s.paid_total_usd,
    s.failed_service,
    s.created_at,
    st.service      as stuck_service,
    st.provider_ref,
    st.price_usd    as stuck_price_usd,
    st.reason
  from booking_sagas s
  join booking_saga_steps st on st.saga_id = s.id
  where s.status = 'needs_attention'
    and st.status = 'manual_intervention'
  order by s.created_at desc;

-- ============================================
-- RLS — customers may read their own sagas; all writes are service-role only
-- ============================================
alter table booking_sagas enable row level security;
alter table booking_saga_steps enable row level security;

drop policy if exists "booking_sagas_owner_read" on booking_sagas;
create policy "booking_sagas_owner_read"
  on booking_sagas
  for select
  using (auth.uid() = user_id);

drop policy if exists "booking_saga_steps_owner_read" on booking_saga_steps;
create policy "booking_saga_steps_owner_read"
  on booking_saga_steps
  for select
  using (
    exists (
      select 1 from booking_sagas s
      where s.id = booking_saga_steps.saga_id
        and s.user_id = auth.uid()
    )
  );

-- No insert/update/delete policies: only the service-role key (the orchestrator
-- running server-side) may write booking state.
