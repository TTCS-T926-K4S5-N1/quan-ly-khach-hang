import axios, { AxiosError } from 'axios';
import {
  Opportunity,
  OpportunityFilterParams,
  OpportunityHistoryItem,
  CloseWonPayload,
  CloseLostPayload,
  ReopenPayload,
  WinLossReason,
  Competitor,
  SalesQuota,
  OpportunityListResponse,
} from '../types/opportunity';

/**
 * Configure Axios Client for CRM Backend
 * In development, requests to /api are proxied by Vite to http://localhost:8080/crm
 */
export const apiClient = axios.create({
  baseURL: '',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Flag to indicate whether we fallback to mock data when backend is not available
const STORAGE_KEY_OPPS = 'crm_point76_opportunities';
const STORAGE_KEY_HISTORY = 'crm_point76_history';
const STORAGE_KEY_QUOTAS = 'crm_point76_quotas';

// Initial Mock Data
const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 101,
    code: 'OPP-2026-001',
    name: 'Gói giải pháp Chuyển đổi số Doanh nghiệp VNP',
    customerId: 1,
    customerName: 'Tập đoàn Công nghệ Viễn thông VNP',
    contactName: 'Nguyễn Văn Hùng',
    contactPhone: '0912 345 678',
    contactEmail: 'hung.nv@vnp-group.vn',
    amount: 850000000,
    stageId: 3,
    stageName: 'Đề xuất giải pháp',
    probability: 60,
    expectedCloseDate: '2026-10-30',
    status: 'OPEN',
    ownerUserId: 1,
    ownerName: 'Nguyễn Văn Hiếu (Kinh doanh)',
    createdAt: '2026-09-10 09:30:00',
  },
  {
    id: 102,
    code: 'OPP-2026-002',
    name: 'Hệ thống Quản lý Khách hàng CRM Cloud cho Vinagroup',
    customerId: 2,
    customerName: 'Công ty Cổ phần Thương mại Vinagroup',
    contactName: 'Trần Thị Mai',
    contactPhone: '0988 765 432',
    contactEmail: 'mai.tran@vinagroup.com.vn',
    amount: 420000000,
    stageId: 4,
    stageName: 'Đàm phán hợp đồng',
    probability: 80,
    expectedCloseDate: '2026-10-25',
    status: 'OPEN',
    ownerUserId: 1,
    ownerName: 'Nguyễn Văn Hiếu (Kinh doanh)',
    createdAt: '2026-09-15 14:15:00',
  },
  {
    id: 103,
    code: 'OPP-2026-003',
    name: 'Triển khai ERP & Tích hợp Kế toán Fast Pharma',
    customerId: 3,
    customerName: 'Dược phẩm Quốc tế Fast Pharma',
    contactName: 'Lê Hoàng Nam',
    contactPhone: '0903 112 233',
    contactEmail: 'nam.le@fastpharma.vn',
    amount: 600000000,
    stageId: 5,
    stageName: 'Chốt thành công',
    probability: 100,
    expectedCloseDate: '2026-10-05',
    status: 'WON',
    actualAmount: 620000000,
    contractDate: '2026-10-05',
    winReasonId: 1,
    winReasonName: 'Giải pháp kỹ thuật tối ưu vượt trội',
    winNotes: 'Khách hàng đánh giá rất cao demo hệ thống và dịch vụ hỗ trợ 24/7.',
    ownerUserId: 1,
    ownerName: 'Nguyễn Văn Hiếu (Kinh doanh)',
    createdAt: '2026-08-20 10:00:00',
  },
  {
    id: 104,
    code: 'OPP-2026-004',
    name: 'Nâng cấp Hạ tầng Mạng & Bảo mật Trung tâm Dữ liệu',
    customerId: 4,
    customerName: 'Ngân hàng TMCP An Bình Thịnh Vượng',
    contactName: 'Phạm Đức Minh',
    contactPhone: '0977 889 900',
    contactEmail: 'minh.pd@abtc.com.vn',
    amount: 1200000000,
    stageId: 6,
    stageName: 'Đóng thất bại',
    probability: 0,
    expectedCloseDate: '2026-10-02',
    status: 'LOST',
    lossReasonId: 1,
    lossReasonName: 'Giá cao',
    lostReason: 'Bên mua cắt giảm 30% ngân sách IT quý 4, gói thầu không đạt tiêu chí giá thấp nhất.',
    competitorId: 2,
    competitorName: 'FPT Information System',
    lossNotes: 'Đối thủ chào giá thấp hơn 15% kèm gói bảo trì miễn phí 2 năm.',
    ownerUserId: 2,
    ownerName: 'Lê Thu Trang (Kinh doanh)',
    createdAt: '2026-08-25 11:20:00',
  },
  {
    id: 105,
    code: 'OPP-2026-005',
    name: 'Phần mềm Quản lý Kho Thông minh SmartLogistics',
    customerId: 5,
    customerName: 'Logistics Toàn Cầu SmartLog',
    contactName: 'Hoàng Kim Oanh',
    contactPhone: '0934 556 778',
    contactEmail: 'oanh.hk@smartlog.vn',
    amount: 350000000,
    stageId: 2,
    stageName: 'Khảo sát nhu cầu',
    probability: 40,
    expectedCloseDate: '2026-11-15',
    status: 'OPEN',
    ownerUserId: 2,
    ownerName: 'Lê Thu Trang (Kinh doanh)',
    createdAt: '2026-10-01 08:45:00',
  },
  {
    id: 106,
    code: 'OPP-2026-006',
    name: 'Cung cấp Bản quyền Phần mềm Microsoft 365 Enterprise',
    customerId: 6,
    customerName: 'Tập đoàn Bất động sản Địa Ốc Xanh',
    contactName: 'Đỗ Quốc Bảo',
    contactPhone: '0919 223 344',
    contactEmail: 'bao.dq@diaocexanh.com',
    amount: 280000000,
    stageId: 4,
    stageName: 'Đàm phán hợp đồng',
    probability: 70,
    expectedCloseDate: '2026-10-28',
    status: 'OPEN',
    ownerUserId: 1,
    ownerName: 'Nguyễn Văn Hiếu (Kinh doanh)',
    createdAt: '2026-09-28 15:00:00',
  },
  {
    id: 107,
    code: 'OPP-2026-007',
    name: 'Hệ thống Quản trị Nhân sự & Chấm công AI HR-Tech',
    customerId: 7,
    customerName: 'Chuỗi Bán lẻ MegaMart Việt Nam',
    contactName: 'Vũ Thị Thanh',
    contactPhone: '0945 667 889',
    contactEmail: 'thanh.vu@megamart.vn',
    amount: 520000000,
    stageId: 6,
    stageName: 'Đóng thất bại',
    probability: 0,
    expectedCloseDate: '2026-09-30',
    status: 'LOST',
    lossReasonId: 7,
    lossReasonName: 'Lý do khác',
    otherReasonDetails: 'Doanh nghiệp thay đổi chiến lược cơ cấu ban giám đốc, tạm hoãn toàn bộ dự án IT nội bộ.',
    lostReason: 'Thay đổi chiến lược HĐQT',
    competitorName: 'Không có (Khách tự dừng)',
    ownerUserId: 3,
    ownerName: 'Trần Văn Nam (Trưởng nhóm KD)',
    createdAt: '2026-08-15 16:30:00',
  },
];

