import { z } from "zod/v4";

// Validation is the single responsibility of this module.

export const createItemSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  content: z.string().max(10000).optional(),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
