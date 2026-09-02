import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 },
    );
  }

  const subscriptionTier = user.subscriptions[0]?.plan || "free";

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    subscriptionTier,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, image } = body as Record<string, string | undefined>;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(image !== undefined && { image }),
    },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { reason } = body as { reason?: string };

  if (!reason || reason.trim().length === 0) {
    return NextResponse.json(
      { error: "É necessário informar o motivo da exclusão." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscriptions: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 },
    );
  }

  // Cancel active Stripe subscriptions before deleting
  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  for (const sub of user.subscriptions) {
    if (
      sub.stripeSubscriptionId &&
      (sub.status === "active" || sub.status === "trialing")
    ) {
      try {
        await stripeClient.subscriptions.cancel(sub.stripeSubscriptionId);
      } catch {
        // Subscription may already be cancelled – continue
      }
    }
  }

  // Log deletion reason (for audit trail)
  console.log(
    `[Account Deletion] user=${user.id} email=${user.email} reason="${reason.trim()}"`,
  );

  // Delete user – all related data is cascade-deleted by Prisma
  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ success: true });
}
