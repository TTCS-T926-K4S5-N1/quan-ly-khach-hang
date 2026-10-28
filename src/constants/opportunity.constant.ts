export enum OpportunityStage {
  QUALIFICATION = 'QUALIFICATION',
  NEEDS_ANALYSIS = 'NEEDS_ANALYSIS',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
}

export const STAGE_DEFAULT_PROBABILITY: Record<OpportunityStage, number> = {
  [OpportunityStage.QUALIFICATION]: 10,
  [OpportunityStage.NEEDS_ANALYSIS]: 20,
  [OpportunityStage.PROPOSAL]: 50,
  [OpportunityStage.NEGOTIATION]: 75,
  [OpportunityStage.WON]: 100,
  [OpportunityStage.LOST]: 0,
};

export const DEFAULT_OPPORTUNITY_STAGE = OpportunityStage.QUALIFICATION;

/**
 * Lấy xác suất thành công mặc định dựa theo giai đoạn bán hàng
 */
export function getDefaultProbabilityForStage(stage: string): number {
  const normalized = stage?.trim().toUpperCase() as OpportunityStage;
  if (normalized && normalized in STAGE_DEFAULT_PROBABILITY) {
    return STAGE_DEFAULT_PROBABILITY[normalized];
  }
  return 10;
}

/**
 * Kiểm tra xem một chuỗi có phải là giai đoạn bán hàng hợp lệ hay không
 */
export function isValidOpportunityStage(stage: string): stage is OpportunityStage {
  const normalized = stage?.trim().toUpperCase();
  return Object.values(OpportunityStage).includes(normalized as OpportunityStage);
}
