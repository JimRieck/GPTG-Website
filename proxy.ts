import { NextResponse, after, type NextRequest } from "next/server";
import { decodeLocationHeader, normalizePath, referrerDomain, shouldTrackRequest } from "@/lib/traffic-rules";
import { recordPageView } from "@/lib/traffic";

// Counts public page views. Admin pages, API routes, Next assets and files are skipped by the matcher.
export function proxy(request: NextRequest) {
  const trackable = shouldTrackRequest({
    method: request.method,
    accept: request.headers.get("accept"),
    rsc: request.headers.get("rsc"),
    routerPrefetch: request.headers.get("next-router-prefetch"),
    userAgent: request.headers.get("user-agent"),
  });

  if (trackable) {
    const path = normalizePath(request.nextUrl.pathname);
    // Location comes from Vercel's IP headers. They are empty during local development.
    const meta = {
      country: decodeLocationHeader(request.headers.get("x-vercel-ip-country")),
      region: decodeLocationHeader(request.headers.get("x-vercel-ip-country-region")),
      city: decodeLocationHeader(request.headers.get("x-vercel-ip-city")),
      referrerDomain: referrerDomain(request.headers.get("referer"), request.nextUrl.hostname),
    };
    // after() writes the row once the response is sent, so the visitor does not wait on the database.
    after(() => recordPageView(path, meta));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|admin(?:/|$)|api(?:/|$)|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)"],
};
