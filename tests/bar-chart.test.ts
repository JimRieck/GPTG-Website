import { describe, expect, it } from "vitest";
import { buildBarChart, niceMax, shortDayLabel } from "@/lib/bar-chart";

describe("shortDayLabel", () => {
  it("formats an ISO date as a short month and day", () => {
    expect(shortDayLabel("2026-11-03")).toBe("Nov 3");
    expect(shortDayLabel("2026-01-25")).toBe("Jan 25");
  });
});

describe("niceMax", () => {
  it("rounds the axis up to a multiple of four steps", () => {
    expect(niceMax(0)).toBe(4);
    expect(niceMax(3)).toBe(4);
    expect(niceMax(7)).toBe(8);
    expect(niceMax(42)).toBe(80);
    expect(niceMax(100)).toBe(120);
  });

  it("always covers the largest value", () => {
    for (const v of [1, 9, 13, 57, 250, 999, 4321]) {
      expect(niceMax(v)).toBeGreaterThanOrEqual(v);
    }
  });
});

describe("buildBarChart", () => {
  it("gives a bar of full plot height to the largest value", () => {
    const chart = buildBarChart([
      { day: "2026-11-01", hits: 4 },
      { day: "2026-11-02", hits: 8 },
    ]);
    const [small, big] = chart.bars;
    expect(big.height).toBeGreaterThan(small.height);
    expect(big.y + big.height).toBeCloseTo(small.y + small.height, 5); // both sit on the baseline
  });

  it("draws zero-hit days as zero-height bars", () => {
    const chart = buildBarChart([
      { day: "2026-11-01", hits: 0 },
      { day: "2026-11-02", hits: 5 },
    ]);
    expect(chart.bars[0].height).toBe(0);
  });

  it("thins x-axis labels so no more than about ten show", () => {
    const points = Array.from({ length: 30 }, (_, i) => ({
      day: `2026-10-${String(i + 1).padStart(2, "0")}`,
      hits: i,
    }));
    const chart = buildBarChart(points, { maxLabels: 10 });
    expect(chart.xLabels.length).toBeLessThanOrEqual(10);
    expect(chart.xLabels[0].text).toBe("Oct 1");
  });

  it("returns y-axis ticks from zero up to the axis maximum", () => {
    const chart = buildBarChart([{ day: "2026-11-01", hits: 10 }]);
    expect(chart.yTicks[0].value).toBe(0);
    expect(chart.yTicks[4].value).toBe(niceMax(10));
  });

  it("handles an empty range without throwing", () => {
    const chart = buildBarChart([]);
    expect(chart.bars).toEqual([]);
    expect(chart.yTicks).toHaveLength(5);
  });
});
