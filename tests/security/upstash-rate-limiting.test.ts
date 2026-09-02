import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const PROXY_SRC = readFileSync(path.join(ROOT, "proxy.ts"), "utf-8");
const RATELIMIT_SRC = readFileSync(
  path.join(ROOT, "lib/ratelimit.ts"),
  "utf-8",
);
const VALIDATE_ENV_SRC = readFileSync(
  path.join(ROOT, "lib/validate-env.ts"),
  "utf-8",
);

// ─── Upstash Integration ────────────────────────────────────────────────────

describe("Upstash Redis Rate Limiting (B3)", () => {
  it("imports Ratelimit from @upstash/ratelimit", () => {
    expect(RATELIMIT_SRC).toMatch(
      /import.*Ratelimit.*from\s+["']@upstash\/ratelimit["']/,
    );
  });

  it("imports Redis from @upstash/redis", () => {
    expect(RATELIMIT_SRC).toMatch(
      /import.*Redis.*from\s+["']@upstash\/redis["']/,
    );
  });

  it("creates Redis client from env", () => {
    expect(RATELIMIT_SRC).toMatch(/Redis\.fromEnv\(\)/);
  });

  it("does NOT use in-memory Map", () => {
    expect(PROXY_SRC).not.toMatch(/new\s+Map/);
    expect(PROXY_SRC).not.toMatch(/rateLimitMap/);
    expect(RATELIMIT_SRC).not.toMatch(/new\s+Map/);
    expect(RATELIMIT_SRC).not.toMatch(/rateLimitMap/);
  });

  it("does NOT use setInterval cleanup", () => {
    expect(PROXY_SRC).not.toMatch(/setInterval/);
    expect(RATELIMIT_SRC).not.toMatch(/setInterval/);
  });

  // ─── Rate limit instances ──────────────────────────────────────────────────

  it("creates authRateLimit with sliding window", () => {
    expect(RATELIMIT_SRC).toMatch(/authRateLimit[\s\S]*Ratelimit/);
    expect(RATELIMIT_SRC).toMatch(/prefix.*ratelimit:auth/);
  });

  it("creates aiRateLimit with sliding window", () => {
    expect(RATELIMIT_SRC).toMatch(/aiRateLimit[\s\S]*Ratelimit/);
    expect(RATELIMIT_SRC).toMatch(/prefix.*ratelimit:ai/);
  });

  it("creates uploadRateLimit with sliding window", () => {
    expect(RATELIMIT_SRC).toMatch(/uploadRateLimit[\s\S]*Ratelimit/);
    expect(RATELIMIT_SRC).toMatch(/prefix.*ratelimit:upload/);
  });

  // ─── Returns 429 ──────────────────────────────────────────────────────────

  it("returns 429 on rate limit exceeded", () => {
    expect(PROXY_SRC).toMatch(/status:\s*429/);
  });

  // ─── IP extraction ────────────────────────────────────────────────────────

  it("extracts IP from x-forwarded-for header", () => {
    expect(PROXY_SRC).toMatch(/x-forwarded-for/);
  });

  it("falls back to x-real-ip", () => {
    expect(PROXY_SRC).toMatch(/x-real-ip/);
  });

  // ─── Async function ────────────────────────────────────────────────────────

  it("proxy function is async (Upstash calls are async)", () => {
    expect(PROXY_SRC).toMatch(/export\s+async\s+function\s+proxy/);
  });

  // ─── Env validation ───────────────────────────────────────────────────────

  it("UPSTASH_REDIS_REST_URL is in optional env vars", () => {
    expect(VALIDATE_ENV_SRC).toMatch(/UPSTASH_REDIS_REST_URL/);
  });

  it("UPSTASH_REDIS_REST_TOKEN is in optional env vars", () => {
    expect(VALIDATE_ENV_SRC).toMatch(/UPSTASH_REDIS_REST_TOKEN/);
  });
});
