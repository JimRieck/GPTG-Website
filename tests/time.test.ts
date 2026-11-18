import { describe, expect, it } from "vitest";
import { formatEastern, SITE_TIME_ZONE } from "@/lib/time";

describe("formatEastern", () => {
  it("uses the Eastern time zone", () => {
    expect(SITE_TIME_ZONE).toBe("America/New_York");
  });

  it("shows EST in winter", () => {
    // 2026-01-15 17:00 UTC is 12:00 EST
    expect(formatEastern("2026-01-15T17:00:00Z")).toContain("EST");
    expect(formatEastern("2026-01-15T17:00:00Z")).toContain("12:00");
  });

  it("shows EDT in summer", () => {
    // 2026-07-15 16:00 UTC is 12:00 EDT
    expect(formatEastern("2026-07-15T16:00:00Z")).toContain("EDT");
    expect(formatEastern("2026-07-15T16:00:00Z")).toContain("12:00");
  });
});
