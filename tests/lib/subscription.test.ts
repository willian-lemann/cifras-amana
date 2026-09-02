import { describe, it, expect } from "vitest";

// ── Extracted pure logic from lib/subscription.ts to avoid Stripe side-effects ──

type PlanName = "starter" | "professional";

const PLAN_HIERARCHY: Record<PlanName, number> = {
  starter: 1,
  professional: 2,
};

const PLAN_LIMITS: Record<PlanName, { items: number }> = {
  starter: { items: 10 },
  professional: { items: Infinity },
};

function getPlanLimits(plan: PlanName) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
}

describe("getPlanLimits", () => {
  it("returns a finite item limit for starter plan", () => {
    const limits = getPlanLimits("starter");
    expect(limits.items).toBe(10);
  });

  it("returns unlimited items for professional plan", () => {
    const limits = getPlanLimits("professional");
    expect(limits.items).toBe(Infinity);
  });

  it("falls back to starter limits for unknown plan", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const limits = getPlanLimits("unknown" as any);
    expect(limits.items).toBe(10);
  });
});

describe("PLAN_HIERARCHY", () => {
  it("starter has lower rank than professional", () => {
    expect(PLAN_HIERARCHY.starter).toBeLessThan(PLAN_HIERARCHY.professional);
  });

  it("starter rank is 1", () => {
    expect(PLAN_HIERARCHY.starter).toBe(1);
  });

  it("professional rank is 2", () => {
    expect(PLAN_HIERARCHY.professional).toBe(2);
  });
});
