/**
 * Address verification using the Google Geocoding API.
 * Docs: https://developers.google.com/maps/documentation/geocoding
 *
 * An address is considered "verified" only when Google returns an exact-ish match
 * (not a partial match) that resolves to a street-level or rooftop location AND the
 * ZIP code and state on the result agree with what the lead entered.
 */

export type AddressInput = {
  address: string;
  city: string;
  state: string;
  zip: string;
};

export type AddressVerification = {
  verified: boolean;
  status: string;
  formattedAddress?: string;
  locationType?: string;
  partialMatch: boolean;
  zipMatches: boolean;
  stateMatches: boolean;
  reason: string;
  checkedAt: string;
};

type GoogleGeocodeResponse = {
  status: string;
  error_message?: string;
  results: Array<{
    formatted_address: string;
    partial_match?: boolean;
    geometry: { location_type: string };
    address_components: Array<{ long_name: string; short_name: string; types: string[] }>;
  }>;
};

export function buildGeocodeQuery(input: AddressInput): string {
  return [input.address, input.city, `${input.state} ${input.zip}`].join(", ");
}

export function evaluateGeocodeResponse(input: AddressInput, data: GoogleGeocodeResponse, now = new Date()): AddressVerification {
  const checkedAt = now.toISOString();
  const base = { checkedAt, status: data.status, partialMatch: false, zipMatches: false, stateMatches: false };

  if (data.status !== "OK" || data.results.length === 0) {
    return {
      ...base,
      verified: false,
      reason: data.status === "ZERO_RESULTS" ? "No matching address found" : `Lookup failed: ${data.status}`,
    };
  }

  const result = data.results[0];
  const components = result.address_components;
  const zipComponent = components.find((c) => c.types.includes("postal_code"))?.short_name ?? "";
  const stateComponent = components.find((c) => c.types.includes("administrative_area_level_1"))?.short_name ?? "";

  const zipMatches = zipComponent.slice(0, 5) === input.zip.slice(0, 5);
  const stateMatches = stateComponent.toUpperCase() === input.state.toUpperCase();
  const partialMatch = result.partial_match === true;
  const preciseEnough = ["ROOFTOP", "RANGE_INTERPOLATED"].includes(result.geometry.location_type);

  let reason = "Address verified";
  if (partialMatch) reason = "Only a partial match was found";
  else if (!preciseEnough) reason = "Location is not precise enough to confirm the street address";
  else if (!zipMatches) reason = `ZIP mismatch (lookup returned ${zipComponent || "none"})`;
  else if (!stateMatches) reason = `State mismatch (lookup returned ${stateComponent || "none"})`;

  const verified = !partialMatch && preciseEnough && zipMatches && stateMatches;

  return {
    ...base,
    verified,
    partialMatch,
    zipMatches,
    stateMatches,
    formattedAddress: result.formatted_address,
    locationType: result.geometry.location_type,
    reason,
  };
}

export async function verifyAddress(
  input: AddressInput,
  apiKey: string | undefined = process.env.GOOGLE_GEOCODING_API_KEY,
  fetchImpl: typeof fetch = fetch,
  now: Date = new Date(),
): Promise<AddressVerification> {
  if (!apiKey) {
    throw new Error("GOOGLE_GEOCODING_API_KEY is not configured");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", buildGeocodeQuery(input));
  url.searchParams.set("components", `country:US|administrative_area:${input.state}|postal_code:${input.zip.slice(0, 5)}`);
  url.searchParams.set("key", apiKey);

  const res = await fetchImpl(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Geocoding request failed with HTTP ${res.status}`);
  }
  const data = (await res.json()) as GoogleGeocodeResponse;
  return evaluateGeocodeResponse(input, data, now);
}
