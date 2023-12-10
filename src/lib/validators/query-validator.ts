import { z } from "zod";

export const QueryValidator = z.object({
  category: z.string().optional(),
  sort: z.enum(["asc", "desc"]).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export type TQueryValidator = z.infer<typeof QueryValidator>;
