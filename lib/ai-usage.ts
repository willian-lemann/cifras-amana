import prisma from "@/lib/prisma";

// Per-model pricing (cost per 1M tokens in cents)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 250, output: 1000 }, // $2.50 / $10.00 per 1M
  "gpt-4o-mini": { input: 15, output: 60 }, // $0.15 / $0.60 per 1M
  "gpt-image-1.5": { input: 0, output: 0 }, // flat rate per image
};

// gpt-image-1.5: ~$0.06 per standard 1024×1024 image
const IMAGE_MODEL_COST_CENTS = 6;

// Monthly AI call limits per plan
export const AI_PLAN_LIMITS: Record<string, number> = {
  starter: 50,
  professional: 500,
};

// Product-facing credit: monthly AI generations, counted from aiUsageLog by
// endpoint. Extend this shape as you add more billable AI features.
export type PlanCredits = {
  aiGenerations: number;
};

export const CREDIT_LIMITS: Record<string, PlanCredits> = {
  starter: { aiGenerations: 50 },
  professional: { aiGenerations: 500 },
};

// Endpoint whose monthly usage maps to the aiGenerations credit bucket.
export const AI_GENERATION_ENDPOINT = "generate";

export type CreditBucket = { limit: number; used: number; remaining: number };

export type CreditStatus = {
  plan: string;
  aiGenerations: CreditBucket;
};

function estimateCostCents(
  model: string,
  tokensIn: number,
  tokensOut: number,
): number {
  if (model === "gpt-image-1.5") return IMAGE_MODEL_COST_CENTS;

  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  return Math.ceil(
    (tokensIn * pricing.input + tokensOut * pricing.output) / 1_000_000,
  );
}

export async function logAiUsage(
  userId: string,
  endpoint: string,
  model: string,
  tokensIn: number,
  tokensOut: number,
) {
  const costCents = estimateCostCents(model, tokensIn, tokensOut);

  await prisma.aiUsageLog.create({
    data: { userId, endpoint, model, tokensIn, tokensOut, costCents },
  });
}

export async function getMonthlyUsage(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const usage = await prisma.aiUsageLog.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
    _count: true,
    _sum: {
      tokensIn: true,
      tokensOut: true,
      costCents: true,
    },
  });

  return {
    calls: usage._count,
    tokensIn: usage._sum.tokensIn ?? 0,
    tokensOut: usage._sum.tokensOut ?? 0,
    costCents: usage._sum.costCents ?? 0,
  };
}

export async function checkBudget(
  userId: string,
  plan: string,
): Promise<{ allowed: boolean; remaining: number; used: number }> {
  const limit = AI_PLAN_LIMITS[plan] ?? AI_PLAN_LIMITS.starter;
  const { calls } = await getMonthlyUsage(userId);

  return {
    allowed: calls < limit,
    remaining: Math.max(0, limit - calls),
    used: calls,
  };
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Number of AI calls to a given endpoint by a user in the current month. */
export async function getMonthlyEndpointCount(
  userId: string,
  endpoint: string,
): Promise<number> {
  return prisma.aiUsageLog.count({
    where: { userId, endpoint, createdAt: { gte: startOfCurrentMonth() } },
  });
}

function buildBucket(limit: number, used: number): CreditBucket {
  return { limit, used, remaining: Math.max(0, limit - used) };
}

/** Consolidated credit status for display and enforcement. */
export async function getCreditStatus(
  userId: string,
  plan: string,
): Promise<CreditStatus> {
  const limits = CREDIT_LIMITS[plan] ?? CREDIT_LIMITS.starter;

  const aiGenUsed = await getMonthlyEndpointCount(
    userId,
    AI_GENERATION_ENDPOINT,
  );

  return {
    plan,
    aiGenerations: buildBucket(limits.aiGenerations, aiGenUsed),
  };
}
