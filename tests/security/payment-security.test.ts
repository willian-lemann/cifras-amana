import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

// ─── A5: Stripe Payment Security ────────────────────────────────────────────

describe("Server-Side Prices — No Client Price Submission (A5)", () => {
  const authSource = readFileSync(path.join(ROOT, "lib/auth.ts"), "utf-8");

  it("uses STRIPE_STARTER_PRICE_ID from env (not hardcoded)", () => {
    expect(authSource).toMatch(/process\.env\.STRIPE_STARTER_PRICE_ID/);
  });

  it("uses STRIPE_PROFESSIONAL_PRICE_ID from env (not hardcoded)", () => {
    expect(authSource).toMatch(/process\.env\.STRIPE_PROFESSIONAL_PRICE_ID/);
  });

  it("frontend plans.ts contains display prices only (no Stripe price IDs)", () => {
    const plansSource = readFileSync(
      path.join(ROOT, "components/subscription/plans.ts"),
      "utf-8",
    );
    // Should NOT contain actual Stripe price IDs
    expect(plansSource).not.toMatch(/price_[a-zA-Z0-9]{10,}/);
    // Should NOT contain process.env references
    expect(plansSource).not.toMatch(/process\.env/);
    // Should have display-only price fields
    expect(plansSource).toMatch(/priceFormatted/);
  });
});

describe("Webhook Signature Verification (A5)", () => {
  const authSource = readFileSync(path.join(ROOT, "lib/auth.ts"), "utf-8");

  it("configures stripeWebhookSecret", () => {
    expect(authSource).toMatch(
      /stripeWebhookSecret:\s*process\.env\.STRIPE_WEBHOOK_SECRET/,
    );
  });

  it("STRIPE_WEBHOOK_SECRET is in required env vars", () => {
    const validateEnv = readFileSync(
      path.join(ROOT, "lib/validate-env.ts"),
      "utf-8",
    );
    expect(validateEnv).toContain('"STRIPE_WEBHOOK_SECRET"');
  });
});

describe("Subscription Status Checked from DB (A5)", () => {
  const subscriptionSource = readFileSync(
    path.join(ROOT, "lib/subscription.ts"),
    "utf-8",
  );

  it("checks subscription status via auth.api.listActiveSubscriptions", () => {
    expect(subscriptionSource).toMatch(/auth\.api\.listActiveSubscriptions/);
  });

  it("filters for active or trialing status", () => {
    expect(subscriptionSource).toMatch(/status\s*===\s*["']active["']/);
    expect(subscriptionSource).toMatch(/status\s*===\s*["']trialing["']/);
  });

  it("defines plan hierarchy for authorization", () => {
    expect(subscriptionSource).toMatch(/PLAN_HIERARCHY/);
  });

  it("compares plan ranks for requireActivePlan", () => {
    expect(subscriptionSource).toMatch(/PLAN_HIERARCHY\[subPlan\]/);
    expect(subscriptionSource).toMatch(/PLAN_HIERARCHY\[minPlan\]/);
  });

  it("returns 401 for unauthenticated requests", () => {
    expect(subscriptionSource).toMatch(/status:\s*401/);
  });

  it("returns 402 for users without subscription", () => {
    expect(subscriptionSource).toMatch(/status:\s*402/);
  });

  it("returns 403 for insufficient plan tier", () => {
    expect(subscriptionSource).toMatch(/status:\s*403/);
  });
});

// ─── A9: Auth on All Protected API Routes ───────────────────────────────────

describe("Auth Consistency on Critical API Routes (A9)", () => {
  const criticalRoutes = [
    "app/api/items/route.ts",
    "app/api/upload/route.ts",
    "app/api/user/route.ts",
    "app/api/ai/generate/route.ts",
    "app/api/credits/route.ts",
  ];

  for (const route of criticalRoutes) {
    const routePath = path.join(ROOT, route);
    const content = readFileSync(routePath, "utf-8");

    it(`${route} imports auth`, () => {
      expect(content).toMatch(/import.*auth.*from\s+["']@\/lib\/auth["']/);
    });

    it(`${route} calls getSession`, () => {
      expect(content).toMatch(/auth\.api\.getSession/);
    });

    it(`${route} returns 401 for unauthenticated requests`, () => {
      expect(content).toMatch(/401/);
    });
  }
});

// ─── Rate Limiting Exists ───────────────────────────────────────────────────

describe("Rate Limiting Configuration (A6 supplement)", () => {
  const proxy = readFileSync(path.join(ROOT, "proxy.ts"), "utf-8");
  const ratelimit = readFileSync(path.join(ROOT, "lib/ratelimit.ts"), "utf-8");

  it("uses Upstash Redis for rate limiting", () => {
    expect(ratelimit).toMatch(/Ratelimit/);
    expect(ratelimit).toMatch(/Redis\.fromEnv/);
  });

  it("rate limits auth endpoints", () => {
    expect(proxy).toMatch(/\/api\/auth/);
    expect(proxy).toMatch(/authRateLimit\.limit/);
  });

  it("rate limits AI endpoints", () => {
    expect(proxy).toMatch(/\/api\/ai\//);
    expect(proxy).toMatch(/aiRateLimit\.limit/);
  });

  it("rate limits upload endpoints", () => {
    expect(proxy).toMatch(/\/api\/upload/);
    expect(proxy).toMatch(/uploadRateLimit\.limit/);
  });

  it("enforces HTTPS redirect in production", () => {
    expect(proxy).toMatch(/x-forwarded-proto/);
    expect(proxy).toMatch(/NextResponse\.redirect/);
  });
});
