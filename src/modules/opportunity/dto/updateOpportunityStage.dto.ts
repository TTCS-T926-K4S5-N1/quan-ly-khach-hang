import { z } from 'zod';
import { OpportunityStage } from '../../../constants/opportunity.constant';

export const UpdateOpportunityStageSchema = z.object({
  stage: z.nativeEnum(OpportunityStage),
  probability: z
    .number()
    .min(0, { message: 'Xác suất thành công phải từ 0 đến 100%' })
    .max(100, { message: 'Xác suất thành công phải từ 0 đến 100%' })
    .optional()
    .nullable(),
});

export type UpdateOpportunityStageDto = z.infer<typeof UpdateOpportunityStageSchema>;
