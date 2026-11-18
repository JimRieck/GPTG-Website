// Times are stored as timestamptz (an absolute instant, kept in UTC by Postgres).
// Display and daily grouping use US Eastern time, which shows as EST or EDT depending on the season.

export const SITE_TIME_ZONE = "America/New_York";

/** e.g. "Nov 18, 2026, 5:20 PM EST" */
export function formatEastern(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleString("en-US", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
