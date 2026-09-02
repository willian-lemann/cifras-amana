# Security Backlog

Items from the security audit (April 2025).

**Status last verified against the codebase on 2026-07-18.** Almost every item from
the original audit has since been implemented — only **B12** remains open. The
sections below record what shipped and where, so the audit trail stays intact.

## Status summary

| Item    | What it covers                               | Status      | Lives in                       |
| ------- | -------------------------------------------- | ----------- | ------------------------------ |
| B1      | `maxOutputTokens` on AI text endpoints       | ✅ Done     | `app/api/ai/**`                |
| B2      | Per-user AI usage tracking & budget caps     | ✅ Done     | `lib/ai-usage.ts`              |
| B3      | Rate limiting on Upstash Redis               | ✅ Done     | `lib/ratelimit.ts`, `proxy.ts` |
| B5      | Image reprocessing with Sharp (strip EXIF)   | ✅ Done     | `app/api/upload/route.ts`      |
| B6      | HTML escaping in template `inject()`         | ✅ Done     | `lib/sites/**`                 |
| B8      | CSRF / Origin validation on public forms     | ✅ Done     | `lib/csrf.ts`                  |
| B9      | Centralized security middleware              | ✅ Done     | `proxy.ts`                     |
| B10     | Prompt injection protection                  | ✅ Done     | `lib/prompt-sanitize.ts`       |
| B11     | API response field filtering                 | ✅ Done     | `app/api/gallery/route.ts`     |
| A7      | DOMPurify sanitization at render time        | ✅ Done     | `lib/sites/sanitize.ts`        |
| **B12** | **DNS-rebinding-proof fetch via IP pinning** | ❌ **Open** | —                              |

---

## Open items

## B12 — DNS-Rebinding-Proof Fetch via IP Pinning (watermark logo)

**Severity:** LOW (defense-in-depth)
**Effort:** Medium
**Why:** The SSRF guard on the watermark logo fetch validates the hostname's resolved IPs, then lets `fetch` resolve DNS again independently. This leaves a narrow TOCTOU window: an attacker who controls authoritative DNS for a domain (with a low TTL) can return a public IP for our validation lookup and an internal IP (e.g. `169.254.169.254`) for the `fetch` connection — "DNS rebinding". The already-shipped fix closes the practical vectors (redirect-based bypass and static internal-A-record); this item closes only the residual rebinding race.

### Current State

- **File:** `app/api/upload/watermark/route.ts` — `fetchLogo()` follows redirects manually and re-runs `assertSafeRemoteUrl` (from `lib/ssrf.ts`) on every hop.
- **File:** `lib/ssrf.ts` — `assertSafeRemoteUrl()` does `dns.lookup(host, { all: true })` and rejects private/link-local/loopback/CGNAT addresses.
- The gap: validation and the actual `fetch` connection perform **two separate DNS resolutions**. We validate the hostname, not a pinned IP.
- **Reachability of the residual risk is low:** endpoint requires an authenticated user on an active paid ("starter") plan; the response body is only returned when `content-type` starts with `image/`, so internal endpoints returning `text/plain`/`json` yield a _blind_ SSRF (no content exfiltration); and the attack additionally requires controlling authoritative DNS and winning a timing race.

### Implementation

1. **Resolve once, validate, then pin the connection to that IP** so `fetch` never re-resolves:
   - Node's `fetch` (undici) accepts a per-request `dispatcher`. Build an `undici.Agent` whose `connect` uses a custom `lookup` that returns only the pre-validated IP.
   - For HTTPS, keep the original hostname for TLS SNI + certificate validation (`servername`) while the socket connects to the pinned IP — do **not** connect to the IP with the hostname dropped, or cert validation breaks.

   ```typescript
   import { Agent } from "undici";
   import { lookup as dnsLookup } from "node:dns";

   // pinnedIp = the single address we already validated as public
   function pinnedDispatcher(pinnedIp: string) {
     return new Agent({
       connect: {
         lookup: (_hostname, _opts, cb) =>
           cb(null, pinnedIp, pinnedIp.includes(":") ? 6 : 4),
       },
     });
   }
   // fetch(url, { dispatcher: pinnedDispatcher(pinnedIp), redirect: "manual" })
   ```

2. **Re-pin on every redirect hop** — resolve + validate + pin the new target before following, keeping the existing manual-redirect loop.

3. Consider extracting a shared `safeImageFetch(url, { maxBytes, timeoutMs })` into `lib/ssrf.ts` so any future server-side image fetch inherits the pinning (today only the watermark route needs it; `/api/og` is already restricted to the R2 allowlist and does not need this).

