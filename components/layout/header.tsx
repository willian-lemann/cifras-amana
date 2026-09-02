"use client";

import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { MobileNav } from "./mobile-nav";

const pageTitles: Record<string, string> = {
  "/dashboard": "Painel",
  "/profile": "Minha conta",
  "/subscription": "Assinatura",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || APP_NAME;

  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur-sm md:hidden lg:px-6">
      <div className="flex items-center gap-4">
        <MobileNav />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
    </header>
  );
}
