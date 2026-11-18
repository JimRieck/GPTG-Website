import { describe, expect, it } from "vitest";
import {
  cityTotals,
  countryTotals,
  regionTotals,
  shadeOpacity,
  trafficHref,
  unknownLocationHits,
  type LocationRow,
} from "@/lib/traffic-geo";

const rows: LocationRow[] = [
  { country: "US", region: "CA", city: "San Jose", hits: 5 },
  { country: "US", region: "CA", city: "Los Angeles", hits: 2 },
  { country: "US", region: "TX", city: "Austin", hits: 4 },
  { country: "us", region: "CA", city: "San Jose", hits: 1 },
  { country: "CA", region: "ON", city: "Toronto", hits: 3 },
  { country: null, region: null, city: null, hits: 7 },
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
      { name: "CA", hits: 8 },
      { name: "TX", hits: 4 },
    ]);
  });

  it("returns nothing for a country with no regions", () => {
    expect(regionTotals(rows, "FR")).toEqual([]);
  });
});

describe("cityTotals", () => {
  it("lists cities in a country, largest first", () => {
    expect(cityTotals(rows, "US")).toEqual([
      { name: "San Jose", hits: 6 },
      { name: "Austin", hits: 4 },
      { name: "Los Angeles", hits: 2 },
    ]);
  });

  it("narrows to one region when given", () => {
    expect(cityTotals(rows, "US", "TX")).toEqual([{ name: "Austin", hits: 4 }]);
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
