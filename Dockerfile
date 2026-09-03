# Node fixado na versão do .nvmrc — "lts" muda de major sozinho e quebraria o
# build sem ninguém mexer em nada.
FROM node:22-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV NEXT_TELEMETRY_DISABLED=1

# Stage 1: dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# As NEXT_PUBLIC_* são embutidas no bundle do cliente durante o build, então
# precisam existir aqui — em runtime já é tarde. No Railway, declare cada uma
# como variável do serviço; o Docker as recebe por estes ARGs.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUBDOMAINS_ENABLED
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_ENABLE_POSTHOG
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUBDOMAINS_ENABLED=$NEXT_PUBLIC_SUBDOMAINS_ENABLED
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=$NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_ENABLE_POSTHOG=$NEXT_PUBLIC_ENABLE_POSTHOG

# O client do Prisma nao e gerado aqui: generated/prisma esta versionado no
# repositorio e chega pelo COPY . . acima. Isso exige rodar `pnpm dbgenerate`
# e commitar o resultado sempre que prisma/schema.prisma mudar — caso contrario
# a imagem sobe com um client defasado, e o erro so aparece em runtime.
RUN corepack enable pnpm && pnpm run build

# Stage 3: runtime
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Permissão correta para o cache de prerender/ISR, escrito em runtime pelo
# usuário nextjs.
RUN mkdir .next && chown nextjs:noddatabaseejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
