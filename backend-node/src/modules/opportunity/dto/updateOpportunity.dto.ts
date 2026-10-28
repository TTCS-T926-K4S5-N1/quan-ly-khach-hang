import { z } from 'zod';
import { OpportunityStage } from '../../../constants/opportunity.constant';

export const UpdateOpportunitySchema = z.object({
  name: z.string().trim().min(1, { message: 'Tên cơ hội bán hàng không được để trống' }).optional(),
  customerId: z.string().trim().min(1, { message: 'Khách hàng (customerId) không được để trống' }).optional(),
  primaryContactId: z.string().trim().optional().nullable(),
  contactId: z.string().trim().optional().nullable(),
  stage: z.nativeEnum(OpportunityStage).optional(),
  expectedValue: z
    .number()
    .nonnegative({ message: 'Giá trị dự kiến phải lớn hơn hoặc bằng 0' })
    .optional()
    .nullable(),
  amount: z
    .number()
    .nonnegative({ message: 'Giá trị dự kiến phải lớn hơn hoặc bằng 0' })
    .optional()
    .nullable(),
  expectedCloseDate: z.string().trim().optional().nullable(),
  closeDate: z.string().trim().optional().nullable(),
  source: z.string().trim().optional().nullable(),
  probability: z
    .number()
    .min(0, { message: 'Xác suất thành công phải từ 0 đến 100%' })
    .max(100, { message: 'Xác suất thành công phải từ 0 đến 100%' })
    .optional()
    .nullable(),
  notes: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
});

export const OpportunityIdParamSchema = z.object({
  id: z.string().trim().min(1, { message: 'ID cơ hội không được để trống' }),
});

export type UpdateOpportunityDto = z.infer<typeof UpdateOpportunitySchema>;
export type OpportunityIdParamDto = z.infer<typeof OpportunityIdParamSchema>;
