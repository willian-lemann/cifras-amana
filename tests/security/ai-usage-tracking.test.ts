import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { AI_PLAN_LIMITS } from "../../lib/ai-usage";

const ROOT = path.resolve(__dirname, "../..");

function readSrc(relativePath: string) {
  return readFileSync(path.join(ROOT, relativePath), "utf-8");
}

const SCHEMA = readSrc("prisma/schema.prisma");
const AI_USAGE_SRC = readSrc("lib/ai-usage.ts");
const GENERATE_SRC = readSrc("app/api/ai/generate/route.ts");

// ─── Prisma Schema ───────────────────────────────────────────────────────────

describe("AiUsageLog Prisma Model (B2)", () => {
  it("defines AiUsageLog model", () => {
    expect(SCHEMA).toMatch(/model\s+AiUsageLog\s*\{/);
  });

  it("has userId field with relation to User", () => {
    expect(SCHEMA).toMatch(/userId\s+String/);
    expect(SCHEMA).toMatch(/user\s+User\s+@relation\(fields:\s*\[userId\]/);
  });

  it("has endpoint field", () => {
    expect(SCHEMA).toMatch(/endpoint\s+String/);
  });

  it("has model field", () => {
    // Escape "model" keyword — look in the AiUsageLog block context
    const aiModel = SCHEMA.match(
      /model\s+AiUsageLog\s*\{[\s\S]*?model\s+String/,
    );
    expect(aiModel).not.toBeNull();
  });

  it("has tokensIn and tokensOut fields", () => {
    expect(SCHEMA).toMatch(/tokensIn\s+Int/);
    expect(SCHEMA).toMatch(/tokensOut\s+Int/);
  });

  it("has costCents field", () => {
    expect(SCHEMA).toMatch(/costCents\s+Int/);
  });

  it("has composite index on userId + createdAt", () => {
    expect(SCHEMA).toMatch(/@@index\(\[userId,\s*createdAt\]\)/);
  });

  it("User model has AiUsageLogs relation", () => {
    const userBlock = SCHEMA.match(/model\s+User\s*\{[\s\S]*?@@map\("user"\)/);
    expect(userBlock).not.toBeNull();
    expect(userBlock![0]).toMatch(/AiUsageLogs\s+AiUsageLog\[\]/);
  });
});

// ─── AI Usage Helper ─────────────────────────────────────────────────────────

describe("lib/ai-usage.ts helper (B2)", () => {
  it("exports logAiUsage function", () => {
    expect(AI_USAGE_SRC).toMatch(/export\s+async\s+function\s+logAiUsage/);
  });

  it("exports getMonthlyUsage function", () => {
    expect(AI_USAGE_SRC).toMatch(/export\s+async\s+function\s+getMonthlyUsage/);
  });

  it("exports checkBudget function", () => {
    expect(AI_USAGE_SRC).toMatch(/export\s+async\s+function\s+checkBudget/);
  });

  it("exports AI_PLAN_LIMITS with starter and professional", () => {
    expect(AI_PLAN_LIMITS).toHaveProperty("starter");
    expect(AI_PLAN_LIMITS).toHaveProperty("professional");
    expect(AI_PLAN_LIMITS.starter).toBeLessThan(AI_PLAN_LIMITS.professional);
  });

  it("defines pricing for gpt-4o, gpt-4o-mini, and gpt-image-1.5", () => {
    expect(AI_USAGE_SRC).toMatch(/gpt-4o/);
    expect(AI_USAGE_SRC).toMatch(/gpt-4o-mini/);
    expect(AI_USAGE_SRC).toMatch(/gpt-image-1\.5/);
    expect(AI_USAGE_SRC).not.toMatch(/dall-e-3/);
  });

  it("queries monthly usage based on startOfMonth date", () => {
    expect(AI_USAGE_SRC).toMatch(/startOfMonth/);
    expect(AI_USAGE_SRC).toMatch(/createdAt.*gte.*startOfMonth/);
  });
});

// ─── Route Integration ───────────────────────────────────────────────────────

describe("AI route budget check + logging integration (B2)", () => {
  it("generate imports checkBudget and logAiUsage", () => {
    expect(GENERATE_SRC).toMatch(
      /import[\s\S]*checkBudget[\s\S]*logAiUsage[\s\S]*from/,
    );
  });

  it("generate calls checkBudget before the AI call", () => {
    const budgetIdx = GENERATE_SRC.indexOf("checkBudget(");
    const aiCallIdx = GENERATE_SRC.indexOf("generateText(");
    expect(budgetIdx).toBeGreaterThan(-1);
    expect(aiCallIdx).toBeGreaterThan(budgetIdx);
  });

  it("generate calls logAiUsage after the AI call", () => {
    const aiCallIdx = GENERATE_SRC.indexOf("generateText(");
    const logIdx = GENERATE_SRC.indexOf("logAiUsage(");
    expect(logIdx).toBeGreaterThan(aiCallIdx);
  });

  it("generate returns 402 when over budget", () => {
    expect(GENERATE_SRC).toMatch(/status:\s*402/);
  });
});
