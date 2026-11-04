-- Leads captured from the public contact form.
create table if not exists public.leads (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  name                   text not null,
  company_name           text,
  address                text not null,
  city                   text not null,
  state                  char(2) not null,
  zip                    text not null,
  email                  text not null,
  phone                  text not null,
  message                text not null,
  address_verified       boolean,
  address_verified_at    timestamptz,
  address_verification   jsonb
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- Only the server (service role key) reads or writes leads. With RLS enabled and no
-- policies, the public anon key cannot access this table at all.
alter table public.leads enable row level security;
