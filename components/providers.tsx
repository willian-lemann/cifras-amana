"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { LazyMotion, domAnimation } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { TooltipProvider } from "./ui/tooltip";
import {
  CookieConsentBanner,
  CookieConsentProvider,
  UmamiScript,
} from "./cookie-consent";

const FeedbackWidget = dynamic(
  () => import("./feedback-widget").then((mod) => mod.FeedbackWidget),
  { ssr: false },
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            toast.error(
              error instanceof Error ? error.message : "Erro inesperado",
            );
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            toast.error(
              error instanceof Error ? error.message : "Erro inesperado",
            );
          },
        }),
      }),
  );

  return (
    <CookieConsentProvider>
      <QueryClientProvider client={queryClient}>
        <LazyMotion features={domAnimation}>
          <TooltipProvider>{children}</TooltipProvider>
        </LazyMotion>
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            classNames: {
              success: "!bg-emerald-300 !text-green-900 !border-emerald-300",
            },
          }}
        />
        {/* <FeedbackWidget /> */}
        {/* <CookieConsentBanner /> */}
      </QueryClientProvider>
    </CookieConsentProvider>
  );
}
