// Root domains that serve tenant subdomains (e.g. "example.com" so that
// "acme.example.com" routes to the "acme" tenant). Add yours here and enable
// `NEXT_PUBLIC_SUBDOMAINS_ENABLED` to turn on subdomain routing.
//
// Sorted longest-first so subdomain extraction picks the most specific suffix.
const customDomains: string[] = [];

export const isDev = process.env.NODE_ENV === "development";

export const allowedDevOrigins = ["localhost", "*.localhost"];

export const rootDomains: readonly string[] = (() => {
  const candidates = isDev ? allowedDevOrigins : customDomains;
  return candidates
    .filter((d): d is string => Boolean(d))
    .sort((a, b) => b.length - a.length);
})();
