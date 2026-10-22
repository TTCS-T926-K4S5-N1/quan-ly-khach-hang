import { z } from 'zod';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../../../constants/pagination.constant';

export const GetCustomerCareQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? Number(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && Number.isInteger(val) && val > 0), {
      message: 'Tham số days phải là số nguyên dương lớn hơn 0',
    }),
  page: z
    .string()
    .optional()
    .default(String(DEFAULT_PAGE))
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && Number.isInteger(val) && val >= 1, {
      message: 'Tham số page phải là số nguyên lớn hơn hoặc bằng 1',
    }),
  limit: z
    .string()
    .optional()
    .default(String(DEFAULT_LIMIT))
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && Number.isInteger(val) && val >= 1 && val <= MAX_LIMIT, {
      message: `Tham số limit phải là số nguyên từ 1 đến ${MAX_LIMIT}`,
    }),
  search: z.string().trim().optional(),
});

export interface GetCustomerCareFilterDto {
  days?: number;
  page?: number;
  limit?: number;
  search?: string;
}

export type GetCustomerCareQueryDto = z.infer<typeof GetCustomerCareQuerySchema>;
