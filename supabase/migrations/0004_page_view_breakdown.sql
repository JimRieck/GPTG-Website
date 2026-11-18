-- Hits grouped by location for the map on the admin traffic page.
-- Uses the same date and referrer rules as page_views_per_day.
create or replace function public.page_view_breakdown(
  start_day date,
  end_day date,
  tz text default 'UTC',
  p_referrer text default null
)
returns table (country text, region text, city text, hits bigint)
language sql
stable
set search_path = public
as $$
  select v.country, v.region, v.city, count(*)::bigint as hits
  from public.page_views v
  where (v.created_at at time zone tz)::date between start_day and end_day
    and (
      p_referrer is null
      or (p_referrer = '(direct)' and v.referrer_domain is null)
      or v.referrer_domain = p_referrer
    )
  group by v.country, v.region, v.city;
$$;
