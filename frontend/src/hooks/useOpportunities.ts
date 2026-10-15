import { useState, useEffect, useCallback } from 'react';
import {
  Opportunity,
  OpportunityFilterParams,
  UserContext,
  SalesQuota,
  CloseWonPayload,
  CloseLostPayload,
  ReopenPayload,
} from '../types/opportunity';
import { opportunityService } from '../services/opportunityService';

export const DEFAULT_USER: UserContext = {
  id: 1,
  fullName: 'Nguyễn Văn Hiếu',
  role: 'SALES_REP',
  roleNameVi: 'Nhân viên kinh doanh',
};

export const AVAILABLE_ROLES: UserContext[] = [
  {
    id: 1,
    fullName: 'Nguyễn Văn Hiếu',
    role: 'SALES_REP',
    roleNameVi: 'Nhân viên kinh doanh',
  },
  {
    id: 3,
    fullName: 'Trần Văn Nam',
    role: 'TEAM_LEAD',
    roleNameVi: 'Trưởng nhóm kinh doanh',
  },
  {
    id: 99,
    fullName: 'Phạm Hồng Sơn',
    role: 'MANAGER',
    roleNameVi: 'Quản lý kinh doanh',
  },
];

export function useOpportunities() {
  const [currentUser, setCurrentUser] = useState<UserContext>(DEFAULT_USER);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterParams, setFilterParams] = useState<OpportunityFilterParams>({
    keyword: '',
    status: 'ALL',
    ownerId: 'ALL',
    page: 1,
    size: 6,
  });

  // Modals state
  const [selectedOppForWon, setSelectedOppForWon] = useState<Opportunity | null>(null);
  const [selectedOppForLost, setSelectedOppForLost] = useState<Opportunity | null>(null);
  const [selectedOppForReopen, setSelectedOppForReopen] = useState<Opportunity | null>(null);

  // User Quota
  const [quota, setQuota] = useState<SalesQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState<boolean>(false);

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Fetch opportunities
  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await opportunityService.getOpportunities(filterParams);
      setOpportunities(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tải danh sách cơ hội kinh doanh');
    } finally {
      setLoading(false);
    }
  }, [filterParams]);

  // Fetch quota for user
  const fetchQuota = useCallback(async () => {
    setQuotaLoading(true);
    try {
      const q = await opportunityService.getSalesQuota(currentUser.id);
      setQuota(q);
    } catch (e) {
      console.error(e);
    } finally {
      setQuotaLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Search and filter change handlers
  const handleKeywordChange = (keyword: string) => {
    setFilterParams((prev) => ({ ...prev, keyword, page: 1 }));
  };

  const handleStatusChange = (status: OpportunityFilterParams['status']) => {
    setFilterParams((prev) => ({ ...prev, status, page: 1 }));
  };

  const handleOwnerChange = (ownerId: OpportunityFilterParams['ownerId']) => {
    setFilterParams((prev) => ({ ...prev, ownerId, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilterParams((prev) => ({ ...prev, page }));
  };

  // Close Won Action
  const submitCloseWon = async (id: number, payload: CloseWonPayload) => {
    try {
      const result = await opportunityService.closeOpportunityWon(id, payload, currentUser.fullName);
      showToast(`Đóng Thắng thành công cơ hội "${result.opportunity.name}"!`, 'success');
      setSelectedOppForWon(null);
      // Backend returns updated quota - set directly without frontend recalculation
      if (result.quota) {
        setQuota(result.quota);
      }
      await fetchOpportunities();
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi đóng cơ hội Thắng', 'error');
      throw err;
    }
  };

  // Close Lost Action
  const submitCloseLost = async (id: number, payload: CloseLostPayload) => {
    try {
      const result = await opportunityService.closeOpportunityLost(id, payload, currentUser.fullName);
      showToast(`Đã đóng Thua cơ hội "${result.name}"`, 'info');
      setSelectedOppForLost(null);
      await fetchOpportunities();
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi đóng cơ hội Thua', 'error');
      throw err;
    }
  };

  // Reopen Action
  const submitReopen = async (id: number, payload: ReopenPayload) => {
    try {
      const result = await opportunityService.reopenOpportunity(
        id,
        payload,
        `${currentUser.fullName} (${currentUser.roleNameVi})`,
        currentUser.role
      );
      showToast(`Đã mở lại thành công cơ hội "${result.name}"! Trạng thái: Đang mở`, 'success');
      setSelectedOppForReopen(null);
      await fetchOpportunities();
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi mở lại cơ hội', 'error');
      throw err;
    }
  };

  return {
    currentUser,
    setCurrentUser,
    opportunities,
    total,
    totalPages,
    loading,
    error,
    filterParams,
    quota,
    quotaLoading,
    toast,
    setToast,
    showToast,
    handleKeywordChange,
    handleStatusChange,
    handleOwnerChange,
    handlePageChange,
    fetchOpportunities,
    selectedOppForWon,
    setSelectedOppForWon,
    selectedOppForLost,
    setSelectedOppForLost,
    selectedOppForReopen,
    setSelectedOppForReopen,
    submitCloseWon,
    submitCloseLost,
    submitReopen,
  };
}
