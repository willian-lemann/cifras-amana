# SaaS Starter

A neutral Next.js SaaS boilerplate with authentication, payments, AI, logging
and analytics wired up. Rename it, add your keys, and start building.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Prisma 7** + **PostgreSQL** (driver adapter)
- **Better Auth** (email/password + OAuth) with **Stripe** subscriptions
- **AI** via the Vercel AI SDK (OpenAI) with per-plan usage & credits
- **Cloudflare R2** uploads, **Upstash** rate limiting
- **PostHog** analytics, **Sentry** error tracking
- **Trigger.dev** background tasks
- **Tailwind CSS v4** + shadcn/Base UI components

## Getting started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the env template and fill in your keys:

   ```bash
   cp .env.example .env
   ```

3. Push the schema to your database and generate the client:

   ```bash
   pnpm dbpush
   pnpm dbgenerate
   ```

4. Run the dev server:

   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Rename the app

The app name and feature flags live in [`lib/config.ts`](lib/config.ts). Change
`APP_NAME` and `APP_SLUG` there — they drive the UI, metadata and auth cookie
prefix.

## Project layout

- `app/(auth)` — login / sign-up
- `app/(protected)` — dashboard, account, subscription (auth-gated)
- `app/(public)` — public pages (terms, privacy)
- `app/(subdomains)` — multi-tenant example, off by default
- `app/api` — route handlers (auth, ai, credits, upload, user, items, og)
- `lib` — services, schemas, queries, auth, payments, config
- `trigger` — Trigger.dev tasks

### Example resource (`Item`)

`Item` demonstrates the layered pattern used across the app — each file has a
single responsibility:

- `lib/schemas/item.ts` — validation (zod)
- `lib/services/item-service.ts` — business logic + data access
- `app/api/items` — thin HTTP handlers
- `lib/queries/use-items.ts` — client data fetching

### Subdomain routing

Off by default. Set `NEXT_PUBLIC_SUBDOMAINS_ENABLED=true` and add your root
domains in [`lib/next-config/subdomains.ts`](lib/next-config/subdomains.ts) to
route `tenant.<root>/*` to `app/(subdomains)/s/[subdomain]`.

## Quality gate

```bash
pnpm qa
```

Runs format check, lint, type check and tests.
