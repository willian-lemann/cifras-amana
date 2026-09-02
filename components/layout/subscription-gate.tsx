"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface SubscriptionGateProps {
  hasSubscription: boolean;
  children: React.ReactNode;
}

const ALLOWED_PATHS = ["/subscription", "/studio", "/listings", "/profile"];

export function SubscriptionGate({
  hasSubscription,
  children,
}: SubscriptionGateProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isAllowed = ALLOWED_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!hasSubscription && !isAllowed) {
      router.replace("/subscription");
    }
  }, [hasSubscription, isAllowed, router]);

  if (isAllowed) return <>{children}</>;
  if (!hasSubscription) return null;

  return <>{children}</>;
}
