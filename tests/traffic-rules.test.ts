import { describe, expect, it } from "vitest";
import {
  cleanFilters,
  decodeLocationHeader,
  normalizePath,
  parseDateRange,
  referrerDomain,
  shouldTrackRequest,
} from "@/lib/traffic-rules";

describe("decodeLocationHeader", () => {
  it("decodes URL-encoded city names", () => {
    expect(decodeLocationHeader("San%20Jos%C3%A9")).toBe("San José");
  });

  it("returns null for missing or blank values", () => {
    expect(decodeLocationHeader(null)).toBeNull();
    expect(decodeLocationHeader("   ")).toBeNull();
  });

  it("keeps a value that is not valid URL encoding", () => {
    expect(decodeLocationHeader("100%")).toBe("100%");
  });
});

describe("referrerDomain", () => {
  const own = "www.greenpasturestech.com";

  it("returns the referring host without www", () => {
    expect(referrerDomain("https://www.google.com/search?q=gpt", own)).toBe("google.com");
    expect(referrerDomain("https://linkedin.com/feed/", own)).toBe("linkedin.com");
  });

  it("ignores visits with no referrer", () => {
    expect(referrerDomain(null, own)).toBeNull();
  });

  it("ignores internal navigation from the site itself", () => {
    expect(referrerDomain("https://greenpasturestech.com/contact", own)).toBeNull();
    expect(referrerDomain("https://www.greenpasturestech.com/", own)).toBeNull();
  });

  it("ignores malformed referrers", () => {
    expect(referrerDomain("not a url", own)).toBeNull();
  });
});

describe("cleanFilters", () => {
  it("turns empty values into undefined so they mean all", () => {
    expect(cleanFilters({ country: "", region: "  ", city: undefined, referrer: "google.com" })).toEqual({
      country: undefined,
      region: undefined,
      city: undefined,
      referrer: "google.com",
    });
  });
});

const browser = {
  method: "GET",
  accept: "text/html,application/xhtml+xml",
  rsc: null,
  routerPrefetch: null,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0",
};

describe("shouldTrackRequest", () => {
  it("counts a normal browser page load", () => {
    expect(shouldTrackRequest(browser)).toBe(true);
  });

  it("ignores non-GET requests", () => {
    expect(shouldTrackRequest({ ...browser, method: "POST" })).toBe(false);
  });

  it("ignores requests that do not ask for HTML", () => {
    expect(shouldTrackRequest({ ...browser, accept: "image/png,*/*" })).toBe(false);
    expect(shouldTrackRequest({ ...browser, accept: null })).toBe(false);
  });

  it("ignores client-side navigation data and prefetches", () => {
    expect(shouldTrackRequest({ ...browser, rsc: "1" })).toBe(false);
    expect(shouldTrackRequest({ ...browser, routerPrefetch: "1" })).toBe(false);
  });

  it("ignores bots, crawlers, and requests with no user agent", () => {
    expect(shouldTrackRequest({ ...browser, userAgent: "Googlebot/2.1" })).toBe(false);
    expect(shouldTrackRequest({ ...browser, userAgent: "facebookexternalhit/1.1" })).toBe(false);
    expect(shouldTrackRequest({ ...browser, userAgent: null })).toBe(false);
  });
});

describe("normalizePath", () => {
  it("keeps the home page as /", () => {
    expect(normalizePath("/")).toBe("/");
  });

  it("drops trailing slashes and query strings", () => {
    expect(normalizePath("/contact/")).toBe("/contact");
    expect(normalizePath("/contact?utm=1")).toBe("/contact");
  });

  it("caps very long paths", () => {
    expect(normalizePath("/" + "a".repeat(500))).toHaveLength(300);
  });
});

describe("parseDateRange", () => {
  const today = "2026-11-18";

  it("defaults to the last 30 days ending today", () => {
    expect(parseDateRange(undefined, undefined, today)).toEqual({ start: "2026-10-20", end: "2026-11-18" });
  });

  it("uses a valid requested range as given", () => {
    expect(parseDateRange("2026-11-01", "2026-11-05", today)).toEqual({ start: "2026-11-01", end: "2026-11-05" });
  });

  it("swaps a reversed range", () => {
    expect(parseDateRange("2026-11-05", "2026-11-01", today)).toEqual({ start: "2026-11-01", end: "2026-11-05" });
  });

  it("falls back to the default for malformed or impossible dates", () => {
    expect(parseDateRange("11/01/2026", "2026-11-05", today).start).toBe("2026-10-20");
    expect(parseDateRange("2026-02-30", "2026-03-01", today).start).toBe("2026-10-20");
  });

  it("rejects ranges longer than 366 days with an error", () => {
    const result = parseDateRange("2025-01-01", "2026-11-18", today);
    expect(result.error).toBeDefined();
    expect(result.start).toBe("2026-10-20");
  });

  it("accepts a range of exactly 366 days", () => {
    expect(parseDateRange("2025-11-18", "2026-11-18", today).error).toBeUndefined();
  });
});
