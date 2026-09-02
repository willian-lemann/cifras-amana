# TASK: Implementar Pagamentos SaaS com AbacatePay

**Role:** Senior Payment Engineer  
**Stack:** Next.js 16 (App Router) + Better Auth + AbacatePay + PostgreSQL  
**Objetivo:** Setup completo de billing via PIX/Cartão usando AbacatePay

---

## 📦 INSTALAÇÃO

```bash
# Nenhum SDK oficial necessário - usar fetch API
```

---

## ⚙️ CONFIGURAÇÃO

### 1. Env (.env.local)

```env
ABACATEPAY_API_KEY=seu_token_jwt_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

### 2. AbacatePay Client (lib/abacatepay.ts)

```typescript
const ABACATE_BASE_URL = "https://api.abacatepay.com";
const API_KEY = process.env.ABACATEPAY_API_KEY!;

export const abacatepay = {
  async createBilling(params: {
    customerId?: string;
    customer?: {
      name: string;
      email: string;
      taxId: string;
      cellphone: string;
    };
    products: Array<{
      externalId: string;
      name: string;
      description: string;
      quantity: number;
      price: number; // em centavos
    }>;
    returnUrl: string;
    completionUrl: string;
  }) {
    const res = await fetch(`${ABACATE_BASE_URL}/v1/billing/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        frequency: "ONE_TIME",
        methods: ["PIX", "CARD"],
        ...params,
      }),
    });

    if (!res.ok) throw new Error("Erro ao criar cobrança");
    const data = await res.json();
    return data.data; // { id, url, amount, status, ... }
  },

  async getBilling(billingId: string) {
    const res = await fetch(
      `${ABACATE_BASE_URL}/v1/billing/get?id=${billingId}`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      },
    );
    const data = await res.json();
    return data.data;
  },

  async createCustomer(params: {
    name: string;
    email: string;
    taxId: string;
    cellphone: string;
  }) {
    const res = await fetch(`${ABACATE_BASE_URL}/v1/customer/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.data; // { id, metadata }
  },
};
```

### 3. Schema do Banco (Prisma)

```prisma
// prisma/schema.prisma
model Subscription {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  plan              String    // "starter" | "pro"
  status            String    // "pending" | "active" | "canceled"

  abacateBillingId  String?   @unique
  abacateCustomerId String?

  amount            Int       // em centavos
  periodStart       DateTime?
  periodEnd         DateTime?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
  @@index([status])
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?

  // Better Auth fields
  emailVerified Boolean        @default(false)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  subscriptions Subscription[]
  sessions      Session[]
  accounts      Account[]
}

// Better Auth tables (session, account, verification)
// ...
```

```bash
npx prisma migrate dev --name add_subscriptions
```

---

## 🎯 IMPLEMENTAÇÃO

### 1. API Route - Criar Checkout (app/api/abacatepay/checkout/route.ts)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { abacatepay } from "@/lib/abacatepay";
import { prisma } from "@/lib/db";

const PLANS = {
  starter: { name: "Starter", price: 4700, projects: 3 },
  pro: { name: "Pro", price: 9700, projects: 10 },
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan: "starter" | "pro" };

    if (!PLANS[plan]) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const planConfig = PLANS[plan];

    // Criar cobrança
    const billing = await abacatepay.createBilling({
      customer: {
        name: session.user.name || "Cliente",
        email: session.user.email,
        taxId: "00000000000", // Coletar no frontend
        cellphone: "(00) 00000-0000", // Coletar no frontend
      },
      products: [
        {
          externalId: `plan-${plan}`,
          name: planConfig.name,
          description: `Plano ${planConfig.name} mensal`,
          quantity: 1,
          price: planConfig.price,
        },
      ],
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    });

    // Criar subscription pendente
    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        plan,
        status: "pending",
        amount: planConfig.price,
        abacateBillingId: billing.id,
      },
    });

    return NextResponse.json({ url: billing.url });
  } catch (error) {
    console.error("Erro checkout:", error);
    return NextResponse.json(
      { error: "Erro ao criar checkout" },
      { status: 500 },
    );
  }
}
```

### 2. Webhook Handler (app/api/abacatepay/webhook/route.ts)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Validar assinatura (implementar conforme docs AbacatePay)
    // const signature = req.headers.get("x-abacatepay-signature");
    // if (!isValidSignature(payload, signature)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    if (payload.event === "billing.paid") {
      const billingId = payload.data.id;

      // Ativar subscription
      const subscription = await prisma.subscription.findFirst({
        where: { abacateBillingId: billingId },
      });

      if (!subscription) {
        console.error("Subscription não encontrada:", billingId);
        return NextResponse.json({ ok: false }, { status: 404 });
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "active",
          periodStart: now,
          periodEnd: periodEnd,
        },
      });

      console.log("✅ Subscription ativada:", subscription.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
```

### 3. Frontend - Botão de Upgrade (app/pricing/page.tsx)

```typescript
"use client";
import { useState } from "react";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade(plan: "starter" | "pro") {
    setLoading(true);
    try {
      const res = await fetch("/api/abacatepay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) throw new Error("Erro ao criar checkout");

      const { url } = await res.json();
      window.location.href = url; // Redirecionar para AbacatePay
    } catch (error) {
      alert("Erro ao processar pagamento");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Escolha seu plano</h1>

      <div>
        <h2>Starter - R$ 47/mês</h2>
        <button onClick={() => handleUpgrade("starter")} disabled={loading}>
          Assinar Starter
        </button>
      </div>

      <div>
        <h2>Pro - R$ 97/mês</h2>
        <button onClick={() => handleUpgrade("pro")} disabled={loading}>
          Assinar Pro
        </button>
      </div>
    </div>
  );
}
```

### 4. Dashboard - Verificar Assinatura (app/dashboard/page.tsx)

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: "active",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return (
      <div>
        <p>Nenhuma assinatura ativa</p>
        <a href="/pricing">Ver planos</a>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Plano: {subscription.plan}</p>
      <p>Status: {subscription.status}</p>
      <p>Válido até: {subscription.periodEnd?.toLocaleDateString()}</p>
    </div>
  );
}
```

### 5. Helper de Proteção (lib/subscription.ts)

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function requireActivePlan(minPlan: "starter" | "pro") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Não autenticado");

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: "active",
      periodEnd: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    throw new Error("Nenhuma assinatura ativa");
  }

  const hierarchy = { starter: 1, pro: 2 };
  if (hierarchy[subscription.plan] < hierarchy[minPlan]) {
    throw new Error(`Requer plano ${minPlan}`);
  }

  return subscription;
}
```

---

## 🧪 TESTE EM DEV MODE

### 1. Configurar Dev Mode

- Acessar dashboard AbacatePay
- Ativar "Dev Mode"
- Usar token de desenvolvimento

### 2. Fluxo de Teste

```bash
# 1. Usuário faz login
# 2. Clica em "Assinar Starter"
# 3. API cria cobrança → retorna URL
# 4. Usuário redirecionado para AbacatePay
# 5. Escolhe PIX ou Cartão
# 6. Simula pagamento (dev mode)
# 7. Webhook `billing.paid` é disparado
# 8. Subscription ativada no banco
# 9. Usuário redirecionado para /dashboard?success=true
```

### 3. Simular Webhook Manual

```bash
curl -X POST http://localhost:3000/api/abacatepay/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "billing.paid",
    "data": {
      "id": "bill_123456",
      "status": "PAID"
    }
  }'
