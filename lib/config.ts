/**
 * Central app configuration.
 *
 * This is the one place to rebrand the boilerplate and toggle features.
 */

/** Display name used across the UI, metadata, and cookie prefix. */
export const APP_NAME = "Cifras Amana";

/** Lowercase slug used for the auth cookie prefix. Keep it stable. */
export const APP_SLUG = "app";

/**
 * Multi-tenant subdomain routing.
 *
 * When enabled, the middleware rewrites `tenant.<root>/*` to
 * `app/(subdomains)/[subdomain]/*`. Off by default — flip the env var and add
 * your root domains in `lib/next-config/subdomains.ts` to turn it on.
 */
export const SUBDOMAINS_ENABLED =
  process.env.NEXT_PUBLIC_SUBDOMAINS_ENABLED === "true";
