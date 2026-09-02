export interface ConsentState {
  analytics: boolean;
  timestamp: number;
  version: string;
}

const CONSENT_KEY = "app-cookie-consent";
const CONSENT_VERSION = "1";

export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean): ConsentState {
  const state: ConsentState = {
    analytics,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  }
  return state;
}

export function hasConsented(): boolean {
  return getConsent() !== null;
}
