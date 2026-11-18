import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { buildBarChart, shortDayLabel } from "@/lib/bar-chart";
import { cleanFilters, DIRECT_REFERRER, parseDateRange } from "@/lib/traffic-rules";
import { getDailyHits, getFilterOptions, getLocationBreakdown } from "@/lib/traffic";
import {
  cityTotals,
  countryTotals,
  regionTotals,
  trafficHref,
  unknownLocationHits,
  type LocationSelection,
} from "@/lib/traffic-geo";
import { US_STATES_MAP, WORLD_MAP } from "@/lib/maps/world-map-data";
import AdminNav from "../AdminNav";
import LocationMap from "./LocationMap";

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

function countryName(code: string): string {
  return WORLD_MAP.locations.find((l) => l.id === code.toLowerCase())?.name ?? code;
}

function regionName(country: string, code: string): string {
  if (country === "US") return US_STATES_MAP.locations.find((l) => l.id === code.toLowerCase())?.name ?? code;
  return code;
}

function Places({ title, items, render }: { title: string; items: { name: string; hits: number }[]; render: (name: string) => string }) {
  return (
    <div>
      <h3 className="places-title">{title}</h3>
      {items.length === 0 ? (
        <p className="muted">No visits yet.</p>
      ) : (
        <ol className="places">
          {items.map((item) => (
            <li key={item.name}>
              <Link href={render(item.name)}>{item.name}</Link>{" "}
              <span className="muted">
                {item.hits.toLocaleString("en-US")} {item.hits === 1 ? "hit" : "hits"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function TrafficPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { email } = await requireAdmin();
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const range = parseDateRange(params.from, params.to, today);
  const cleaned = cleanFilters({ referrer: params.referrer });

  // Location selection comes from map clicks. Region and city only make sense inside a country.
  const country = params.country?.trim().toUpperCase().slice(0, 2) || undefined;
  const region = country && params.region?.trim() ? params.region.trim().toUpperCase().slice(0, 10) : undefined;
  const city = country && params.city?.trim() ? params.city.trim().slice(0, 100) : undefined;
  const selection: LocationSelection = { country, region, city };
  const referrer = cleaned.referrer;

  const base = { from: range.start, to: range.end, referrer };
  const [points, rows, options] = await Promise.all([
    getDailyHits(range.start, range.end, { country, region, city, referrer }),
    getLocationBreakdown(range.start, range.end, referrer),
    getFilterOptions(),
  ]);

  const total = points.reduce((sum, p) => sum + p.hits, 0);
  const chart = buildBarChart(points);

  // Map inputs. Country totals are keyed by lower-case id to match the map data.
  const countries = countryTotals(rows);
  const countryHits = new Map([...countries].map(([code, hits]) => [code.toLowerCase(), hits]));
  const countryList = [...countries]
    .map(([code, hits]) => ({ name: code, hits }))
    .sort((a, b) => b.hits - a.hits);
  const regions = country === "US" ? regionTotals(rows, "US") : country ? regionTotals(rows, country) : [];
  const regionHits = new Map(regions.map((r) => [r.name.toLowerCase(), r.hits]));
  const cities = country ? cityTotals(rows, country, region) : [];
  const unknown = unknownLocationHits(rows);

  const countryHref = (id: string) => {
    const code = id.toUpperCase();
    return code === country ? trafficHref(base) : trafficHref(base, { country: code });
  };
  const regionHref = (id: string) => {
    const code = id.toUpperCase();
    return code === region ? trafficHref(base, { country }) : trafficHref(base, { country, region: code });
  };
  const cityHref = (name: string) => trafficHref(base, { country, region, city: name });

  // Summary and breadcrumbs.
  const crumbs: { label: string; href?: string }[] = [{ label: "All countries", href: country ? trafficHref(base) : undefined }];
  if (country) crumbs.push({ label: countryName(country), href: region || city ? trafficHref(base, { country }) : undefined });
  if (region) crumbs.push({ label: regionName(country!, region), href: city ? trafficHref(base, { country, region }) : undefined });
  if (city) crumbs.push({ label: city });

  const filterParts: string[] = [];
  if (city) filterParts.push(`city ${city}`);
  else if (region) filterParts.push(`region ${regionName(country!, region)}`);
  else if (country) filterParts.push(`country ${countryName(country)}`);
  if (referrer) filterParts.push(referrer === DIRECT_REFERRER ? "direct visits" : `referred from ${referrer}`);
  const hasFilters = filterParts.length > 0;

  return (
    <section className="wide-page">
      <AdminNav email={email} current="traffic" />

      <h1>Site traffic</h1>

      <form method="get" className="date-range" aria-label="Choose a date range and source">
        <label>
          <span>From</span>
          <input type="date" name="from" defaultValue={range.start} max={today} required />
        </label>
        <label>
          <span>To</span>
          <input type="date" name="to" defaultValue={range.end} max={today} required />
        </label>
        <label>
          <span>Came from</span>
          <select name="referrer" defaultValue={referrer ?? ""}>
            <option value="">Any source</option>
            <option value={DIRECT_REFERRER}>Direct (no referrer)</option>
            {options.referrers.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        {country && <input type="hidden" name="country" value={country} />}
        {region && <input type="hidden" name="region" value={region} />}
        {city && <input type="hidden" name="city" value={city} />}
        <button type="submit" className="button">
          Show hits
        </button>
        {(hasFilters || referrer) && (
          <Link href={`/admin/traffic?from=${range.start}&to=${range.end}`} className="button secondary">
            Clear all filters
          </Link>
        )}
      </form>

      {range.error && <p className="notice error">{range.error} Showing the last 30 days instead.</p>}

      <nav className="crumbs" aria-label="Location filter">
        {crumbs.map((c, i) => (
          <span key={c.label + i}>
            {i > 0 && <span className="crumb-sep" aria-hidden="true"> › </span>}
            {c.href ? <Link href={c.href}>{c.label}</Link> : <strong>{c.label}</strong>}
          </span>
        ))}
      </nav>
      <p className="muted">Click a country on the map to filter by it. Click again to clear it.</p>

      <div className={country === "US" ? "map-row" : undefined}>
        <figure className="map-figure">
          <LocationMap
            map={WORLD_MAP}
            hits={countryHits}
            selectedId={country?.toLowerCase()}
            hrefFor={countryHref}
            label="World map of hits by country. Select a country to filter."
          />
          <figcaption className="muted">
            Country outlines: @svg-maps (CC-BY-4.0). Hits are counted by the visitor&apos;s country.
          </figcaption>
        </figure>

        {country === "US" && (
          <figure className="map-figure">
            <LocationMap
              map={US_STATES_MAP}
              hits={regionHits}
              selectedId={region?.toLowerCase()}
              hrefFor={regionHref}
              label="Map of US states. Select a state to filter."
            />
            <figcaption className="muted">Select a state to filter by it. Click again to clear it.</figcaption>
          </figure>
        )}
      </div>

      {country && (
        <div className="places-grid">
          <Places
            title={country === "US" ? "States" : "Regions"}
            items={regions}
            render={regionHref}
          />
          <Places
            title="Cities"
            items={cities}
            render={(name) => cityHref(name)}
          />
        </div>
      )}

      <p className="muted">
        {total.toLocaleString("en-US")} {total === 1 ? "hit" : "hits"} from {shortDayLabel(range.start)} to{" "}
        {shortDayLabel(range.end)} ({points.length} {points.length === 1 ? "day" : "days"}).
        {hasFilters ? ` Filtered by ${filterParts.join(", ")}.` : ""} Days are counted in Eastern time.
        {unknown > 0 && ` ${unknown.toLocaleString("en-US")} ${unknown === 1 ? "hit has" : "hits have"} no location recorded.`}
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
            <rect key={bar.day} x={bar.x} y={bar.y} width={bar.width} height={Math.max(bar.height, 0)} className="traffic-bar">
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
        <summary>Show countries and daily numbers as tables</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Hits</th>
              </tr>
            </thead>
            <tbody>
              {countryList.map((c) => (
                <tr key={c.name}>
                  <td>
                    <Link href={countryHref(c.name)}>{countryName(c.name)}</Link>
                  </td>
                  <td>{c.hits.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
