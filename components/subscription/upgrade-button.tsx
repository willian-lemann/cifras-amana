"use client";

import { Crown, Sparkles, Lock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UpgradePromptProps {
  feature: string;
  description?: string;
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-primary/10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Lock className="text-primary h-6 w-6" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">{feature}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm text-sm">
          {description ||
            `Este recurso está disponível no plano Profissional. Faça upgrade para desbloquear ${feature.toLowerCase()} e outros recursos premium.`}
        </p>
        <Link href="/subscription">
          <Button className="gap-2">
            <Crown className="h-4 w-4" />
            Fazer Upgrade para Profissional
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
