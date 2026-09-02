"use client";

import Link from "next/link";
import Script from "next/script";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getConsent,
  hasConsented,
  saveConsent,
  type ConsentState,
} from "@/lib/cookie-consent";

// ─── Context ────────────────────────────────────────────────────────────────

interface CookieConsentContextValue {
  consent: ConsentState | null;
  showBanner: boolean;
  acceptAll: () => void;
  acceptEssential: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null,
);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    startTransition(() => {
      const existing = getConsent();
      setConsentState(existing);
      if (!hasConsented()) setShowBanner(true);
    });
  }, []);

  const acceptAll = () => {
    const state = saveConsent(true);
    setConsentState(state);
    setShowBanner(false);
  };

  const acceptEssential = () => {
    const state = saveConsent(false);
    setConsentState(state);
    setShowBanner(false);
  };

  return (
    <CookieConsentContext.Provider
      value={{ consent, showBanner, acceptAll, acceptEssential }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx)
    throw new Error(
      "useCookieConsent must be used within CookieConsentProvider",
    );
  return ctx;
}

// ─── Umami Script ────────────────────────────────────────────────────────────

export function UmamiScript() {
  const { consent } = useCookieConsent();

  if (process.env.NODE_ENV === "development" || !consent?.analytics) {
    return null;
  }

  return (
    <Script
      src="https://umami-production-9dba.up.railway.app/script.js"
      defer
      data-website-id="6eb4f261-215e-4ef1-b9ed-b68ee22b296a"
    />
  );
}

// ─── Banner ──────────────────────────────────────────────────────────────────

export function CookieConsentBanner() {
  const { showBanner, acceptAll, acceptEssential } = useCookieConsent();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showBanner) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      startTransition(() => setVisible(false));
    }
  }, [showBanner]);

  if (!showBanner) return null;

  return (
    <>
      <style>{`
        @keyframes cookie-slide-up {
          from { transform: translateY(1rem); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div
        role="dialog"
        aria-label="Consentimento de cookies"
        aria-live="polite"
        className="fixed right-0 bottom-4 left-0 z-50 flex justify-center px-4"
        style={{
          animation: visible
            ? "cookie-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both"
            : undefined,
        }}
      >
        <div className="bg-background w-full max-w-lg rounded-xl border p-4 shadow-lg">
          <div className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-base" aria-hidden>
              🍪
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug font-medium">
                Cookies e privacidade
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Usamos cookies essenciais para o funcionamento da plataforma e
                analytics de uso (Umami) para melhorar nosso serviço. Nenhum
                dado é compartilhado com terceiros para fins publicitários.{" "}
                <Link
                  href="/politica-privacidade"
                  className="hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Política de privacidade
                </Link>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={acceptEssential}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg border px-3 py-1.5 text-xs transition-colors"
                >
                  Apenas essenciais
                </button>
                <button
                  onClick={acceptAll}
                  className="bg-foreground text-background rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
                >
                  Aceitar tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
