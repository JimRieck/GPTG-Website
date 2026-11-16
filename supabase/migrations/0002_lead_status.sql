-- Pipeline status for each lead, set from the admin area.
alter table public.leads
  add column if not exists status text not null default 'new';

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check
  check (status in ('new', 'contacted', 'qualified', 'won', 'lost', 'archived'));

create index if not exists leads_status_idx on public.leads (status);
