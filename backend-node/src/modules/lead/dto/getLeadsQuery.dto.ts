import { z } from 'zod';

export const GetLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  source: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

export type GetLeadsQueryDto = z.infer<typeof GetLeadsQuerySchema>;
