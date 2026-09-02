import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SubscriptionGate } from "@/components/layout/subscription-gate";

import { requireAuth } from "@/lib/auth";

import { getActiveSubscription } from "@/lib/subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const activeSubscription = await getActiveSubscription(session);
  const plan = (activeSubscription?.plan as string) || "free";

  return (
    <div className="flex min-h-screen">
      <Sidebar plan={plan} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="p-4 lg:p-6">
          <SubscriptionGate hasSubscription={!!activeSubscription}>
            {children}
          </SubscriptionGate>
        </main>
      </div>
    </div>
  );
}
