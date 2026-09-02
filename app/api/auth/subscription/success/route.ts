import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSubscriptionByCheckoutSessionId } from "@/lib/subscription";
import { logErrorToSentry, logMessageToSentry } from "@/lib/sentry";
import { getPostHogClient } from "@/lib/posthog-server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = req.nextUrl;

  const rawCallback = searchParams.get("callbackUrl") || "/subscription";
  // Prevent open redirect: only allow relative paths
  const callbackURL = rawCallback.startsWith("/")
    ? rawCallback
    : "/subscription";

  const checkoutSessionId = searchParams.get("checkoutSessionId") || "";

  if (!checkoutSessionId) {
    console.log(
      "[subscription/success] Missing checkoutSessionId in query params",
    );
    logMessageToSentry(
      "Missing checkoutSessionId in subscription success callback",
    );
    return NextResponse.redirect(new URL(callbackURL, req.url));
  }

  const { customerId, subscriptionId } =
    await getSubscriptionByCheckoutSessionId(checkoutSessionId);

  if (!subscriptionId && !customerId) {
    console.log(
      "[subscription/success] No subscription found for checkout session:",
      checkoutSessionId,
    );
    logMessageToSentry("Subscription not found for checkout session");
    return NextResponse.redirect(new URL(callbackURL, req.url));
  }

  try {
    // Verify the subscription belongs to the authenticated user
    const existing = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true, status: true, user: { select: { id: true } } },
    });

    if (!existing) {
      console.log(
        "[subscription/success] No subscription found for customer:",
        customerId,
      );
      logMessageToSentry("Subscription not found for customer");
      // Webhook may not have arrived yet — nothing to do
      return NextResponse.redirect(new URL(callbackURL, req.url));
    }

    if (existing.user.id !== session.user.id) {
      console.log(
        "[subscription/success] Subscription customer does not match authenticated user",
        { subscriptionId, customerId, userId: session.user.id },
      );
      logMessageToSentry(
        "Subscription customer does not match authenticated user",
      );
      return NextResponse.redirect(new URL("/subscription", req.url));
    }

    if (existing.status !== "active") {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: "active",
          updatedAt: new Date(),
        },
      });
    }

    const posthog = getPostHogClient();
    posthog?.capture({
      distinctId: session.user.id,
      event: "subscription_activated",
      properties: { subscription_id: subscriptionId, customer_id: customerId },
    });
    await posthog?.shutdown();
  } catch (err) {
    console.error("[subscription/success] DB update failed:", err);
    logErrorToSentry(err as Error, {
      location: "api/auth/subscription/success",
    });
  }

  return redirect(callbackURL);
}
