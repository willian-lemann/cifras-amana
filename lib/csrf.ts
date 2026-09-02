/**
 * CSRF / Origin validation for public form endpoints.
 * Validates the Origin or Referer header against an allowlist.
 */

// Add any additional production origins here (or drive them from env).
const ALLOWED_ORIGINS = [process.env.NEXT_PUBLIC_APP_URL].filter(
  Boolean,
) as string[];

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // POST requests from browsers always include Origin
  if (origin) return ALLOWED_ORIGINS.some((o) => origin.startsWith(o));

  // Fallback to Referer for edge cases
  if (referer) return ALLOWED_ORIGINS.some((o) => referer.startsWith(o));

  // No Origin/Referer = likely non-browser client — block
  return false;
}
