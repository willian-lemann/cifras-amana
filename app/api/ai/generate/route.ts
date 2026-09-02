import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { generateText } from "ai";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { textModelMini } from "@/lib/ai";
import { getActiveSubscription } from "@/lib/subscription";
import {
  AI_GENERATION_ENDPOINT,
  checkBudget,
  logAiUsage,
} from "@/lib/ai-usage";
import { sanitizeForPrompt } from "@/lib/prompt-sanitize";

const bodySchema = z.object({
  prompt: z.string().min(1, "Prompt é obrigatório").max(2000),
});

// Example AI endpoint: generates text, enforces the monthly budget, and logs
// usage. Rate limiting for /api/ai/* is handled centrally in proxy.ts.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Prompt inválido" },
      { status: 400 },
    );
  }

  const sub = await getActiveSubscription(session);
  const plan = (sub?.plan as string) ?? "starter";

  const budget = await checkBudget(session.user.id, plan);
  if (!budget.allowed) {
    return NextResponse.json(
      { error: "Limite mensal de gerações de IA atingido." },
      { status: 402 },
    );
  }

  const model = "gpt-4o-mini";
  const { text, usage } = await generateText({
    model: textModelMini,
    prompt: sanitizeForPrompt(parsed.data.prompt, 2000),
  });

  await logAiUsage(
    session.user.id,
    AI_GENERATION_ENDPOINT,
    model,
    usage.inputTokens ?? 0,
    usage.outputTokens ?? 0,
  );

  return NextResponse.json({ text });
}
