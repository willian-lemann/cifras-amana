<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Cifras Amana Next.js App Router project. PostHog is initialized client-side via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), a server-side singleton was created in `lib/posthog-server.ts`, and a reverse proxy was configured in `next.config.ts` to route events through `/ingest` — reducing ad-blocker interception. Both `posthog-js` and `posthog-node` were installed. Environment variables were written to `.env.local`.

User identification is performed on the client at login and signup using `posthog.identify()` with the user's ID as the distinct ID. Server-side events use the same user ID so client and server behavior can be correlated in PostHog.

| Event                          | Description                                  | File                                                    |
| ------------------------------ | -------------------------------------------- | ------------------------------------------------------- |
| `user_signed_up`               | New user completes sign-up form              | `app/(auth)/sign-up/page.tsx`                           |
| `user_logged_in`               | Existing user logs in successfully           | `app/(auth)/login/page.tsx`                             |
| `listing_created`              | A new property listing is saved as a draft   | `app/api/listings/route.ts`                             |
| `listing_published`            | A property listing is published publicly     | `app/api/listings/route.ts`                             |
| `subscription_upgraded`        | User initiates a plan upgrade (client)       | `app/(dashboard)/subscription/subscription-content.tsx` |
| `subscription_cancelled`       | User confirms subscription cancellation      | `app/(dashboard)/subscription/subscription-content.tsx` |
| `subscription_activated`       | Subscription confirmed active after checkout | `app/api/auth/subscription/success/route.ts`            |
| `site_generated`               | Broker site generated and published via AI   | `app/(dashboard)/sites/site-generator.tsx`              |
| `site_published`               | Site published to R2 storage (server)        | `app/api/sites/[id]/publish/route.ts`                   |
| `lead_captured`                | Visitor submits contact form on a hotsite    | `app/api/hotsites/[id]/lead/route.ts`                   |
| `instagram_post_published`     | Broker publishes a post to Instagram         | `app/api/instagram/post/route.ts`                       |
| `ai_site_generation_requested` | AI site generation endpoint invoked          | `app/api/ai/generate-site/route.ts`                     |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/467721/dashboard/1705583)
- [New Signups Over Time](https://us.posthog.com/project/467721/insights/zHPoELHX)
- [Subscription Activations](https://us.posthog.com/project/467721/insights/aQSOLiL9)
- [Leads Captured from Hotsites](https://us.posthog.com/project/467721/insights/404kULde)
- [Listings Created vs Published](https://us.posthog.com/project/467721/insights/YL2KFuYH)
- [AI Feature Usage](https://us.posthog.com/project/467721/insights/c3fJxPvH)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
