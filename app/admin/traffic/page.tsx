import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { buildBarChart, shortDayLabel } from "@/lib/bar-chart";
import { cleanFilters, DIRECT_REFERRER, parseDateRange, type TrafficFilters } from "@/lib/traffic-rules";
import { getDailyHits, getFilterOptions, REPORT_TIME_ZONE } from "@/lib/traffic";
import { signOutAdmin } from "../actions";

export const metadata = {
  title: "Traffic",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = {
  from?: string;
  to?: string;
  country?: string;
  region?: string;
  city?: string;
  referrer?: string;
};

function FilterSelect({
  name,
  label,
  value,
  options,
  allLabel,
  optionLabel,
}: {
  name: string;
  label: string;
  value: string | undefined;
  options: string[];
  allLabel: string;
  optionLabel?: (value: string) => string;
}) {
  // Keep a chosen value visible even if it is no longer in the list of seen values.
  const list = value && !options.includes(value) ? [...options, value] : options;
  return (
    <label>
      <span>{label}</span>
      <select name={name} defaultValue={value ?? ""}>
        <option value="">{allLabel}</option>
        {list.map((opt) => (
          <option key={opt} value={opt}>
            {optionLabel ? optionLabel(opt) : opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function describeFilters(filters: TrafficFilters): string {
  const parts: string[] = [];
  if (filters.country) parts.push(`country ${filters.country}`);
  if (filters.region) parts.push(`region ${filters.region}`);
  if (filters.city) parts.push(`city ${filters.city}`);
  if (filters.referrer) {
    parts.push(filters.referrer === DIRECT_REFERRER ? "direct visits" : `referred from ${filters.referrer}`);
  }
  return parts.length ? ` Filtered by ${parts.join(", ")}.` : "";
}

export default async function TrafficPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { email } = await requireAdmin();
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const range = parseDateRange(params.from, params.to, today);
  const filters = cleanFilters(params);

  const [points, options] = await Promise.all([
    getDailyHits(range.start, range.end, filters),
    getFilterOptions(),
  ]);

  const total = points.reduce((sum, p) => sum + p.hits, 0);
  const chart = buildBarChart(points);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <section className="wide-page">
      <div className="admin-bar">
        <h1>Site traffic</h1>
        <div>
          <Link href="/admin/leads" className="button secondary small">
            Leads
          </Link>{" "}
          <span className="muted">{email}</span>{" "}
          <form action={signOutAdmin} style={{ display: "inline" }}>
            <button type="submit" className="button secondary">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <form method="get" className="date-range" aria-label="Choose a date range and filters">
        <label>
          <span>From</span>
          <input type="date" name="from" defaultValue={range.start} max={today} required />
        </label>
        <label>
          <span>To</span>
          <input type="date" name="to" defaultValue={range.end} max={today} required />
        </label>
        <FilterSelect name="country" label="Country" value={filters.country} options={options.countries} allLabel="All countries" />
        <FilterSelect name="region" label="Region / state" value={filters.region} options={options.regions} allLabel="All regions" />
        <FilterSelect name="city" label="City" value={filters.city} options={options.cities} allLabel="All cities" />
        <FilterSelect
          name="referrer"
          label="Came from"
          value={filters.referrer}
          options={options.referrers}
          allLabel="Any source"
          optionLabel={(v) => (v === DIRECT_REFERRER ? "Direct (no referrer)" : v)}
        />
        <button type="submit" className="button">
          Show hits
        </button>
        {hasFilters && (
          <Link href={`/admin/traffic?from=${range.start}&to=${range.end}`} className="button secondary">
            Clear filters
          </Link>
        )}
      </form>

      {range.error && <p className="notice error">{range.error} Showing the last 30 days instead.</p>}

      <p className="muted">
        {total.toLocaleString("en-US")} {total === 1 ? "hit" : "hits"} from {shortDayLabel(range.start)} to{" "}
        {shortDayLabel(range.end)} ({points.length} {points.length === 1 ? "day" : "days"}).
        {describeFilters(filters)} Days are counted in {REPORT_TIME_ZONE} time.
      </p>

      <figure className="traffic-figure">
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="traffic-chart"
          role="img"
          aria-label={`Bar chart of page hits per day from ${range.start} to ${range.end}, ${total} hits in total`}
        >
          {chart.yTicks.map((tick) => (
            <g key={tick.y}>
              <line x1="48" x2={chart.width - 12} y1={tick.y} y2={tick.y} className="traffic-grid" />
              <text x="40" y={tick.y + 4} textAnchor="end" className="traffic-axis">
                {Math.round(tick.value).toLocaleString("en-US")}
              </text>
            </g>
          ))}
          {chart.bars.map((bar) => (
            <rect
              key={bar.day}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={Math.max(bar.height, 0)}
              className="traffic-bar"
            >
              <title>{`${shortDayLabel(bar.day)}: ${bar.hits} ${bar.hits === 1 ? "hit" : "hits"}`}</title>
            </rect>
          ))}
          {chart.xLabels.map((label) => (
            <text key={label.x} x={label.x} y={chart.height - 16} textAnchor="middle" className="traffic-axis">
              {label.text}
            </text>
          ))}
        </svg>
      </figure>

      <details className="traffic-table">
        <summary>Show as a table</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Hits</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.day}>
                  <td>{p.day}</td>
                  <td>{p.hits.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