```

---

## 🔒 VALIDAÇÃO DE WEBHOOK (Produção)

```typescript
// app/api/abacatepay/webhook/route.ts
import crypto from "crypto";

function isValidSignature(payload: any, signature: string): boolean {
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET!;
  const hash = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return hash === signature;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-abacatepay-signature");
  const payload = await req.json();

  if (!isValidSignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Processar webhook...
}
```

---

## ✅ CHECKLIST

**Setup Inicial:**

- [ ] Conta AbacatePay criada
- [ ] API Key obtida (dev mode)
- [ ] `ABACATEPAY_API_KEY` em `.env`
- [ ] Schema Prisma atualizado (Subscription model)
- [ ] Migração executada

**Implementação:**

- [ ] `lib/abacatepay.ts` criado
- [ ] API Route `/api/abacatepay/checkout` implementada
- [ ] Webhook `/api/abacatepay/webhook` implementado
- [ ] Página `/pricing` com botões funcionando
- [ ] Dashboard mostrando assinatura ativa
- [ ] Helper `requireActivePlan()` implementado

**Testes:**

- [ ] Fluxo completo: login → upgrade → checkout → pagamento → webhook → ativação
- [ ] Webhook manual testado (curl)
- [ ] Redirecionamento pós-pagamento funcionando
- [ ] Proteção de features server-side testada

**Produção:**

- [ ] Dev mode desabilitado
- [ ] Webhook signature validation implementada
- [ ] Coletar taxId e cellphone reais no frontend
- [ ] Configurar webhook URL na dashboard AbacatePay
- [ ] Testar com PIX e Cartão reais

---

## 🔗 RECURSOS

**Docs:** https://docs.abacatepay.com  
**Dashboard:** https://dashboard.abacatepay.com  
**Métodos:** PIX, CARD  
**Webhook Events:** `billing.paid`, `pix.paid`, `pix.expired`  
**Teste PIX:** Use dev mode para simular pagamentos

---

**Diferenças vs Stripe:**

- ✅ Mais simples (sem SDK complexo)
- ✅ Foco no mercado brasileiro (PIX nativo)
- ✅ Pricing mais competitivo
- ❌ Sem recurência automática (criar nova billing manualmente)
- ❌ Sem billing portal (implementar custom)
- ❌ Menos features avançadas (trials, prorations, etc.)
