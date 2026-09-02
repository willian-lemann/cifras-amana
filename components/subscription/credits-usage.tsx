"use client";

import { Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCredits, type CreditStatus } from "@/lib/queries/use-credits";

type Bucket = CreditStatus["aiGenerations"];

interface CreditsUsageProps {
  className?: string;
}

function CreditRow({
  icon: Icon,
  label,
  bucket,
  unit,
}: {
  icon: typeof Sparkles;
  label: string;
  bucket: Bucket;
  unit: string;
}) {
  const pct =
    bucket.limit > 0 ? Math.min(100, (bucket.used / bucket.limit) * 100) : 0;
  const exhausted = bucket.remaining <= 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground flex items-center gap-2">
          <Icon className="text-muted-foreground h-4 w-4" />
          {label}
        </span>
        <span
          className={cn(
            "tabular-nums",
            exhausted
              ? "text-destructive font-medium"
              : "text-muted-foreground",
          )}
        >
          {bucket.used} / {bucket.limit} {unit}
        </span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            exhausted ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CreditsUsage({ className }: CreditsUsageProps) {
  const { data, isLoading } = useCredits();

  if (isLoading || !data) return null;
  if (data.aiGenerations.limit <= 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Seus créditos do mês</CardTitle>
        <CardDescription>
          Renova no início de cada mês. Acompanhe o quanto já usou.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CreditRow
          icon={Sparkles}
          label="Gerações de IA"
          bucket={data.aiGenerations}
          unit="este mês"
        />
      </CardContent>
    </Card>
  );
}
