import { getServiceSupabase } from "@/lib/supabase/service";
import type { DailyPoint } from "@/lib/bar-chart";
import type { TrafficFilters } from "@/lib/traffic-rules";
import type { LocationRow } from "@/lib/traffic-geo";
import { SITE_TIME_ZONE } from "@/lib/time";

// Days are grouped by Eastern calendar day, matching the times shown on the admin pages.
export const REPORT_TIME_ZONE = SITE_TIME_ZONE;

export type VisitMeta = {
  country: string | null;
  region: string | null;
  city: string | null;
  referrerDomain: string | null;
};

export type FilterOptions = {
  countries: string[];
  regions: string[];
  cities: string[];
  referrers: string[];
};

/** Stores one page view. Never throws: tracking must not break a page load. */
export async function recordPageView(path: string, meta: VisitMeta): Promise<void> {
  try {
    const { error } = await getServiceSupabase().from("page_views").insert({
      path,
      country: meta.country,
      region: meta.region,
      city: meta.city,
      referrer_domain: meta.referrerDomain,
    });
    if (error) console.error("Failed to record page view:", error.message);
  } catch (err) {
    console.error("Failed to record page view:", err);
  }
}

/** Hits per day for every day in the range, inclusive. Days with no hits are 0. */
export async function getDailyHits(start: string, end: string, filters: TrafficFilters = {}): Promise<DailyPoint[]> {
  const { data, error } = await getServiceSupabase().rpc("page_views_per_day", {
    start_day: start,
    end_day: end,
    tz: REPORT_TIME_ZONE,
    p_country: filters.country ?? null,
    p_region: filters.region ?? null,
    p_city: filters.city ?? null,
    p_referrer: filters.referrer ?? null,
  });
  if (error) throw new Error(`Failed to load traffic: ${error.message}`);
  return ((data ?? []) as { day: string; hits: number | string }[]).map((row) => ({
    day: row.day,
    hits: Number(row.hits),
  }));
}

/** Hits grouped by country, region, and city for the map. Honours the date range and referrer. */
export async function getLocationBreakdown(start: string, end: string, referrer?: string): Promise<LocationRow[]> {
  const { data, error } = await getServiceSupabase().rpc("page_view_breakdown", {
    start_day: start,
    end_day: end,
    tz: REPORT_TIME_ZONE,
    p_referrer: referrer ?? null,
  });
  if (error) throw new Error(`Failed to load locations: ${error.message}`);
  return ((data ?? []) as { country: string | null; region: string | null; city: string | null; hits: number | string }[]).map(
    (row) => ({ country: row.country, region: row.region, city: row.city, hits: Number(row.hits) }),
  );
}

/** Distinct referrers seen so far, for the "Came from" dropdown. */
export async function getFilterOptions(): Promise<FilterOptions> {
  const { data, error } = await getServiceSupabase().rpc("page_view_filter_options");
  if (error) throw new Error(`Failed to load filter options: ${error.message}`);
  const json = (data ?? {}) as Partial<Record<"countries" | "regions" | "cities" | "referrers", string[]>>;
  return {
    countries: json.countries ?? [],
    regions: json.regions ?? [],
    cities: json.cities ?? [],
    referrers: json.referrers ?? [],
  };
}
