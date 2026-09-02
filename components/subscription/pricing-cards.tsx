"use client";

import { Check, Crown, Sparkles, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import BlurFade from "@/components/blur-fade";
import { plans } from "./plans";
import { useState } from "react";

interface PricingCardsProps {
  currentPlan?: string;
  isUpgrading: string | null;
  onUpgrade?: (plan: string) => void;
}

const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  professional: 2,
};

function getButtonText(
  currentPlan: string,
  targetPlan: { id: string; name: string },
) {
  const currentRank = PLAN_RANK[currentPlan] ?? 0;
  const targetRank = PLAN_RANK[targetPlan.id] ?? 0;

  if (currentPlan === targetPlan.id) return "Plano Atual";
  if (targetRank > currentRank) return `Adquirir plano ${targetPlan.name}`;
  return `Fazer Downgrade para ${targetPlan.name}`;
}

export function PricingCards({
  currentPlan = "free",
  onUpgrade,
  isUpgrading,
}: PricingCardsProps) {
  const [] = useState(false);
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 pt-4 md:grid-cols-2">
      {plans.map((plan, index) => {
        const isCurrentPlan = currentPlan === plan.id;

        return (
          <BlurFade key={plan.id} delay={0.1 * index} inView>
            <Card
              className={cn(
                "relative flex h-full flex-col overflow-visible",
                plan.popular && "border-primary shadow-primary/10 shadow-lg",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gap-1 shadow-sm">
                    <Sparkles className="h-3 w-3" /> Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2 text-center">
                <div className="mx-auto mb-2">
                  {plan.popular ? (
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                      <Crown className="text-primary h-5 w-5" />
                    </div>
                  ) : (
                    <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-xl">
                      <Zap className="text-muted-foreground h-5 w-5" />
                    </div>
                  )}
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-bold">
                    {plan.priceFormatted}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {plan.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                      {feat}
                    </li>
                  ))}
                  {plan.limitations.map((limit) => (
                    <li
                      key={limit}
                      className="text-muted-foreground flex items-start gap-2 text-sm line-through"
                    >
                      <Check className="text-muted-foreground/40 mt-0.5 h-4 w-4 shrink-0" />
                      {limit}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan || !!isUpgrading}
                  onClick={() => onUpgrade && onUpgrade(plan.id)}
                >
                  {isUpgrading === plan.id
                    ? "Processando..."
                    : getButtonText(currentPlan, plan)}
                </Button>
              </CardFooter>
            </Card>
          </BlurFade>
        );
      })}
    </div>
  );
}