### Files to Modify

- `lib/ssrf.ts` — add IP-pinned fetch helper (resolve → validate → pin).
- `app/api/upload/watermark/route.ts` — use the pinned fetch in `fetchLogo`.

### Tests

- A host whose DNS resolves to a public IP on validation but an internal IP on connect still cannot reach the internal target (mock `lookup` to return different IPs per call; assert the pinned IP is used).
- Legitimate external HTTPS logos on public IPs still download, with TLS/SNI intact.
- Redirects to internal hosts remain blocked after re-pinning.

---

## Completed items

Kept as a record of what the audit asked for and where it landed. Each has
coverage under `tests/security/`.

## B2 — Per-User AI Usage Tracking & Budget Caps ✅

**Severity:** CRITICAL — **Done**
**Was:** No visibility or cap on per-user AI spend; a single user could make unlimited AI calls.
**Implemented in:**

- `prisma/schema.prisma` — `AiUsageLog` model (per-call token/cost log).
- `lib/ai-usage.ts` — `logAiUsage()`, `checkBudget()` (plan-based monthly limits).
- Budget check + logging wired into `app/api/ai/generate-description`, `generate-instagram-post`, `edit-image`, and `generate-site` routes (returns `402` when over budget).
  **Tests:** `tests/security/ai-usage-tracking.test.ts`

## B3 — Rate Limiting on Upstash Redis ✅

**Severity:** CRITICAL — **Done**
**Was:** In-memory `Map` rate limiting that never held across Vercel serverless instances.
**Implemented in:**

- `lib/ratelimit.ts` — `@upstash/ratelimit` + `@upstash/redis`, sliding-window limiters per surface (auth, leads, views, AI, upload, intake).
- `proxy.ts` — applies the limiters; the old in-memory `Map` is gone.
- `lib/validate-env.ts` — validates `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
  **Tests:** `tests/security/upstash-rate-limiting.test.ts`

## B5 — Image Reprocessing with Sharp ✅

**Severity:** HIGH — **Done**
**Was:** Uploads stored as-is on R2, keeping EXIF (GPS/device) and possible polyglot payloads.
**Implemented in:**

- `app/api/upload/route.ts` — Sharp pipeline after magic-byte validation: `.rotate()`, metadata stripped, re-encoded, dimensions capped; videos bypass Sharp.
- `sharp` dependency added; `serverExternalPackages` configured for bundling.
  **Tests:** `tests/security/image-reprocessing.test.ts`

## B8 — CSRF / Origin Validation on Public Form Endpoints ✅

**Severity:** HIGH — **Done**
**Was:** Public lead endpoints accepted cross-origin POSTs with no Origin check.
**Implemented in:**

- `lib/csrf.ts` — `validateOrigin()` (Origin with Referer fallback, allowlist-based).
- Enforced in `app/api/hotsites/[id]/lead/route.ts` and `app/api/corretor/lead/route.ts` (403 on mismatch).
  **Tests:** `tests/security/csrf-protection.test.ts`

## B9 — Centralized Security Middleware ✅

**Severity:** MEDIUM — **Done**
**Was:** No single entrypoint for CORS / request-level security policy.
**Implemented in:**

- `proxy.ts` — the single security entrypoint. (Next.js 16 renamed `middleware.ts` → `proxy.ts`; this project uses that convention.) Handles rate limiting and origin/CORS handling centrally, delegating DB-backed auth to the route handlers.
  **Tests:** `tests/security/middleware.test.ts`

## B10 — Prompt Injection Protection ✅

**Severity:** MEDIUM — **Done**
**Was:** AI endpoints interpolated raw listing data straight into prompts.
**Implemented in:**

- `lib/prompt-sanitize.ts` — `sanitizeForPrompt()` (strips control chars, caps length) and injection-pattern detection.
- Applied in `generate-description`, `generate-instagram-post`, and the `generate-site` site/hotsite engines before prompt construction.
  **Tests:** `tests/security/prompt-injection.test.ts`

## B11 — API Response Field Filtering ✅

**Severity:** MEDIUM — **Done**
**Was:** Gallery GET returned full Prisma objects, leaking `prompt`, `originalImage`, `editedImage`.
**Implemented in:**

- `app/api/gallery/route.ts` — explicit `select` returning only client-safe fields (`id`, `url`, `order`, `createdAt`, `mime_type`, plus scoped `Listings`).
  **Tests:** `tests/security/api-field-filtering.test.ts`