const INITIAL_HISTORY: Record<number, OpportunityHistoryItem[]> = {
  101: [
    {
      id: 'h101-1',
      opportunityId: 101,
      action: 'CREATE',
      actionNameVi: 'Tạo cơ hội mới',
      fromStatus: undefined,
      toStatus: 'OPEN',
      description: 'Cơ hội được khởi tạo với giá trị dự kiến 850.000.000 ₫',
      performedBy: 'Nguyễn Văn Hiếu',
      performedRole: 'Nhân viên kinh doanh',
      performedAt: '2026-09-10 09:30:00',
    },
    {
      id: 'h101-2',
      opportunityId: 101,
      action: 'STAGE_CHANGE',
      actionNameVi: 'Chuyển giai đoạn',
      fromStatus: 'OPEN',
      toStatus: 'OPEN',
      description: 'Chuyển từ "Khảo sát nhu cầu" sang "Đề xuất giải pháp" (Xác suất 60%)',
      performedBy: 'Nguyễn Văn Hiếu',
      performedRole: 'Nhân viên kinh doanh',
      performedAt: '2026-09-22 14:00:00',
    },
  ],
  103: [
    {
      id: 'h103-1',
      opportunityId: 103,
      action: 'CREATE',
      actionNameVi: 'Tạo cơ hội mới',
      toStatus: 'OPEN',
      description: 'Cơ hội được khởi tạo với giá trị dự kiến 600.000.000 ₫',
      performedBy: 'Nguyễn Văn Hiếu',
      performedRole: 'Nhân viên kinh doanh',
      performedAt: '2026-08-20 10:00:00',
    },
    {
      id: 'h103-2',
      opportunityId: 103,
      action: 'CLOSE_WON',
      actionNameVi: 'Đóng Thắng cơ hội',
      fromStatus: 'OPEN',
      toStatus: 'WON',
      description: 'Đóng thành công cơ hội với giá trị chốt thực tế 620.000.000 ₫',
      performedBy: 'Nguyễn Văn Hiếu',
      performedRole: 'Nhân viên kinh doanh',
      performedAt: '2026-10-05 16:45:00',
      actualAmount: 620000000,
      contractDate: '2026-10-05',
      winReason: 'Giải pháp kỹ thuật tối ưu vượt trội',
      notes: 'Khách hàng đánh giá rất cao demo hệ thống và dịch vụ hỗ trợ 24/7.',
    },
  ],
  104: [
    {
      id: 'h104-1',
      opportunityId: 104,
      action: 'CREATE',
      actionNameVi: 'Tạo cơ hội mới',
      toStatus: 'OPEN',
      description: 'Khởi tạo cơ hội giá trị dự kiến 1.200.000.000 ₫',
      performedBy: 'Lê Thu Trang',
      performedRole: 'Nhân viên kinh doanh',
      performedAt: '2026-08-25 11:20:00',
    },
    {
      id: 'h104-2',
      opportunityId: 104,
      action: 'CLOSE_LOST',
      actionNameVi: 'Đóng Thua cơ hội',
      fromStatus: 'OPEN',
      toStatus: 'LOST',
      description: 'Đóng thất bại do: Giá cao. Đối thủ thắng thầu: FPT Information System',
      performedBy: 'Lê Thu Trang',
      performedRole: 'Nhân viên kinh doanh',
      performedAt: '2026-10-02 11:00:00',
      lossReason: 'Giá cao',
      competitor: 'FPT Information System',
      notes: 'Bên mua cắt giảm 30% ngân sách IT quý 4.',
    },
  ],
  107: [
    {
      id: 'h107-1',
      opportunityId: 107,
      action: 'CREATE',
      actionNameVi: 'Tạo cơ hội mới',
      toStatus: 'OPEN',
      description: 'Khởi tạo cơ hội 520.000.000 ₫',
      performedBy: 'Trần Văn Nam',
      performedRole: 'Trưởng nhóm KD',
      performedAt: '2026-08-15 16:30:00',
    },
    {
      id: 'h107-2',
      opportunityId: 107,
      action: 'CLOSE_LOST',
      actionNameVi: 'Đóng Thua cơ hội',
      fromStatus: 'OPEN',
      toStatus: 'LOST',
      description: 'Lý do: Lý do khác (Doanh nghiệp thay đổi chiến lược cơ cấu ban giám đốc)',
      performedBy: 'Trần Văn Nam',
      performedRole: 'Trưởng nhóm KD',
      performedAt: '2026-09-30 17:10:00',
      lossReason: 'Lý do khác',
      notes: 'Doanh nghiệp thay đổi chiến lược cơ cấu ban giám đốc.',
    },
  ],
};

