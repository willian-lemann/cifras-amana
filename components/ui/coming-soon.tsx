"use client";

import { Clock } from "lucide-react";
import BlurFade from "@/components/blur-fade";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  /** Icon to display in the badge. Defaults to the page's own icon. */
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  /** Label for the CTA button */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ComingSoon({
  icon,
  title = "Em breve",
  description = "Esta funcionalidade está sendo desenvolvida e em breve estará disponível.",
  actionLabel,
  onAction,
  className,
}: ComingSoonProps) {
  return (
    <div
      className={`flex min-h-[calc(100vh-64px)] flex-col items-center justify-center ${className ?? ""}`}
    >
      <BlurFade
        delay={0}
        className="flex max-w-md flex-col items-center px-4 text-center"
      >
        {icon && (
          <div className="bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
            {icon}
          </div>
        )}
        <h2 className="mb-2 text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          {description}
        </p>
        <div className="bg-muted text-muted-foreground inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
          <Clock className="h-4 w-4" />
          Em breve
          {actionLabel && onAction && (
            <Button
              variant="default"
              size="sm"
              className="ml-4 cursor-pointer"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </BlurFade>
    </div>
  );
}
