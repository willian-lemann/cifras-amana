import prisma from "@/lib/prisma";
import type { CreateItemInput, UpdateItemInput } from "@/lib/schemas/item";

// Business logic and data access for Items. Every function is scoped to a
// userId so a user can only ever touch their own records (ownership check).
// This is the single responsibility of this module — routes stay thin.

export function listItems(userId: string) {
  return prisma.item.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function createItem(userId: string, input: CreateItemInput) {
  return prisma.item.create({
    data: { userId, title: input.title, content: input.content ?? null },
  });
}

export async function getItem(userId: string, id: string) {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item || item.userId !== userId) return null;
  return item;
}

export async function updateItem(
  userId: string,
  id: string,
  input: UpdateItemInput,
) {
  const existing = await getItem(userId, id);
  if (!existing) return null;

  return prisma.item.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content ?? null }),
    },
  });
}

export async function deleteItem(userId: string, id: string): Promise<boolean> {
  const existing = await getItem(userId, id);
  if (!existing) return false;

  await prisma.item.delete({ where: { id } });
  return true;
}
