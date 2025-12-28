import { z } from "zod";

export const createItemSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional().default(""),
});

export const updateItemSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
})
  .refine((data) => data.title !== undefined || data.description !== undefined, {
    message: "At least one field must be provided",
  });

export const listItemsQuerySchema = z.object({
  includeAll: z.enum(["true", "false"]).optional(),
});
