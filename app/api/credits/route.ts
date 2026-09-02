import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getActiveSubscription } from "@/lib/subscription";
import { getCreditStatus, type CreditStatus } from "@/lib/ai-usage";

const emptyBucket = { limit: 0, used: 0, remaining: 0 };

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const sub = await getActiveSubscription(session);
  const plan = (sub?.plan as string) ?? "free";

  // Users without a paid plan have no credits to display.
  if (plan !== "starter" && plan !== "professional") {
    const empty: CreditStatus = {
      plan,
      aiGenerations: emptyBucket,
    };
    return NextResponse.json(empty);
  }

  const status = await getCreditStatus(session.user.id, plan);
  return NextResponse.json(status);
}