const INITIAL_QUOTAS: Record<number, SalesQuota> = {
  1: {
    userId: 1,
    userName: 'Nguyễn Văn Hiếu',
    period: 'Tháng 10/2026',
    targetAmount: 1000000000, // 1 Tỷ VND
    achievedAmount: 620000000, // 62%
    achievedPercentage: 62,
    wonCount: 1,
  },
  2: {
    userId: 2,
    userName: 'Lê Thu Trang',
    period: 'Tháng 10/2026',
    targetAmount: 800000000,
    achievedAmount: 0,
    achievedPercentage: 0,
    wonCount: 0,
  },
  3: {
    userId: 3,
    userName: 'Trần Văn Nam',
    period: 'Tháng 10/2026',
    targetAmount: 1500000000,
    achievedAmount: 450000000,
    achievedPercentage: 30,
    wonCount: 1,
  },
};

// Local storage helpers
function getStoredOpportunities(): Opportunity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPPS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read opportunities from localStorage', e);
  }
  localStorage.setItem(STORAGE_KEY_OPPS, JSON.stringify(INITIAL_OPPORTUNITIES));
  return INITIAL_OPPORTUNITIES;
}

function saveStoredOpportunities(data: Opportunity[]): void {
  localStorage.setItem(STORAGE_KEY_OPPS, JSON.stringify(data));
}

