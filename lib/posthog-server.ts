import { PostHog } from "posthog-node";

// PostHog only runs when NEXT_PUBLIC_ENABLE_POSTHOG === "true". Otherwise this
// returns null and callers skip the event via optional chaining
// (posthog?.capture / posthog?.shutdown).
export function getPostHogClient(): PostHog | null {
  if (process.env.NEXT_PUBLIC_ENABLE_POSTHOG !== "true") return null;
  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}
