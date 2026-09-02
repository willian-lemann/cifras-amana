"use client";

import { useState } from "react";
import { useUser, useUserSubscription } from "@/lib/queries/use-user";
import { authClient } from "@/lib/auth-client";
import { PricingCards } from "@/components/subscription/pricing-cards";
import { CreditsUsage } from "@/components/subscription/credits-usage";
import BlurFade from "@/components/blur-fade";
import { useSearchParams } from "next/navigation";
import { logErrorToSentry } from "@/lib/sentry";

import { Button } from "@/components/ui/button";
import { CreditCard, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import posthog from "posthog-js";

export default function SubscriptionContent() {
  const { user } = useUser();

  const { subscriptionPlan, isSubscriptionActive, isLoading } =
    useUserSubscription(!!user);

  const hasActivePlan = !!isSubscriptionActive;
  const planLabel =
    subscriptionPlan === "professional"
      ? "Profissional"
      : subscriptionPlan === "starter"
        ? "Starter"
        : null;

  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  async function handleUpgrade(plan: string) {
    setIsUpgrading(plan);
    posthog.capture("subscription_upgraded", {
      plan,
      previous_plan: subscriptionPlan,
    });
    try {
      await authClient.subscription.upgrade({
        plan,
        successUrl: `${window.location.origin}/subscription?success=true`,
        cancelUrl: `${window.location.origin}/subscription`,
        locale: "pt-BR",
      });
    } catch (err) {
      console.error("Upgrade failed:", err);
      logErrorToSentry(err as Error, {
        location: "subscription handleUpgrade",
      });
      toast.error("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setIsUpgrading(null);
    }
  }

  async function handleCancel() {
    try {
      await authClient.subscription.cancel({
        returnUrl: `${window.location.origin}/subscription`,
      });
      posthog.capture("subscription_cancelled", { plan: subscriptionPlan });
      setShowCancelDialog(false);
    } catch (err) {
      console.error("Cancel failed:", err);
      logErrorToSentry(err as Error, { location: "subscription handleCancel" });
      toast.error("Erro ao cancelar assinatura. Tente novamente.");
    }
  }

  async function handleBillingPortal() {
    try {
      await authClient.subscription.billingPortal({
        returnUrl: `${window.location.origin}/subscription`,
        locale: "pt-BR",
      });
    } catch (err) {
      console.error("Billing portal failed:", err);
      logErrorToSentry(err as Error, {
        location: "subscription handleBillingPortal",
      });
      toast.error("Erro ao abrir portal de cobrança. Tente novamente.");
    }
  }

  return (
    <Loader active={isLoading} placeholder="Carregando planos">
      <div className="space-y-8">
        <BlurFade delay={0}>
          <div className="mx-auto max-w-lg text-center">
            {success && (
              <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                Pagamento realizado com sucesso! Seu plano foi ativado.
              </div>
            )}
            <h2
              className="text-2xl font-bold tracking-tight"
              suppressHydrationWarning
            >
              {hasActivePlan
                ? "Sua Assinatura"
                : "Escolha seu Plano para Começar"}
            </h2>
            <p
              className="text-muted-foreground mt-2 text-sm"
              suppressHydrationWarning
            >
              {hasActivePlan
                ? `Você está no plano ${planLabel}. Gerencie sua assinatura abaixo.`
                : "Para acessar a plataforma, escolha um dos planos abaixo."}
            </p>
          </div>
        </BlurFade>

        {hasActivePlan && (
          <BlurFade delay={0.1}>
            <div className="mx-auto max-w-lg">
              <CreditsUsage />
            </div>
          </BlurFade>
        )}

        <PricingCards
          currentPlan={subscriptionPlan}
          onUpgrade={handleUpgrade}
          isUpgrading={isUpgrading}
        />

        {hasActivePlan && (
          <BlurFade delay={0.2}>
            <div className="flex justify-center gap-4 pt-4">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleBillingPortal}
              >
                <CreditCard className="h-4 w-4" />
                Gerenciar Cobrança
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive gap-2"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="h-4 w-4" />
                Cancelar Assinatura
              </Button>
            </div>
          </BlurFade>
        )}

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
              <AlertDialogDescription>
                Você perderá acesso à plataforma ao fim do período atual. Para
                continuar usando, será necessário reativar uma assinatura.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Manter plano</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleCancel}>
                Cancelar assinatura
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Loader>
  );
}
