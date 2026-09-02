import { describe, it, expect } from "vitest";
import { plans } from "@/components/subscription/plans";

describe("subscription plans", () => {
  it("has exactly 2 plans", () => {
    expect(plans).toHaveLength(2);
  });

  it("has starter as first plan", () => {
    expect(plans[0].id).toBe("starter");
  });

  it("has professional as second plan", () => {
    expect(plans[1].id).toBe("professional");
  });

  it("professional plan is marked as popular", () => {
    const pro = plans.find((p) => p.id === "professional");
    expect(pro?.popular).toBe(true);
  });

  it("starter plan is not popular", () => {
    const starter = plans.find((p) => p.id === "starter");
    expect(starter?.popular).toBe(false);
  });

  it("all plans have required fields", () => {
    for (const plan of plans) {
      expect(plan.id).toBeDefined();
      expect(plan.name).toBeDefined();
      expect(plan.price).toBeGreaterThan(0);
      expect(plan.priceFormatted).toMatch(/R\$/);
      expect(plan.period).toBe("/mês");
      expect(plan.description).toBeDefined();
      expect(plan.features.length).toBeGreaterThan(0);
      expect(plan.cta).toBeDefined();
    }
  });

  it("professional plan price is higher than starter", () => {
    const starter = plans.find((p) => p.id === "starter")!;
    const pro = plans.find((p) => p.id === "professional")!;
    expect(pro.price).toBeGreaterThan(starter.price);
  });
});
