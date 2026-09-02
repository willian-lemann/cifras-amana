"use client";

import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";

export type Plan = "free" | "starter" | "professional";
export interface UserOutput {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  subscriptionTier: string;
}

export interface UserInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
  stripeCustomerId?: string | null | undefined;
}

interface StripeSubscription {
  plan: string;
  status: string;
  periodEnd?: string;
}

export const useUserSubscription = (enabled: boolean) => {
  const { data: subscriptions, isLoading } = useQuery<StripeSubscription[]>({
    queryKey: ["stripe-subscriptions"],
    queryFn: async () => {
      const { data } = await authClient.subscription.list();
      return (data as StripeSubscription[]) || [];
    },
    enabled,
  });

  const isSubscriptionActive = subscriptions?.find(
    (s) => s.status === "active" || s.status === "trialing",
  );

  const subscriptionPlan: Plan = (isSubscriptionActive?.plan as Plan) || "free";
  return {
    isLoading,
    isSubscriptionActive,
    isPremium: subscriptionPlan !== "free",
    subscriptionPlan,
    subscriptionPlanLabel:
      subscriptionPlan === "professional"
        ? "Profissional"
        : subscriptionPlan === "starter"
          ? "Starter"
          : "Gratuito",
  };
};

export function useUser() {
  const { data: session, isPending: isSessionPending, error } = useSession();

  const isLoading = isSessionPending;

  return {
    user: session?.user ? session.user : null,
    isLoading,
    error,
    isAuthenticated: !!session,
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  subscriptionTier: string;
}

export function useUserProfile(enabled: boolean) {
  return useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Falha ao carregar perfil do usuário");
      return res.json();
    },
    enabled,
  });
}
