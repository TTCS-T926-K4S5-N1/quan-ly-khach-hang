export type Role = 'SALES_REP' | 'TEAM_LEAD' | 'DIRECTOR';

export interface StageCondition {
  id: string;
  description: string;
  isMet: boolean;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  company: string;
  currentStage: string;
  loggedMeetingsCount: number;
  hasProposal: boolean;
  contractSigned: boolean;
  overrideHistory?: {
    overriddenBy: string;
    role: Role;
    reason: string;
    timestamp: string;
    fromStage: string;
    toStage: string;
  }[];
}

export interface Stage {
  id: string;
  name: string;
  requiredConditions: (deal: Deal) => { id: string; name: string; isMet: boolean; details: string }[];
}
