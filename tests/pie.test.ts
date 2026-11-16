import { describe, expect, it } from "vitest";
import { buildPieSlices } from "@/lib/pie";

describe("buildPieSlices", () => {
  it("returns no slices when every value is zero", () => {
    expect(buildPieSlices([{ label: "New", value: 0, color: "#000" }])).toEqual([]);
  });

  it("draws a full circle (no path) for a single status", () => {
    const [slice] = buildPieSlices([{ label: "New", value: 5, color: "#000" }]);
    expect(slice.percent).toBe(100);
    expect(slice.path).toBeNull();
  });

  it("splits percentages across statuses and skips zero values", () => {
    const slices = buildPieSlices([
      { label: "New", value: 3, color: "#a" },
      { label: "Won", value: 0, color: "#b" },
      { label: "Lost", value: 1, color: "#c" },
    ]);
    expect(slices.map((s) => s.label)).toEqual(["New", "Lost"]);
    expect(slices[0].percent).toBeCloseTo(75);
    expect(slices[1].percent).toBeCloseTo(25);
    expect(slices[0].path).toMatch(/^M 100 100 L/);
  });

  it("uses the large-arc flag for slices over half the pie", () => {
    const [big] = buildPieSlices([
      { label: "A", value: 3, color: "#a" },
      { label: "B", value: 1, color: "#b" },
    ]);
    expect(big.path).toContain(" 0 1 1 ");
  });
});
