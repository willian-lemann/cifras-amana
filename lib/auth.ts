import { cache } from "react";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { isValidRegistrationEmail } from "@/lib/user-validation";
import { APP_SLUG } from "@/lib/config";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logMessageToSentry } from "./sentry";

const trustedOrigins = [process.env.NEXT_PUBLIC_APP_URL].filter(
  (origin): origin is string => Boolean(origin),
);

// Built on first use, not on import. `next build` imports every route module to
// collect page data, and constructing Stripe eagerly made that step demand
// STRIPE_SECRET_KEY at build time — which broke container builds, where the
// secret only exists at runtime.
let stripeInstance: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(apiKey, { apiVersion: "2026-02-25.clover" });
  }
  return stripeInstance;
}

export const stripeClient = new Proxy({} as Stripe, {
  get: (_target, property) => Reflect.get(getStripeClient(), property),
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Block bots signing up with malformed or throwaway emails.
          if (!isValidRegistrationEmail(user.email)) {
            throw new APIError("BAD_REQUEST", {
              message: "E-mail inválido.",
            });
          }
          return { data: user };
        },
      },
    },
  },
  advanced: {
    cookiePrefix: APP_SLUG,
    defaultCookieAttributes: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1 day
    },
  },

  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      onEvent: async (event) => {
        console.log("[Stripe Webhook] event received:", event.type);
      },
      subscription: {
        enabled: true,
        plans: [
          {
            name: "starter",
            priceId: process.env.STRIPE_STARTER_PRICE_ID!,
            limits: {
              items: 10,
            },
          },
          {
            name: "professional",
            priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
            limits: {
              items: Infinity,
            },
          },
        ],
        onSubscriptionComplete: async ({ subscription, plan }) => {
          logMessageToSentry(
            `[Stripe] Subscription complete: plan=${plan.name} status=${subscription.status}`,
          );
        },

        onSubscriptionCreated: async ({ subscription, plan }) => {
          logMessageToSentry(
            `[Stripe] Subscription created: plan=${plan.name} id=${subscription.id}`,
          );
        },

        onSubscriptionUpdate: async ({ subscription }) => {
          logMessageToSentry(
            `[Stripe] Subscription updated: status=${subscription.status}`,
          );
        },

        onSubscriptionDeleted: async ({ subscription }) => {
          logMessageToSentry(
            `[Stripe] Subscription deleted: id=${subscription.id}`,
          );
        },

        onSubscriptionCancel: async ({ subscription }) => {
          logMessageToSentry(
            `[Stripe] Subscription cancelled: id=${subscription.id}`,
          );
        },
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;

export const getAuthSession = cache(async (): Promise<Session | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
});

export async function requireAuth(): Promise<Session | undefined> {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  return session;
}