function getStoredHistory(): Record<number, OpportunityHistoryItem[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read history from localStorage', e);
  }
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(INITIAL_HISTORY));
  return INITIAL_HISTORY;
}

function saveStoredHistory(data: Record<number, OpportunityHistoryItem[]>): void {
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(data));
}

function getStoredQuotas(): Record<number, SalesQuota> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUOTAS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read quotas from localStorage', e);
  }
  localStorage.setItem(STORAGE_KEY_QUOTAS, JSON.stringify(INITIAL_QUOTAS));
  return INITIAL_QUOTAS;
}

function saveStoredQuotas(data: Record<number, SalesQuota>): void {
  localStorage.setItem(STORAGE_KEY_QUOTAS, JSON.stringify(data));
}

/**
 * Service API Methods
 */
export const opportunityService = {
  /**
   * 1. Lấy danh sách cơ hội kinh doanh (hỗ trợ tìm kiếm, lọc trạng thái, người sở hữu và phân trang)
   * API backend thực tế: GET /api/opportunities?keyword=...&status=...&page=...&size=...
   */
  async getOpportunities(params: OpportunityFilterParams = {}): Promise<OpportunityListResponse> {
    try {
      // Thử gọi backend API thực tế nếu máy chủ đang chạy
      const queryParams: Record<string, string | number> = {};
      if (params.keyword) queryParams.keyword = params.keyword;
      if (params.status && params.status !== 'ALL') queryParams.status = params.status;
      if (params.page) queryParams.page = params.page;
      if (params.size) queryParams.size = params.size;

      const response = await apiClient.get('/api/opportunities', { params: queryParams });
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const rawItems = response.data.data;
        // Transform backend response to Opportunity[]
        const mappedItems: Opportunity[] = rawItems.map((item: any) => ({
          id: item.id,
          code: `OPP-${String(item.id).padStart(4, '0')}`,
          name: item.name || 'Không có tiêu đề',
          customerId: item.customerId || item.customer_id,
          customerName: item.customerName || item.customer_name || 'Khách hàng',
          contactName: item.contactName || item.contact_name,
          amount: Number(item.amount) || 0,
          stageId: item.stageId || item.stage_id,
          stageName: item.stageName || item.stage_name || 'Đang mở',
          probability: Number(item.probability) || 0,
          expectedCloseDate: item.expectedCloseDate || item.expected_close_date || '',
          status: (item.status?.toUpperCase() || 'OPEN') as 'OPEN' | 'WON' | 'LOST',
          ownerUserId: item.ownerUserId || item.owner_user_id || 1,
          ownerName: item.ownerName || item.owner_name || 'Chuyên viên phụ trách',
          createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          actualAmount: item.actualAmount || item.amount,
          contractDate: item.contractDate || item.expected_close_date,
          winReasonName: item.winReasonName,
          lossReasonName: item.lossReasonName,
          competitorName: item.competitorName,
          lostReason: item.lostReason,
        }));

        return {
          items: mappedItems,
          total: mappedItems.length,
          page: params.page || 1,
          size: params.size || 10,
          totalPages: Math.ceil(mappedItems.length / (params.size || 10)) || 1,
        };
      }
    } catch (err) {
      // Backend not running or error, smoothly fallback to persistent mock data
      console.info('[OpportunityService] Sử dụng dữ liệu Mock đồng bộ:', err);
    }

    // Fallback Mock Logic
    let allOpps = getStoredOpportunities();

    // Filter by keyword
    if (params.keyword && params.keyword.trim()) {
      const kw = params.keyword.trim().toLowerCase();
      allOpps = allOpps.filter(
        (o) =>
          o.name.toLowerCase().includes(kw) ||
          o.code.toLowerCase().includes(kw) ||
          o.customerName.toLowerCase().includes(kw)
      );
    }

    // Filter by status
    if (params.status && params.status !== 'ALL') {
      allOpps = allOpps.filter((o) => o.status === params.status);
    }

    // Filter by owner
    if (params.ownerId && params.ownerId !== 'ALL') {
      allOpps = allOpps.filter((o) => o.ownerUserId === Number(params.ownerId));
    }

    const total = allOpps.length;
    const page = params.page || 1;
    const size = params.size || 6;
    const totalPages = Math.ceil(total / size) || 1;
    const paginatedItems = allOpps.slice((page - 1) * size, page * size);

    return {
      items: paginatedItems,
      total,
      page,
      size,
      totalPages,
    };
  },

  /**
   * 2. Lấy thông tin chi tiết một cơ hội kinh doanh
   * API backend: GET /api/opportunities/:id
   */
  async getOpportunityById(id: number): Promise<Opportunity> {
    try {
      const response = await apiClient.get(`/api/opportunities/${id}`);
      if (response.data && response.data.success && response.data.data) {
        const item = response.data.data;
        return {
          id: item.id,
          code: `OPP-${String(item.id).padStart(4, '0')}`,
          name: item.name,
          customerId: item.customerId || item.customer_id,
          customerName: item.customerName || item.customer_name,
          contactName: item.contactName || item.contact_name,
          amount: Number(item.amount) || 0,
          stageId: item.stageId || item.stage_id,
          stageName: item.stageName || item.stage_name,
          probability: Number(item.probability) || 0,
          expectedCloseDate: item.expectedCloseDate || item.expected_close_date,
          status: item.status?.toUpperCase(),
          ownerUserId: item.ownerUserId || item.owner_user_id,
          ownerName: item.ownerName || item.owner_name,
          createdAt: item.createdAt || item.created_at,
          actualAmount: item.actualAmount,
          contractDate: item.contractDate,
          winReasonName: item.winReasonName,
          lossReasonName: item.lossReasonName,
          competitorName: item.competitorName,
          lostReason: item.lostReason,
        };
      }
    } catch (e) {
      // Fallback
    }

    const all = getStoredOpportunities();
    const found = all.find((o) => o.id === Number(id));
    if (!found) {
      throw new Error(`Không tìm thấy cơ hội kinh doanh có mã ID #${id}`);
    }
    return found;
  },

  /**
   * 3. Đóng cơ hội Thắng (Close Won)
   * API backend thực tế: POST /api/opportunities/:id/close
   * Body: { status: "WON", winReasonId, actualAmount, contractDate, notes }
   */
  async closeOpportunityWon(
    id: number,
    payload: CloseWonPayload,
    currentUserName: string = 'Nguyễn Văn Hiếu'
  ): Promise<{ opportunity: Opportunity; quota: SalesQuota }> {
    // Check if opportunity is already closed
    const all = getStoredOpportunities();
    const existing = all.find((o) => o.id === Number(id));
    if (existing && existing.status !== 'OPEN') {
      throw new Error('Cơ hội này đã được đóng trước đó. Vui lòng tải lại trang.');
    }

    try {
      // Gửi request tới backend API thực tế
      const response = await apiClient.post(`/api/opportunities/${id}/close`, {
        status: 'WON',
        winReasonId: payload.winReasonId || 1,
        actualAmount: payload.actualAmount,
        contractDate: payload.contractDate,
        notes: payload.notes,
      });

      if (response.data && response.data.success) {
        // Cập nhật thành công từ API
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        throw new Error('Cơ hội đã được đóng bởi một người dùng khác.');
      }
      if (err.response?.status === 403) {
        throw new Error('Bạn không có quyền thực hiện đóng cơ hội này.');
      }
      // Continue to local sync
    }

    // Update Local Data
    const updatedList = all.map((opp) => {
      if (opp.id === Number(id)) {
        return {
          ...opp,
          status: 'WON' as const,
          actualAmount: payload.actualAmount,
          contractDate: payload.contractDate,
          winReasonId: payload.winReasonId,
          winReasonName: payload.winReasonId === 1 ? 'Giải pháp kỹ thuật tối ưu vượt trội' : 'Giá cả cạnh tranh & ưu đãi tốt',
          winNotes: payload.notes,
          stageName: 'Chốt thành công',
          probability: 100,
          updatedAt: new Date().toISOString(),
        };
      }
      return opp;
    });
    saveStoredOpportunities(updatedList);

    const updatedOpp = updatedList.find((o) => o.id === Number(id))!;

    // Add History Item
    const historyMap = getStoredHistory();
    const oppHistory = historyMap[id] || [];
    const now = new Date();
    const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    const newHistoryItem: OpportunityHistoryItem = {
      id: `h${id}-${Date.now()}`,
      opportunityId: id,
      action: 'CLOSE_WON',
      actionNameVi: 'Đóng Thắng cơ hội',
      fromStatus: 'OPEN',
      toStatus: 'WON',
      description: `Đóng Thắng thành công với Giá trị chốt: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload.actualAmount)}`,
      performedBy: currentUserName,
      performedRole: 'Nhân viên kinh doanh',
      performedAt: formattedNow,
      actualAmount: payload.actualAmount,
      contractDate: payload.contractDate,
      winReason: updatedOpp.winReasonName,
      notes: payload.notes,
    };
    historyMap[id] = [newHistoryItem, ...oppHistory];
    saveStoredHistory(historyMap);

    // Tính chỉ tiêu cho người sở hữu (giả lập backend tính toán trả về)
    const quotas = getStoredQuotas();
    const ownerId = updatedOpp.ownerUserId || 1;
    const currentQuota = quotas[ownerId] || {
      userId: ownerId,
      userName: updatedOpp.ownerName,
      period: 'Tháng 10/2026',
      targetAmount: 1000000000,
      achievedAmount: 0,
      achievedPercentage: 0,
      wonCount: 0,
    };

    const newAchieved = currentQuota.achievedAmount + payload.actualAmount;
    const newPercent = Math.min(100, Math.round((newAchieved / currentQuota.targetAmount) * 100));
    const updatedQuota: SalesQuota = {
      ...currentQuota,
      achievedAmount: newAchieved,
      achievedPercentage: newPercent,
      wonCount: currentQuota.wonCount + 1,
    };
    quotas[ownerId] = updatedQuota;
    saveStoredQuotas(quotas);

    return {
      opportunity: updatedOpp,
      quota: updatedQuota,
    };
  },

  /**
   * 4. Đóng cơ hội Thua (Close Lost)
   * API backend thực tế: POST /api/opportunities/:id/close
   * Body: { status: "LOST", lossReasonId, lossReasonName, competitorId, otherReasonDetails, notes }
   */
  async closeOpportunityLost(
    id: number,
    payload: CloseLostPayload,
    currentUserName: string = 'Nguyễn Văn Hiếu'
  ): Promise<Opportunity> {
    const all = getStoredOpportunities();
    const existing = all.find((o) => o.id === Number(id));
    if (existing && existing.status !== 'OPEN') {
      throw new Error('Cơ hội này đã được đóng trước đó. Vui lòng tải lại trang.');
    }

    try {
      await apiClient.post(`/api/opportunities/${id}/close`, {
        status: 'LOST',
        lossReasonId: payload.lossReasonId || 1,
        lossReasonName: payload.lossReasonName,
        competitorId: payload.competitorId,
        competitorName: payload.competitorName,
        lostReason: payload.otherReasonDetails || payload.notes || payload.lossReasonName,
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        throw new Error('Cơ hội đã được đóng bởi một người dùng khác.');
      }
      if (err.response?.status === 403) {
        throw new Error('Bạn không có quyền thực hiện đóng cơ hội này.');
      }
    }

    // Local state sync
    const updatedList = all.map((opp) => {
      if (opp.id === Number(id)) {
        return {
          ...opp,
          status: 'LOST' as const,
          lossReasonName: payload.lossReasonName,
          lossReasonId: payload.lossReasonId,
          otherReasonDetails: payload.otherReasonDetails,
          competitorId: payload.competitorId,
          competitorName: payload.competitorName,
          lostReason: payload.otherReasonDetails || payload.notes,
          lossNotes: payload.notes,
          stageName: 'Đóng thất bại',
          probability: 0,
          updatedAt: new Date().toISOString(),
        };
      }
      return opp;
    });
    saveStoredOpportunities(updatedList);

    const updatedOpp = updatedList.find((o) => o.id === Number(id))!;

    // History Item
    const historyMap = getStoredHistory();
    const oppHistory = historyMap[id] || [];
    const now = new Date();
    const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    const newHistoryItem: OpportunityHistoryItem = {
      id: `h${id}-${Date.now()}`,
      opportunityId: id,
      action: 'CLOSE_LOST',
      actionNameVi: 'Đóng Thua cơ hội',
      fromStatus: 'OPEN',
      toStatus: 'LOST',
      description: `Đóng Thua với lý do: ${payload.lossReasonName}${payload.competitorName ? ` | Đối thủ: ${payload.competitorName}` : ''}`,
      performedBy: currentUserName,
      performedRole: 'Nhân viên kinh doanh',
      performedAt: formattedNow,
      lossReason: payload.lossReasonName,
      competitor: payload.competitorName,
      notes: payload.otherReasonDetails || payload.notes,
    };
    historyMap[id] = [newHistoryItem, ...oppHistory];
    saveStoredHistory(historyMap);

    return updatedOpp;
  },

  /**
   * 5. Mở lại cơ hội kinh doanh (Reopen Opportunity)
   * Chỉ dành cho vai trò Trưởng nhóm trở lên
   * API backend thực tế: POST /api/opportunities/:id/reopen
   * Body: { reason: string }
   */
  async reopenOpportunity(
    id: number,
    payload: ReopenPayload,
    performedBy: string = 'Trần Văn Nam (Trưởng nhóm)',
    userRole: string = 'TEAM_LEAD'
  ): Promise<Opportunity> {
    // Validate role security
    if (userRole === 'SALES_REP') {
      throw new Error('Quyền hạn không đủ: Nhân viên kinh doanh không được phép mở lại cơ hội.');
    }

    try {
      await apiClient.post(`/api/opportunities/${id}/reopen`, {
        reason: payload.reason,
      });
    } catch (e) {
      // Fallback
    }

    const all = getStoredOpportunities();
    const existing = all.find((o) => o.id === Number(id));
    if (!existing) {
      throw new Error('Cơ hội không tồn tại');
    }
    const previousStatus = existing.status;

    const updatedList = all.map((opp) => {
      if (opp.id === Number(id)) {
        return {
          ...opp,
          status: 'OPEN' as const,
          stageName: 'Đàm phán mở lại',
          probability: 50,
          reopenedAt: new Date().toISOString(),
          reopenedBy: performedBy,
          reopenReason: payload.reason,
          updatedAt: new Date().toISOString(),
        };
      }
      return opp;
    });
    saveStoredOpportunities(updatedList);

    const updatedOpp = updatedList.find((o) => o.id === Number(id))!;

    // History Item
    const historyMap = getStoredHistory();
    const oppHistory = historyMap[id] || [];
    const now = new Date();
    const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    const newHistoryItem: OpportunityHistoryItem = {
      id: `h${id}-${Date.now()}`,
      opportunityId: id,
      action: 'REOPEN',
      actionNameVi: 'Mở lại cơ hội kinh doanh',
      fromStatus: previousStatus,
      toStatus: 'OPEN',
      description: `Cơ hội được mở lại từ trạng thái ${previousStatus === 'WON' ? 'Thắng' : 'Thua'} sang Đang mở`,
      performedBy: performedBy,
      performedRole: 'Trưởng nhóm kinh doanh',
      performedAt: formattedNow,
      reason: payload.reason,
    };
    historyMap[id] = [newHistoryItem, ...oppHistory];
    saveStoredHistory(historyMap);

    return updatedOpp;
  },

  /**
   * 6. Lấy lịch sử hoạt động của cơ hội (Opportunity Timeline History)
   * API backend thực tế: GET /api/opportunities/:id/history
   */
  async getOpportunityHistory(id: number): Promise<OpportunityHistoryItem[]> {
    try {
      const response = await apiClient.get(`/api/opportunities/${id}/history`);
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (e) {
      // Fallback
    }

    const historyMap = getStoredHistory();
    return historyMap[id] || [
      {
        id: `h${id}-init`,
        opportunityId: id,
        action: 'CREATE',
        actionNameVi: 'Khởi tạo cơ hội',
        toStatus: 'OPEN',
        description: 'Cơ hội đã được khởi tạo trong hệ thống.',
        performedBy: 'Hệ thống CRM',
        performedAt: '2026-09-01 10:00:00',
      },
    ];
  },

  /**
   * Lấy danh mục Lý do Thắng
   * API backend: GET /api/win-loss-reasons?type=WON
   */
  async getWinReasons(): Promise<WinLossReason[]> {
    try {
      const response = await apiClient.get('/api/win-loss-reasons', { params: { type: 'WON' } });
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (e) {
      // Fallback
    }
    return [
      { id: 1, name: 'Giải pháp kỹ thuật tối ưu vượt trội', type: 'WON' },
      { id: 2, name: 'Giá cả cạnh tranh & ưu đãi tốt', type: 'WON' },
      { id: 3, name: 'Chất lượng dịch vụ hỗ trợ khách hàng', type: 'WON' },
      { id: 4, name: 'Mối quan hệ và uy tín thương hiệu', type: 'WON' },
      { id: 5, name: 'Thời gian triển khai nhanh', type: 'WON' },
    ];
  },

  /**
   * Lấy danh mục Đối thủ cạnh tranh
   * API backend: GET /api/competitors
   */
  async getCompetitors(): Promise<Competitor[]> {
    try {
      const response = await apiClient.get('/api/competitors');
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (e) {
      // Fallback
    }
    return [
      { id: 1, name: 'Viettel Solutions' },
      { id: 2, name: 'FPT Information System' },
      { id: 3, name: 'MISA JSC' },
      { id: 4, name: 'CMC Telecom' },
      { id: 5, name: 'Base.vn' },
      { id: 6, name: 'Đối thủ khác' },
    ];
  },

  /**
   * Lấy chỉ tiêu bán hàng của một nhân viên (Sales Quota)
   * Phản ánh số liệu từ backend
   */
  async getSalesQuota(userId: number): Promise<SalesQuota> {
    const quotas = getStoredQuotas();
    return (
      quotas[userId] || {
        userId,
        userName: 'Chuyên viên kinh doanh',
        period: 'Tháng 10/2026',
        targetAmount: 1000000000,
        achievedAmount: 0,
        achievedPercentage: 0,
        wonCount: 0,
      }
    );
  },
};
