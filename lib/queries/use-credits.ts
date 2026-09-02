"use client";

import { useQuery } from "@tanstack/react-query";
import type { CreditStatus } from "@/lib/ai-usage";

export type { CreditStatus };

export function useCredits() {
  return useQuery<CreditStatus>({
    queryKey: ["credits"],
    queryFn: async () => {
      const res = await fetch("/api/credits");
      if (!res.ok) throw new Error("Falha ao carregar créditos");
      return res.json();
    },
  });
}
