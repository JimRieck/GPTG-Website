// Pure helpers for page-view tracking and the traffic report. No server-only imports,
// so they can be unit tested directly.

export const MAX_RANGE_DAYS = 366;
export const DEFAULT_RANGE_DAYS = 30;
export const DIRECT_REFERRER = "(direct)";

const BOT_UA = /bot|crawl|spider|slurp|preview|monitor|headless|uptime|curl|wget|python|go-http|facebookexternalhit/i;

export type TrackableRequest = {
  method: string;
  accept: string | null;
  rsc: string | null;
  routerPrefetch: string | null;
  userAgent: string | null;
};

/** Only count real page loads: full HTML GETs from people, not prefetches, RSC data or bots. */
export function shouldTrackRequest(req: TrackableRequest): boolean {
  if (req.method !== "GET") return false;
  if (!req.accept?.includes("text/html")) return false;
  if (req.rsc === "1" || req.routerPrefetch) return false;
  if (!req.userAgent || BOT_UA.test(req.userAgent)) return false;
  return true;
}

/** Stored path: no trailing slash (except home), no query string, capped in length. */
export function normalizePath(pathname: string): string {
  let path = pathname.split("?")[0] || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path.slice(0, 300);
}

/**
 * Vercel sends location headers, URL-encoded (city names can contain spaces or accents).
 * Returns a trimmed, decoded value, or null when the header is missing or empty.
 */
export function decodeLocationHeader(value: string | null): string | null {
  if (!value) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  const trimmed = decoded.trim().slice(0, 100);
  return trimmed || null;
}

/**
 * The domain a visitor came from, without "www.". Visits from the site itself (internal
 * navigation) and requests with no referrer return null.
 */
export function referrerDomain(referer: string | null, ownHostname: string): string | null {
  if (!referer) return null;
  let host: string;
  try {
    host = new URL(referer).hostname.toLowerCase();
  } catch {
    return null;
  }
  host = host.replace(/^www\./, "");
  const own = ownHostname.toLowerCase().replace(/^www\./, "");
  if (!host || host === own) return null;
  return host.slice(0, 255);
}

export type TrafficFilters = {
  country?: string;
  region?: string;
  city?: string;
  referrer?: string;
};

/** Empty and missing values mean "all". */
export function cleanFilters(input: Partial<Record<keyof TrafficFilters, string | undefined>>): TrafficFilters {
  const pick = (v: string | undefined) => (v && v.trim() ? v.trim().slice(0, 255) : undefined);
  return {
    country: pick(input.country),
    region: pick(input.region),
    city: pick(input.city),
    referrer: pick(input.referrer),
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type DateRange = { start: string; end: string; error?: string };

/**
 * Resolves the admin's requested range. Missing or invalid input falls back to the
 * last 30 days ending today. Reversed ranges are swapped; ranges over 366 days are rejected.
 */
export function parseDateRange(from: string | undefined, to: string | undefined, today: string): DateRange {
  const defaultEnd = today;
  const defaultStart = addDays(today, -(DEFAULT_RANGE_DAYS - 1));

  if (!from || !to || !isValidIsoDate(from) || !isValidIsoDate(to)) {
    return { start: defaultStart, end: defaultEnd };
  }

  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  const days = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
  if (days > MAX_RANGE_DAYS) {
    return { start: defaultStart, end: defaultEnd, error: `Choose a range of ${MAX_RANGE_DAYS} days or fewer.` };
  }
  return { start, end };
}
