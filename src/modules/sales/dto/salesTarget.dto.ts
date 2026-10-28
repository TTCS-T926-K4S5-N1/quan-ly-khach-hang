import { z } from 'zod';

export const SetSalesTargetSchema = z
  .object({
    targetValue: z.number().min(0, 'Chỉ tiêu doanh số phải lớn hơn hoặc bằng 0'),
    periodType: z.enum(['MONTH', 'QUARTER', 'YEAR']),
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12).optional(),
    quarter: z.number().int().min(1).max(4).optional(),
    userId: z.string().trim().optional(),
    groupId: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.periodType === 'MONTH' && !data.month) {
        return false;
      }
      if (data.periodType === 'QUARTER' && !data.quarter) {
        return false;
      }
      return true;
    },
    {
      message: 'Vui lòng cung cấp tháng hợp lệ cho chỉ tiêu theo tháng hoặc quý hợp lệ cho chỉ tiêu theo quý',
    }
  )
  .refine(
    (data) => {
      // Ít nhất phải có userId hoặc groupId
      return Boolean(data.userId || data.groupId);
    },
    {
      message: 'Chỉ tiêu phải được gán cho một nhân viên (userId) hoặc một nhóm (groupId)',
    }
  );

export type SetSalesTargetDto = z.infer<typeof SetSalesTargetSchema>;

export const GetSalesTargetsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  periodType: z.enum(['MONTH', 'QUARTER', 'YEAR']).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  quarter: z.coerce.number().int().min(1).max(4).optional(),
  userId: z.string().trim().optional(),
  groupId: z.string().trim().optional(),
});

export type GetSalesTargetsQueryDto = z.infer<typeof GetSalesTargetsQuerySchema>;
