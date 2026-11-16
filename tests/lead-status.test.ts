import { describe, expect, it } from "vitest";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, isLeadStatus } from "@/lib/lead-status";

describe("lead status", () => {
  it("accepts every defined status", () => {
    for (const s of LEAD_STATUSES) expect(isLeadStatus(s)).toBe(true);
  });

  it("rejects unknown or non-string values", () => {
    expect(isLeadStatus("closed")).toBe(false);
    expect(isLeadStatus("")).toBe(false);
    expect(isLeadStatus(undefined)).toBe(false);
    expect(isLeadStatus(42)).toBe(false);
  });

  it("has a label for every status", () => {
    for (const s of LEAD_STATUSES) expect(LEAD_STATUS_LABELS[s]).toBeTruthy();
  });
});
