export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST';

export type UserRole = 'SALES_REP' | 'TEAM_LEAD' | 'MANAGER' | 'ADMIN';

export interface UserContext {
  id: number;
  fullName: string;
  role: UserRole;
  roleNameVi: string;
}

export interface WinLossReason {
  id: number;
  name: string;
  type: 'WON' | 'LOST';
  code?: string;
}

export interface Competitor {
  id: number;
  name: string;
  website?: string;
  description?: string;
}

export interface OpportunityHistoryItem {
  id: string | number;
  opportunityId: number;
  action: 'CREATE' | 'STAGE_CHANGE' | 'CLOSE_WON' | 'CLOSE_LOST' | 'REOPEN' | 'UPDATE';
  actionNameVi: string;
  fromStatus?: OpportunityStatus;
  toStatus?: OpportunityStatus;
  description: string;
  performedBy: string;
  performedRole?: string;
  performedAt: string;
  actualAmount?: number;
  contractDate?: string;
  winReason?: string;
  lossReason?: string;
  competitor?: string;
  reason?: string; // Reason for reopen
  notes?: string;
}

export interface Opportunity {
  id: number;
  code: string; // e.g. OPP-00123
  name: string;
  customerId: number;
  customerName: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  amount: number; // Expected amount (Giá trị dự kiến)
  stageId?: number;
  stageName: string;
  probability: number;
  expectedCloseDate: string; // YYYY-MM-DD
  status: OpportunityStatus;
  
  // Close Won Data
  actualAmount?: number; // Giá trị chốt thực tế (bắt buộc khi thắng)
  contractDate?: string; // Ngày ký hợp đồng (bắt buộc khi thắng)
  winReasonId?: number;
  winReasonName?: string;
  winNotes?: string;

  // Close Lost Data
  lossReasonId?: number;
  lossReasonName?: string; // e.g. "Giá cao", "Lý do khác"
  lostReason?: string; // Custom notes or reason details
  otherReasonDetails?: string; // Chi tiết khi chọn "Lý do khác"
  competitorId?: number;
  competitorName?: string;
  lossNotes?: string;

  // Reopen Data
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;

  // Ownership & Timestamps
  ownerUserId: number;
  ownerName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SalesQuota {
  userId: number;
  userName: string;
  period: string; // e.g. "Tháng 10/2026"
  targetAmount: number; // Chỉ tiêu doanh số (VND)
  achievedAmount: number; // Đã đạt được từ các deal WON (VND)
  achievedPercentage: number;
  wonCount: number;
}

export interface CloseWonPayload {
  actualAmount: number;
  contractDate: string;
  winReasonId?: number;
  notes?: string;
}

export interface CloseLostPayload {
  lossReasonName: string;
  lossReasonId?: number;
  otherReasonDetails?: string;
  competitorId?: number;
  competitorName?: string;
  notes?: string;
}

export interface ReopenPayload {
  reason: string;
}

export interface OpportunityFilterParams {
  keyword?: string;
  status?: OpportunityStatus | 'ALL';
  ownerId?: number | 'ALL';
  page?: number;
  size?: number;
}

export interface OpportunityListResponse {
  items: Opportunity[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
