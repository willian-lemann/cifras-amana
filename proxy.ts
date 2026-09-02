import { NextRequest, NextResponse } from "next/server";

import { SUBDOMAINS_ENABLED } from "@/lib/config";
import { rootDomains } from "@/lib/next-config/subdomains";
import { aiRateLimit, authRateLimit, uploadRateLimit } from "./lib/ratelimit";

// ─── Subdomain (multi-tenant) routing ─────────────────────────────────────────
// When enabled, `tenant.<root>/<path>` is rewritten to `/s/<tenant>/<path>` so
// pages under `app/(subdomains)/s/[subdomain]` can render tenant content.
//
// To turn it on: set NEXT_PUBLIC_SUBDOMAINS_ENABLED=true and add your root
// domains in `lib/next-config/subdomains.ts`. That is the only wiring needed.

const SUBDOMAIN_HEADER = "x-subdomain";
const TENANT_BASE_PATH = "/s";

function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();

  for (const root of rootDomains) {
    const suffix = `.${root}`;
    if (!hostname.endsWith(suffix)) continue;

    const subdomain = hostname.slice(0, -suffix.length);
    // Reject empty, "www", or multi-level (a.b) subdomains.
    if (!subdomain || subdomain === "www" || subdomain.includes(".")) {
      return null;
    }
    return subdomain;
  }

  return null;
}

function handleSubdomainRouting(req: NextRequest): NextResponse | null {
  if (!SUBDOMAINS_ENABLED) return null;

  const host = req.headers.get("host") ?? "";
  const subdomain = extractSubdomain(host);
  if (!subdomain) return null;

  const url = req.nextUrl.clone();
  url.pathname = `${TENANT_BASE_PATH}/${subdomain}${url.pathname}`;

  // Mark the request as originating from a subdomain rewrite so route handlers
  // can trust it. Strip any user-supplied value first to prevent spoofing.
  const forwardedHeaders = new Headers(req.headers);
  forwardedHeaders.delete(SUBDOMAIN_HEADER);
  forwardedHeaders.set(SUBDOMAIN_HEADER, subdomain);

  return NextResponse.rewrite(url, { request: { headers: forwardedHeaders } });
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [process.env.NEXT_PUBLIC_APP_URL].filter(
  Boolean,
) as string[];

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function applyCors(response: NextResponse, origin: string | null): void {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Non-API requests: subdomain routing only. API logic below stays untouched.
  const isNotAPI = !pathname.startsWith("/api");
  if (isNotAPI) {
    const subdomainResponse = handleSubdomainRouting(req);

    if (!subdomainResponse) {
      const forwardedHeaders = new Headers();
      forwardedHeaders.set("x-pathname", req.nextUrl.pathname);
      return NextResponse.next({ headers: forwardedHeaders });
    }

    return subdomainResponse;
  }

  const ip = getIp(req);
  const origin = req.headers.get("origin");

  // Handle CORS preflight before rate limiting
  if (req.method === "OPTIONS") {
    const preflightResponse = new NextResponse(null, {
      status: origin && ALLOWED_ORIGINS.includes(origin) ? 204 : 403,
    });
    applyCors(preflightResponse, origin);
    return preflightResponse;
  }

  // Rate limit: Auth endpoints — brute-force protection.
  if (pathname.startsWith("/api/auth")) {
    const { success } = await authRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente mais tarde." },
        { status: 429 },
      );
    }
  }

  // Rate limit: AI endpoints.
  if (pathname.startsWith("/api/ai/")) {
    const { success } = await aiRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Limite de requisições de IA atingido. Aguarde." },
        { status: 429 },
      );
    }
  }

  // Rate limit: Uploads.
  if (pathname.startsWith("/api/upload")) {
    const { success } = await uploadRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Muitos uploads. Aguarde um momento." },
        { status: 429 },
      );
    }
  }

  // Enforce HTTPS redirect in production
  const proto = req.headers.get("x-forwarded-proto");
  if (proto === "http" && process.env.NODE_ENV === "production") {
    const httpsUrl = req.nextUrl.clone();
    httpsUrl.protocol = "https";
    return NextResponse.redirect(httpsUrl, 301);
  }

  const response = NextResponse.next();
  applyCors(response, origin);
  return response;
}

export const config = {
  matcher: ["/((?!_next|_vercel|\\.well-known|.*\\.\\w+$).*)"],
};
