# Prompt: Configuração de Infraestrutura SaaS (Better Auth Stripe Plugin)

**Role:** Arquiteto de Software Sênior & Engenheiro de DevOps.
**Tools Available:** Stripe MCP.

**Contexto:**
Estou construindo um SaaS chamado **[NOME_DO_SEU_APP]** usando **Better Auth** com o **Stripe Plugin**. Preciso que você configure a infraestrutura de pagamentos utilizando as ferramentas disponíveis.

**Objetivo:**
Criar planos de assinatura no Stripe e configurar os webhooks necessários. O Better Auth Stripe Plugin gerencia automaticamente o schema do banco de dados e o processamento de webhooks.

---

## 📋 Variáveis de Configuração

_Antes de iniciar, utilize estes valores:_

- **Nome do App:** [NOME_DO_SEU_APP]
- **Moeda:** BRL
- **Planos Desejados:**
  1. Nome: **starter** | Valor: **R$ 47,00** (Intervalo: Mensal)
  2. Nome: **profissional** | Valor: **R$ 97,00** (Intervalo: Mensal)
- **URL do Webhook:** `[SUA_URL]/api/auth/stripe/webhook`

---

## 🚀 Instruções de Execução

Por favor, execute as seguintes fases sequencialmente utilizando as tools apropriadas.

### FASE 1: Banco de Dados (Via Prisma Migrate)

O Better Auth Stripe Plugin gerencia automaticamente as tabelas necessárias. Execute a migração do Prisma para criar/atualizar o schema:

**Tabelas criadas automaticamente pelo plugin:**

1. **Campo `stripeCustomerId` na tabela `user`** - ID do cliente Stripe vinculado ao usuário
2. **Tabela `subscription`** com os seguintes campos:
   - `id` (string, primary key)
   - `plan` (string) - Nome do plano
   - `referenceId` (string) - ID do usuário associado
   - `stripeCustomerId` (string, optional)
   - `stripeSubscriptionId` (string, optional)
   - `status` (string) - Status da assinatura (active, trialing, canceled, etc.)
   - `periodStart` (Date, optional)
   - `periodEnd` (Date, optional)
   - `cancelAtPeriodEnd` (boolean, default false)
   - `cancelAt` (Date, optional)
   - `canceledAt` (Date, optional)
   - `endedAt` (Date, optional)
   - `seats` (number, optional)
   - `trialStart` (Date, optional)
   - `trialEnd` (Date, optional)

**Ação:** Após configurar o plugin, execute `npx prisma migrate dev` para aplicar as alterações.

### FASE 2: Produtos e Preços (Via Stripe MCP)

1. Crie os produtos com preços recorrentes mensais:
   - **Produto 1:** Nome: "Starter" | Preço: R$ 47,00/mês
   - **Produto 2:** Nome: "Profissional" | Preço: R$ 97,00/mês
2. **Importante:** Ao final desta etapa, liste os `price_id` gerados (ex: `price_1Pxyz...`) para configurar no `auth.ts`.

### FASE 3: Webhooks (Via Stripe MCP)

1. Crie um Webhook Endpoint apontando para: `[SUA_URL]/api/auth/stripe/webhook`
2. Inscreva este endpoint nos seguintes eventos (processados automaticamente pelo Better Auth):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. **Importante:** Forneça o `webhook_signing_secret` (ex: `whsec_...`) gerado.

### FASE 4: Configuração do Better Auth

Após a execução das ferramentas, configure o plugin no seu `auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const auth = betterAuth({
  // ... outras configurações
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "starter",
            priceId: "price_STARTER_ID_AQUI", // Substituir pelo price_id da Fase 2
            limits: {
              // Defina os limites do plano
              projects: 3,
            },
          },
          {
            name: "profissional",
            priceId: "price_PROFISSIONAL_ID_AQUI", // Substituir pelo price_id da Fase 2
            limits: {
              // Defina os limites do plano
              projects: 10,
            },
          },
        ],
      },
    }),
  ],
});
```

Configure o cliente no frontend (`auth-client.ts`):

```typescript
import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  plugins: [stripeClient()],
});
```

### FASE 5: Uso no Frontend

**Criar assinatura:**

```typescript
await authClient.subscription.upgrade({
  plan: "starter", // ou "profissional"
  successUrl: "/dashboard",
  cancelUrl: "/pricing",
});
```

**Listar assinaturas:**

```typescript
const { data: subscriptions } = await authClient.subscription.list();
const activeSubscription = subscriptions?.find(
  (sub) => sub.status === "active" || sub.status === "trialing",
);
```

**Cancelar assinatura:**

```typescript
await authClient.subscription.cancel({
  returnUrl: "/account",
});
```

**Portal de cobrança:**

```typescript
await authClient.subscription.billingPortal({
  returnUrl: "/account",
});
```

---

## 📝 Variáveis de Ambiente Necessárias

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

**Inicie a execução da FASE 2 agora (criação dos produtos no Stripe).**
