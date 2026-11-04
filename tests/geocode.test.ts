import { describe, expect, it, vi } from "vitest";
import { buildGeocodeQuery, evaluateGeocodeResponse, verifyAddress } from "@/lib/geocode";

const input = { address: "1600 Amphitheatre Pkwy", city: "Mountain View", state: "CA", zip: "94043" };

function okResponse(overrides: Partial<{ partial_match: boolean; location_type: string; zip: string; state: string }> = {}) {
  return {
    status: "OK",
    results: [
      {
        formatted_address: "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
        partial_match: overrides.partial_match,
        geometry: { location_type: overrides.location_type ?? "ROOFTOP" },
        address_components: [
          { long_name: "94043", short_name: overrides.zip ?? "94043", types: ["postal_code"] },
          { long_name: "California", short_name: overrides.state ?? "CA", types: ["administrative_area_level_1"] },
        ],
      },
    ],
  };
}

describe("evaluateGeocodeResponse", () => {
  it("verifies a precise match whose ZIP and state agree", () => {
    const r = evaluateGeocodeResponse(input, okResponse());
    expect(r.verified).toBe(true);
    expect(r.reason).toBe("Address verified");
    expect(r.formattedAddress).toContain("Amphitheatre");
  });

  it("does not verify a partial match", () => {
    const r = evaluateGeocodeResponse(input, okResponse({ partial_match: true }));
    expect(r.verified).toBe(false);
    expect(r.partialMatch).toBe(true);
  });

  it("does not verify an approximate location", () => {
    const r = evaluateGeocodeResponse(input, okResponse({ location_type: "APPROXIMATE" }));
    expect(r.verified).toBe(false);
  });

  it("flags a ZIP mismatch", () => {
    const r = evaluateGeocodeResponse(input, okResponse({ zip: "94044" }));
    expect(r.verified).toBe(false);
    expect(r.zipMatches).toBe(false);
  });

  it("flags a state mismatch", () => {
    const r = evaluateGeocodeResponse(input, okResponse({ state: "NV" }));
    expect(r.verified).toBe(false);
    expect(r.stateMatches).toBe(false);
  });

  it("handles ZERO_RESULTS", () => {
    const r = evaluateGeocodeResponse(input, { status: "ZERO_RESULTS", results: [] });
    expect(r.verified).toBe(false);
    expect(r.reason).toBe("No matching address found");
  });

  it("reports API-level failures", () => {
    const r = evaluateGeocodeResponse(input, { status: "REQUEST_DENIED", results: [] });
    expect(r.verified).toBe(false);
    expect(r.reason).toContain("REQUEST_DENIED");
  });
});

describe("buildGeocodeQuery", () => {
  it("joins the address parts into one query string", () => {
    expect(buildGeocodeQuery(input)).toBe("1600 Amphitheatre Pkwy, Mountain View, CA 94043");
  });
});

describe("verifyAddress", () => {
  it("throws when no API key is configured", async () => {
    await expect(verifyAddress(input, undefined)).rejects.toThrow(/GOOGLE_GEOCODING_API_KEY/);
  });

  it("calls the Geocoding API with the key and evaluates the response", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(okResponse()), { status: 200 }));
    const r = await verifyAddress(input, "test-key", fetchMock as unknown as typeof fetch, new Date("2026-01-01T00:00:00Z"));
    expect(r.verified).toBe(true);
    expect(r.checkedAt).toBe("2026-01-01T00:00:00.000Z");
    const calledUrl = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(calledUrl).toContain("key=test-key");
    expect(calledUrl).toContain("maps.googleapis.com");
  });

  it("throws on HTTP errors", async () => {
    const fetchMock = vi.fn(async () => new Response("nope", { status: 500 }));
    await expect(verifyAddress(input, "k", fetchMock as unknown as typeof fetch)).rejects.toThrow(/HTTP 500/);
  });
});
