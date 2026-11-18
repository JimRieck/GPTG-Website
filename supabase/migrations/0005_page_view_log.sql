-- Individual hits, newest first, for the "Recent hits" table on the admin traffic page.
-- Uses the same date, location, and referrer rules as page_views_per_day.
create or replace function public.page_view_log(
  start_day date,
  end_day date,
  tz text default 'UTC',
  p_country text default null,
  p_region text default null,
  p_city text default null,
  p_referrer text default null,
  p_limit int default 200
)
returns table (
  created_at timestamptz,
  path text,
  country text,
  region text,
  city text,
  referrer_domain text
)
language sql
stable
set search_path = public
as $$
  select v.created_at, v.path, v.country, v.region, v.city, v.referrer_domain
  from public.page_views v
  where (v.created_at at time zone tz)::date between start_day and end_day
    and (p_country is null or v.country = p_country)
    and (p_region is null or v.region = p_region)
    and (p_city is null or v.city = p_city)
    and (
      p_referrer is null
      or (p_referrer = '(direct)' and v.referrer_domain is null)
      or v.referrer_domain = p_referrer
    )
  order by v.created_at desc
  limit least(greatest(p_limit, 1), 1000);
$$;
