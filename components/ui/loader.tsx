import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
}

export function Loader({
  active,
  children,
  className,
  placeholder,
  size = "md",
}: LoaderProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "transition-opacity duration-200",
          active && "pointer-events-none opacity-40 select-none",
        )}
      >
        {children}
      </div>
      {active && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <Loader2
            className={cn(
              "animation-duration-[400ms] text-primary animate-spin",
              size === "sm" && "h-4 w-4",
              size === "md" && "h-6 w-6",
              size === "lg" && "h-8 w-8",
            )}
          />
          <span>{placeholder}</span>
        </div>
      )}
    </div>
  );
}
