"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  LogOut,
  Crown,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/config";
import { authClient } from "@/lib/auth-client";
import { useUser } from "@/lib/queries/use-user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { icon: Home, label: "Painel", href: "/dashboard" },
  { icon: UserRoundCog, label: "Minha conta", href: "/profile" },
  { icon: CreditCard, label: "Assinatura", href: "/subscription" },
];

export function Sidebar({ plan }: { plan: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const { user } = useUser();
  const isProfessional = plan === "professional";

  return (
    <aside className="border-sidebar-border bg-background text-sidebar-foreground sticky top-0 hidden h-screen w-64 flex-col border-r lg:flex">
      {/* Logo */}
      <div className="border-sidebar-border border-b-muted flex h-16 shrink-0 items-center gap-2 border-b px-5">
        <div className="text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
          <Image
            src="/logo.png"
            alt={`Logo ${APP_NAME}`}
            width={16}
            height={16}
          />
        </div>
        <span className="text-base font-semibold tracking-tight">
          {APP_NAME}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-sidebar-border border-t-muted border-t p-3">
        {!isProfessional && (
          <Link href="/subscription">
            <div className="from-primary/10 to-primary/5 border-primary/20 mb-3 rounded-lg border bg-linear-to-br p-3">
              <div className="mb-1 flex items-center gap-2">
                <Crown className="text-primary h-4 w-4" />
                <span className="text-primary text-xs font-semibold">
                  Seja Profissional
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Desbloqueie todos os recursos do plano profissional.
              </p>
            </div>
          </Link>
        )}
        <div className="flex items-center gap-3 px-2">
          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user?.name || "Usuário"}
            </p>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {isProfessional
                  ? "Pro"
                  : plan === "starter"
                    ? "Starter"
                    : "Grátis"}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
            onClick={async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess() {
                    router.push("/login");
                  },
                },
              });
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
