import { z } from 'zod';

export const MarkCareContactParamsSchema = z.object({
  customerId: z.string().min(1, { message: 'Mã customerId không được để trống' }),
});

export const MarkCareContactBodySchema = z.object({
  contactedAt: z
    .string()
    .datetime({ message: 'Thời gian contactedAt phải đúng định dạng ISO 8601 (VD: 2026-10-08T08:00:00Z)' })
    .optional(),
  note: z.string().trim().max(1000, { message: 'Ghi chú liên hệ không được vượt quá 1000 ký tự' }).optional(),
  channel: z.enum(['PHONE', 'EMAIL', 'MEETING', 'ZALO', 'OTHER']).optional().default('PHONE'),
});

export interface MarkCareContactInputDto {
  contactedAt?: string;
  note?: string;
  channel?: 'PHONE' | 'EMAIL' | 'MEETING' | 'ZALO' | 'OTHER' | string;
}

export type MarkCareContactParamsDto = z.infer<typeof MarkCareContactParamsSchema>;
export type MarkCareContactBodyDto = z.infer<typeof MarkCareContactBodySchema>;
