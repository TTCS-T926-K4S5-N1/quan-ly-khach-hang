import { z } from 'zod';

export const ConvertLeadParamsSchema = z.object({
  id: z.string().trim().min(1, 'ID của Lead không được để trống'),
});

export const ConvertLeadBodySchema = z.object({
  customerName: z.string().trim().min(1).optional(),
  customerCode: z.string().trim().min(1).optional(),
  contactName: z.string().trim().min(1).optional(),
  opportunityName: z.string().trim().min(1).optional(),
  opportunityAmount: z.number().nonnegative('Giá trị cơ hội bán hàng phải lớn hơn hoặc bằng 0').optional(),
  opportunityStage: z.string().trim().optional(),
  opportunityCloseDate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ConvertLeadParamsDto = z.infer<typeof ConvertLeadParamsSchema>;
export type ConvertLeadBodyDto = z.infer<typeof ConvertLeadBodySchema>;

export interface ConvertedLeadResponse {
  leadId: string;
  status: string;
  customer: {
    id: string;
    customerCode: string;
    name: string;
    customerName: string;
    phone?: string | null;
    email?: string | null;
  };
  contact: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
  };
  opportunity: {
    id: string;
    name: string;
    status: string;
    stage: string;
    amount?: number | null;
    closeDate?: Date | null;
  };
}
