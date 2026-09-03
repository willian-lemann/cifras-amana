/**
 * Validates that all required environment variables are set before the app starts.
 * Import this in instrumentation.ts or layout.tsx to fail fast on misconfiguration.
 */

const requiredServerEnvVars = [] as const;

const optionalServerEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "ANTHROPIC_API_KEY",
  "SENTRY_AUTH_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "TRIGGER_SECRET_KEY",
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const key of requiredServerEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\nPlease set them in your .env file or deployment environment.`,
    );
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL!;
  if (!dbUrl.startsWith("postgresql://") && !dbUrl.startsWith("postgres://")) {
    throw new Error(
      "❌ DATABASE_URL must be a valid PostgreSQL connection string",
    );
  }

  // Validate Stripe keys format
  if (
    process.env.NODE_ENV === "production" &&
    process.env.STRIPE_SECRET_KEY!.startsWith("sk_test_")
  ) {
    console.warn(
      "⚠️ WARNING: Using Stripe TEST key in production environment!",
    );
  }

  // Warn about optional missing vars
  const missingOptional: string[] = [];
  for (const key of optionalServerEnvVars) {
    if (!process.env[key]) {
      missingOptional.push(key);
    }
  }

  if (missingOptional.length > 0) {
    console.warn(
      `⚠️ Optional environment variables not set: ${missingOptional.join(", ")}`,
    );
  }
}
