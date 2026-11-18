// Pure helpers for the location map on the traffic page. No server-only imports.

export type LocationRow = {
  country: string | null;
  region: string | null;
  city: string | null;
  hits: number;
};

export type LocationSelection = {
  country?: string; // ISO 3166-1 alpha-2, upper case
  region?: string; // Vercel region code, e.g. "CA"
  city?: string;
};

export type Count = { name: string; hits: number };

function sum(rows: LocationRow[], keep: (r: LocationRow) => boolean): number {
  return rows.reduce((total, r) => (keep(r) ? total + r.hits : total), 0);
}

/**
 * Keeps only the rows inside the selection. With a country selected, every map and list
 * shows just that country; with a region or city, just that place inside it.
 */
export function filterRows(rows: LocationRow[], selection: LocationSelection): LocationRow[] {
  return rows.filter((r) => {
    if (selection.country && r.country?.toUpperCase() !== selection.country) return false;
    if (selection.region && r.region !== selection.region) return false;
    if (selection.city && r.city !== selection.city) return false;
    return true;
  });
}

/** Hits per country, keyed by upper-case ISO code. */
export function countryTotals(rows: LocationRow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (!r.country) continue;
    const code = r.country.toUpperCase();
    totals.set(code, (totals.get(code) ?? 0) + r.hits);
  }
  return totals;
}

/** Hits per region inside a country, largest first. */
export function regionTotals(rows: LocationRow[], country: string): Count[] {
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (!r.region || r.country?.toUpperCase() !== country) continue;
    totals.set(r.region, (totals.get(r.region) ?? 0) + r.hits);
  }
  return [...totals.entries()].map(([name, hits]) => ({ name, hits })).sort((a, b) => b.hits - a.hits || a.name.localeCompare(b.name));
}

/** Hits per city, narrowed by country and, when given, region. Largest first. */
export function cityTotals(rows: LocationRow[], country: string, region?: string): Count[] {
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (!r.city || r.country?.toUpperCase() !== country) continue;
    if (region && r.region !== region) continue;
    totals.set(r.city, (totals.get(r.city) ?? 0) + r.hits);
  }
  return [...totals.entries()].map(([name, hits]) => ({ name, hits })).sort((a, b) => b.hits - a.hits || a.name.localeCompare(b.name));
}

/** Hits from visits with no country recorded (local development, or missing headers). */
export function unknownLocationHits(rows: LocationRow[]): number {
  return sum(rows, (r) => !r.country);
}

/**
 * Fill opacity for a map shape: 0 hits gets no colour (the neutral fill shows instead),
 * and the busiest place gets full colour. Lower values are floored so small counts stay visible.
 */
export function shadeOpacity(hits: number, max: number): number {
  if (hits <= 0 || max <= 0) return 0;
  return 0.35 + 0.65 * (hits / max);
}

export type TrafficLinkBase = { from: string; to: string; referrer?: string };

/** Link to the traffic page with the given date range, referrer, and location selection. */
export function trafficHref(base: TrafficLinkBase, selection: LocationSelection = {}): string {
  const params = new URLSearchParams({ from: base.from, to: base.to });
  if (base.referrer) params.set("referrer", base.referrer);
  if (selection.country) params.set("country", selection.country);
  if (selection.region) params.set("region", selection.region);
  if (selection.city) params.set("city", selection.city);
  return `/admin/traffic?${params.toString()}`;
}
