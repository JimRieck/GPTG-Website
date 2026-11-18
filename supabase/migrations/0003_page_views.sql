-- One row per public page view. Stores the page path, coarse location from Vercel's
-- IP headers, and the referring site's domain. Raw IP addresses, user agents, and
-- cookies are never stored.
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null check (char_length(path) <= 300),
  country text check (char_length(country) <= 100),
  region text check (char_length(region) <= 100),
  city text check (char_length(city) <= 100),
  referrer_domain text check (char_length(referrer_domain) <= 255)
);

create index if not exists page_views_created_at_idx on public.page_views (created_at);

-- Row level security is on with no policies, so only the service role can read or write.
alter table public.page_views enable row level security;

-- Hit count for every day in [start_day, end_day], in the given time zone, optionally
-- narrowed by location and referrer. Days with no hits are returned as 0.
-- p_referrer = '(direct)' matches visits with no referring site.
create or replace function public.page_views_per_day(
  start_day date,
  end_day date,
  tz text default 'UTC',
  p_country text default null,
  p_region text default null,
  p_city text default null,
  p_referrer text default null
)
returns table (day date, hits bigint)
language sql
stable
set search_path = public
as $$
  select (d.day)::date as day, count(v.id)::bigint as hits
  from generate_series(start_day::timestamp, end_day::timestamp, interval '1 day') as d(day)
  left join public.page_views v
    on (v.created_at at time zone tz)::date = (d.day)::date
   and (p_country is null or v.country = p_country)
   and (p_region is null or v.region = p_region)
   and (p_city is null or v.city = p_city)
   and (
     p_referrer is null
     or (p_referrer = '(direct)' and v.referrer_domain is null)
     or v.referrer_domain = p_referrer
   )
  group by d.day
  order by d.day;
$$;

-- Distinct values seen so far, for the admin filter dropdowns.
create or replace function public.page_view_filter_options()
returns json
language sql
stable
set search_path = public
as $$
  select json_build_object(
    'countries', (select coalesce(json_agg(x order by x), '[]'::json)
                  from (select distinct country as x from public.page_views where country is not null) s),
    'regions',   (select coalesce(json_agg(x order by x), '[]'::json)
                  from (select distinct region as x from public.page_views where region is not null) s),
    'cities',    (select coalesce(json_agg(x order by x), '[]'::json)
                  from (select distinct city as x from public.page_views where city is not null) s),
    'referrers', (select coalesce(json_agg(x order by x), '[]'::json)
                  from (select distinct referrer_domain as x from public.page_views where referrer_domain is not null) s)
  );
$$;
