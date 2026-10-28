import { z } from 'zod';
import { ForecastPeriodType } from '../sales.constant';

export const GetForecastQuerySchema = z.object({
  period: z
    .enum([ForecastPeriodType.MONTH, ForecastPeriodType.QUARTER, ForecastPeriodType.YEAR])
    .default(ForecastPeriodType.MONTH),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  quarter: z.coerce.number().int().min(1).max(4).optional(),
  employeeId: z.string().trim().optional(),
  groupId: z.string().trim().optional(),
});

export type GetForecastQueryDto = z.infer<typeof GetForecastQuerySchema>;
