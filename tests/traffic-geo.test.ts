import { describe, expect, it } from "vitest";
import {
  cityTotals,
  countryTotals,
  filterRows,
  regionTotals,
  shadeOpacity,
  trafficHref,
  unknownLocationHits,
  type LocationRow,
} from "@/lib/traffic-geo";

const rows: LocationRow[] = [
  { country: "US", region: "CA", city: "San Jose", hits: 5, lastSeen: "2026-11-10T12:00:00Z" },
  { country: "US", region: "CA", city: "Los Angeles", hits: 2, lastSeen: "2026-11-01T12:00:00Z" },
  { country: "US", region: "TX", city: "Austin", hits: 4, lastSeen: "2026-11-05T12:00:00Z" },
  { country: "us", region: "CA", city: "San Jose", hits: 1, lastSeen: "2026-11-15T12:00:00Z" },
  { country: "CA", region: "ON", city: "Toronto", hits: 3, lastSeen: "2026-11-02T12:00:00Z" },
  { country: null, region: null, city: null, hits: 7, lastSeen: null },
];

describe("countryTotals", () => {
  it("adds hits per country and upper-cases codes", () => {
    const totals = countryTotals(rows);
    expect(totals.get("US")).toBe(12);
    expect(totals.get("CA")).toBe(3);
    expect(totals.has("null")).toBe(false);
  });
});

describe("regionTotals", () => {
  it("lists regions in one country, largest first", () => {
    expect(regionTotals(rows, "US")).toEqual([
      { name: "CA", hits: 8, lastSeen: "2026-11-15T12:00:00Z" },
      { name: "TX", hits: 4, lastSeen: "2026-11-05T12:00:00Z" },
    ]);
  });

  it("returns nothing for a country with no regions", () => {
    expect(regionTotals(rows, "FR")).toEqual([]);
  });
});

describe("cityTotals", () => {
  it("lists cities in a country, largest first", () => {
    expect(cityTotals(rows, "US")).toEqual([
      { name: "San Jose", hits: 6, lastSeen: "2026-11-15T12:00:00Z" },
      { name: "Austin", hits: 4, lastSeen: "2026-11-05T12:00:00Z" },
      { name: "Los Angeles", hits: 2, lastSeen: "2026-11-01T12:00:00Z" },
    ]);
  });

  it("narrows to one region when given", () => {
    expect(cityTotals(rows, "US", "TX")).toEqual([{ name: "Austin", hits: 4, lastSeen: "2026-11-05T12:00:00Z" }]);
  });
});

describe("filterRows", () => {
  it("keeps everything with no selection", () => {
    expect(filterRows(rows, {})).toHaveLength(rows.length);
  });

  it("keeps only the selected country", () => {
    expect(filterRows(rows, { country: "US" }).every((r) => r.country?.toUpperCase() === "US")).toBe(true);
  });

  it("keeps only the selected region, so a state shows only its own traffic", () => {
    const michigan: LocationRow[] = [
      { country: "US", region: "MI", city: "Redford", hits: 1, lastSeen: null },
      { country: "US", region: "MA", city: "Boston", hits: 2, lastSeen: null },
    ];
    expect(filterRows(michigan, { country: "US", region: "MI" })).toEqual([michigan[0]]);
  });
});

describe("unknownLocationHits", () => {
  it("counts hits with no country", () => {
    expect(unknownLocationHits(rows)).toBe(7);
  });
});

describe("shadeOpacity", () => {
  it("gives no fill for zero hits and full colour for the maximum", () => {
    expect(shadeOpacity(0, 10)).toBe(0);
    expect(shadeOpacity(10, 10)).toBe(1);
    expect(shadeOpacity(5, 10)).toBeGreaterThan(0.2);
    expect(shadeOpacity(5, 10)).toBeLessThan(1);
  });
});

describe("trafficHref", () => {
  const base = { from: "2026-11-01", to: "2026-11-18" };

  it("keeps the date range and adds the selection", () => {
    expect(trafficHref(base, { country: "US", region: "CA" })).toBe(
      "/admin/traffic?from=2026-11-01&to=2026-11-18&country=US&region=CA",
    );
  });

  it("keeps the referrer filter", () => {
    expect(trafficHref({ ...base, referrer: "(direct)" }, { country: "CA" })).toBe(
      "/admin/traffic?from=2026-11-01&to=2026-11-18&referrer=%28direct%29&country=CA",
    );
  });

  it("clears the selection when given none", () => {
    expect(trafficHref(base)).toBe("/admin/traffic?from=2026-11-01&to=2026-11-18");
  });
});
