import { z } from 'zod';

export const GetOpportunitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
  stage: z.string().trim().optional(),
  source: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'expectedValue', 'expectedCloseDate', 'probability', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetOpportunitiesQueryDto = z.infer<typeof GetOpportunitiesQuerySchema>;
