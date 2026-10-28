import { z } from 'zod';
import { OpportunityStage } from '../../../constants/opportunity.constant';

export function isDateInPast(dateInput: string | Date): boolean {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return true;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [y, m, day] = dateInput.trim().split('-').map(Number);
    const targetDate = new Date(y, m - 1, day, 0, 0, 0, 0);
    return targetDate.getTime() < todayStart.getTime();
  }

  return d.getTime() < todayStart.getTime();
}

export const CreateOpportunitySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'Tên cơ hội bán hàng không được để trống' }),
    customerId: z
      .string()
      .trim()
      .min(1, { message: 'Khách hàng (customerId) không được để trống' }),
    primaryContactId: z.string().trim().optional().nullable(),
    contactId: z.string().trim().optional().nullable(),
    stage: z
      .nativeEnum(OpportunityStage)
      .optional()
      .default(OpportunityStage.QUALIFICATION),
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
  })
  .refine(
    (data) => {
      const rawDate = data.expectedCloseDate || data.closeDate;
      if (!rawDate) return true;
      const parsed = new Date(rawDate);
      return !isNaN(parsed.getTime());
    },
    {
      message: 'Ngày dự kiến chốt không đúng định dạng ngày tháng hợp lệ',
      path: ['expectedCloseDate'],
    }
  )
  .refine(
    (data) => {
      const rawDate = data.expectedCloseDate || data.closeDate;
      if (!rawDate) return true;
      return !isDateInPast(rawDate);
    },
    {
      message: 'Ngày dự kiến chốt không được nằm trong quá khứ khi tạo mới cơ hội',
      path: ['expectedCloseDate'],
    }
  );

export type CreateOpportunityDto = z.input<typeof CreateOpportunitySchema>;
export type CreateOpportunityOutputDto = z.output<typeof CreateOpportunitySchema>;
