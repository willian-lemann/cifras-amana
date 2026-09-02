import { auth, stripeClient } from "@/lib/auth";
import { headers } from "next/headers";

type PlanName = "starter" | "professional";

const PLAN_HIERARCHY: Record<PlanName, number> = {
  starter: 1,
  professional: 2,
};

const PLAN_LIMITS: Record<PlanName, { items: number }> = {
  starter: { items: 10 },
  professional: { items: Infinity },
};

type Param = Awaited<ReturnType<typeof auth.api.getSession>> | never;

export async function getActiveSubscription(sessionInstance?: Param) {
  const session =
    sessionInstance ||
    (await auth.api.getSession({ headers: await headers() }));
  if (!session?.user) return null;

  const subs = await auth.api.listActiveSubscriptions({
    headers: await headers(),
  });

  const activeSub = subs?.find(
    (s: { status: string | null }) =>
      s.status === "active" || s.status === "trialing",
  );

  return activeSub || null;
}

export async function requireActivePlan(minPlan: PlanName) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: "Não autenticado", status: 401, session: null };
  }

  const activeSub = await getActiveSubscription(session);

  if (!activeSub) {
    return { error: "Nenhuma assinatura ativa", status: 402, session };
  }

  const subPlan = activeSub.plan as PlanName;
  if (
    PLAN_HIERARCHY[subPlan] === undefined ||
    PLAN_HIERARCHY[subPlan] < PLAN_HIERARCHY[minPlan]
  ) {
    return { error: `Requer plano ${minPlan}`, status: 403, session };
  }

  return { data: activeSub, session };
}

export function getPlanLimits(plan: PlanName) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
}

export async function getSubscriptionByCheckoutSessionId(
  checkoutSessionId: string,
) {
  const stripeSession =
    await stripeClient.checkout.sessions.retrieve(checkoutSessionId);
  return {
    customerId: stripeSession.customer as string | null,
    subscriptionId:
      typeof stripeSession.subscription === "string"
        ? stripeSession.subscription
        : null,
  };
}
