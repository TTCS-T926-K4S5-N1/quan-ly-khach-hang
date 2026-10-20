import React, { useState, useMemo } from 'react';
import { 
  Users, 
  ArrowRightLeft, 
  History, 
  Filter, 
  Search, 
  CheckSquare, 
  Square, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Building2, 
  Phone, 
  Mail, 
  FileText, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Eye,
  X,
  CheckCircle2
} from 'lucide-react';

// ==================== TYPES & INTERFACES ==================== //

export type UserRole = 'LEADER' | 'REP';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  activeDealsCount: number;
  status: 'active' | 'on_leave' | 'overloaded';
}

export interface Opportunity {
  id: string;
  title: string;
  customerName: string;
  company: string;
  value: number;
  stage: 'Mới tạo' | 'Đã tiếp cận' | 'Đề xuất giải pháp' | 'Đàm phán' | 'Thành công';
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  lastActivity: string;
  status: 'active' | 'stagnant' | 'transferred';
  historyLogs: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  date: string;
  type: 'creation' | 'reassignment' | 'note' | 'stage_change';
  performerName: string;
  description: string;
  reason?: string;
  fromUser?: string;
  toUser?: string;
}

export interface ReassignmentLog {
  id: string;
  timestamp: string;
  dealIds: string[];
  dealTitles: string[];
  fromUser: string;
  toUser: string;
  reason: string;
  transferredBy: string;
  totalValue: number;
}

// ==================== MOCK DATA ==================== //

const INITIAL_MEMBERS: TeamMember[] = [
  { id: 'm1', name: 'Nguyễn Văn Nam', email: 'nam.nguyen@company.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', role: 'Sales Executive', activeDealsCount: 8, status: 'overloaded' },
  { id: 'm2', name: 'Trần Thị Thu Hà', email: 'ha.tran@company.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', role: 'Senior Sales', activeDealsCount: 12, status: 'on_leave' },
  { id: 'm3', name: 'Lê Hoàng Long', email: 'long.le@company.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', role: 'Sales Executive', activeDealsCount: 4, status: 'active' },
  { id: 'm4', name: 'Phạm Minh Anh', email: 'anh.pham@company.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80', role: 'Sales Specialist', activeDealsCount: 3, status: 'active' },
];

const INITIAL_DEALS: Opportunity[] = [
  {
    id: 'DEAL-101',
    title: 'Hợp đồng ERP Cho Viettel Tech',
    customerName: 'Anh Hoàng Quốc Bảo',
    company: 'Tập đoàn Viettel',
    value: 450000000,
    stage: 'Đàm phán',
    ownerId: 'm2',
    ownerName: 'Trần Thị Thu Hà',
    ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    lastActivity: '2026-10-18 14:30',
    status: 'stagnant',
    historyLogs: [
      { id: 'l1', date: '2026-10-10 09:00', type: 'creation', performerName: 'Trần Thị Thu Hà', description: 'Tạo cơ hội kinh doanh mới từ Lead Triển lãm Tech2026.' },
      { id: 'l2', date: '2026-10-15 11:20', type: 'note', performerName: 'Trần Thị Thu Hà', description: 'Gửi báo giá đợt 1 cho Anh Bảo. Khách đang cân nhắc gói Enterprise.' },
    ]
  },
  {
    id: 'DEAL-102',
    title: 'Nâng cấp Hạ tầng Cloud Server',
    customerName: 'Chị Nguyễn Mai Phương',
    company: 'Công ty Cổ phần VNG',
    value: 280000000,
    stage: 'Đề xuất giải pháp',
    ownerId: 'm2',
    ownerName: 'Trần Thị Thu Hà',
    ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    lastActivity: '2026-10-17 09:15',
    status: 'stagnant',
    historyLogs: [
      { id: 'l3', date: '2026-10-12 10:00', type: 'creation', performerName: 'Trần Thị Thu Hà', description: 'Khách hàng đăng ký qua Landing Page.' }
    ]
  },
  {
    id: 'DEAL-103',
    title: 'Triển khai CRM cho Chuỗi VinMart',
    customerName: 'Anh Phạm Đức Minh',
    company: 'Masan Group',
    value: 620000000,
    stage: 'Đã tiếp cận',
    ownerId: 'm1',
    ownerName: 'Nguyễn Văn Nam',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    lastActivity: '2026-10-19 16:45',
    status: 'active',
    historyLogs: [
      { id: 'l4', date: '2026-10-14 08:30', type: 'creation', performerName: 'Nguyễn Văn Nam', description: 'Cơ hội từ đối tác giới thiệu.' }
    ]
  },
  {
    id: 'DEAL-104',
    title: 'Gói Bảo mật An ninh mạng Tổng thể',
    customerName: 'Lê Tuấn Kiệt',
    company: 'Ngân hàng VPBank',
    value: 890000000,
    stage: 'Đàm phán',
    ownerId: 'm1',
    ownerName: 'Nguyễn Văn Nam',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    lastActivity: '2026-10-19 10:00',
    status: 'active',
    historyLogs: [
      { id: 'l5', date: '2026-10-01 14:00', type: 'creation', performerName: 'Nguyễn Văn Nam', description: 'Cuộc họp giới thiệu giải pháp trực tiếp.' }
    ]
  },
  {
    id: 'DEAL-105',
    title: 'Cung cấp Phần mềm Nhân sự HRM',
    customerName: 'Chị Đỗ Mỹ Linh',
    company: 'Thaco Auto',
    value: 150000000,
    stage: 'Mới tạo',
    ownerId: 'm3',
    ownerName: 'Lê Hoàng Long',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    lastActivity: '2026-10-20 08:00',
    status: 'active',
    historyLogs: [
      { id: 'l6', date: '2026-10-20 08:00', type: 'creation', performerName: 'Lê Hoàng Long', description: 'Yêu cầu tư vấn gửi qua Website.' }
    ]
  }
];

const INITIAL_LOGS: ReassignmentLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-10-15 15:30',
    dealIds: ['DEAL-099'],
    dealTitles: ['Hệ thống POS Chuỗi Cà phê Highlands'],
    fromUser: 'Trần Thị Thu Hà',
    toUser: 'Phạm Minh Anh',
    reason: 'Nhân viên nghỉ phép thai sản dài hạn',
    transferredBy: 'Trưởng nhóm (Admin)',
    totalValue: 320000000
  }
];

// Format currency VNĐ
const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function App() {
  // States
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('LEADER');
  const [selectedRepId, setSelectedRepId] = useState<string>('m3'); // Cho góc nhìn Nhân viên
  const [activeTab, setActiveTab] = useState<'deals' | 'logs' | 'team'>('deals');

  const [deals, setDeals] = useState<Opportunity[]>(INITIAL_DEALS);
  const [teamMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [reassignmentLogs, setReassignmentLogs] = useState<ReassignmentLog[]>(INITIAL_LOGS);

  // Selection state
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [transferReasonCategory, setTransferReasonCategory] = useState<string>('Nghỉ phép dài hạn');
  const [customReasonNote, setCustomReasonNote] = useState<string>('');
  const [selectedDealForDetail, setSelectedDealForDetail] = useState<Opportunity | null>(null);

  // Quick Notification Banner
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      // Role Filter
      if (currentUserRole === 'REP' && deal.ownerId !== selectedRepId) {
        return false;
      }

      // Search Query
      const matchSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          deal.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          deal.customerName.toLowerCase().includes(searchQuery.toLowerCase());

      // Owner Filter
      const matchOwner = filterOwner === 'all' || deal.ownerId === filterOwner;

      // Stage Filter
      const matchStage = filterStage === 'all' || deal.stage === filterStage;

      return matchSearch && matchOwner && matchStage;
    });
  }, [deals, currentUserRole, selectedRepId, searchQuery, filterOwner, filterStage]);

  // Checkbox logic
  const handleSelectAll = () => {
    if (selectedDealIds.length === filteredDeals.length) {
      setSelectedDealIds([]);
    } else {
      setSelectedDealIds(filteredDeals.map(d => d.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedDealIds.includes(id)) {
      setSelectedDealIds(selectedDealIds.filter(item => item !== id));
    } else {
      setSelectedDealIds([...selectedDealIds, id]);
    }
  };

  // Open Reassign Modal
  const handleOpenTransferModal = (specificDealId?: string) => {
    if (specificDealId) {
      setSelectedDealIds([specificDealId]);
    }
    if (selectedDealIds.length === 0 && !specificDealId) return;
    
    // Auto select first member who is active and not the current owner if possible
    const available = teamMembers.find(m => m.status === 'active');
    if (available) setTargetMemberId(available.id);

    setIsModalOpen(true);
  };

  // Process Reassignment Logic
  const handleConfirmReassignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMemberId || selectedDealIds.length === 0) return;

    const targetUser = teamMembers.find(m => m.id === targetMemberId);
    if (!targetUser) return;

    const fullReason = `${transferReasonCategory}${customReasonNote ? ': ' + customReasonNote : ''}`;
    const nowStr = new Date().toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    // Track total value and deal titles for audit log
    const affectedDeals = deals.filter(d => selectedDealIds.includes(d.id));
    const totalVal = affectedDeals.reduce((sum, d) => sum + d.value, 0);
    const dealTitles = affectedDeals.map(d => d.title);
    const primaryFromUser = affectedDeals[0]?.ownerName || 'Nhiều người phụ trách';

    // Update Deals state
    const updatedDeals = deals.map(deal => {
      if (selectedDealIds.includes(deal.id)) {
        const newLog: ActivityLog = {
          id: `log-${Date.now()}-${Math.random()}`,
          date: nowStr,
          type: 'reassignment',
          performerName: currentUserRole === 'LEADER' ? 'Trưởng nhóm kinh doanh' : 'Chính chủ',
          description: `Đã bàn giao thương vụ từ ${deal.ownerName} sang ${targetUser.name}`,
          reason: fullReason,
          fromUser: deal.ownerName,
          toUser: targetUser.name
        };

        return {
          ...deal,
          ownerId: targetUser.id,
          ownerName: targetUser.name,
          ownerAvatar: targetUser.avatar,
          status: 'active' as const,
          historyLogs: [newLog, ...deal.historyLogs]
        };
      }
      return deal;
    });

    // Create Audit Log
    const newAuditLog: ReassignmentLog = {
      id: `LOG-${String(reassignmentLogs.length + 1).padStart(3, '0')}`,
      timestamp: nowStr,
      dealIds: selectedDealIds,
      dealTitles: dealTitles,
      fromUser: primaryFromUser,
      toUser: targetUser.name,
      reason: fullReason,
      transferredBy: currentUserRole === 'LEADER' ? 'Trưởng nhóm' : 'Nhân viên kinh doanh',
      totalValue: totalVal
    };

    setDeals(updatedDeals);
    setReassignmentLogs([newAuditLog, ...reassignmentLogs]);
    setIsModalOpen(false);
    setSelectedDealIds([]);
    setCustomReasonNote('');

    showNotification(`Đã phân bổ thành công ${selectedDealIds.length} cơ hội cho ${targetUser.name}!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Top Header & Role Switcher */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
                Hệ Thống Phân Bổ Cơ Hội Kinh Doanh
                <span className="text-xs bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">v2.5</span>
              </h1>
              <p className="text-xs text-slate-400">Tối ưu hiệu suất & Đảm bảo không bỏ sót thương vụ</p>
            </div>
          </div>

          {/* Role Switcher Bar */}
          <div className="flex items-center gap-3 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <span className="text-xs font-medium text-slate-400 pl-2 hidden sm:inline">Chế độ góc nhìn:</span>
            <button
              onClick={() => setCurrentUserRole('LEADER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentUserRole === 'LEADER' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Trưởng nhóm
            </button>
            <button
              onClick={() => setCurrentUserRole('REP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentUserRole === 'REP' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Nhân viên nhận
            </button>
            
            {currentUserRole === 'REP' && (
              <select
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(e.target.value)}
                className="bg-slate-900 text-slate-200 text-xs border border-slate-700 rounded-lg px-2 py-1 outline-none"
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </header>

      {/* Notification Banner */}
      {notification && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-sm text-center font-medium shadow-md flex items-center justify-center gap-2 transition-all">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* User Story Context Card */}
        <div className="bg-gradient-to-r from-indigo-900/90 to-slate-900 text-white p-5 rounded-2xl mb-6 shadow-lg border border-indigo-800/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-700/50">
                <Sparkles className="w-3 h-3" />
                Nghiệp vụ Quản lý nhóm Sales
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                {currentUserRole === 'LEADER' 
                  ? 'Là Trưởng nhóm kinh doanh, bạn có quyền chuyển giao cơ hội để giữ thương vụ liên tục.' 
                  : `Đang đăng nhập với vai trò: ${teamMembers.find(m => m.id === selectedRepId)?.name}`}
              </h2>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                Đảm bảo không thương vụ nào bị đứng yên khi nhân viên phụ trách nghỉ dài hạn hoặc quá tải. 
                Người nhận sẽ thấy ngay trong danh sách kèm đầy đủ nhật ký lịch sử chăm sóc.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 self-start md:self-auto">
              <div className="text-right">
                <div className="text-xs text-slate-400">Tổng cơ hội quản lý</div>
                <div className="text-lg font-bold text-indigo-400">{filteredDeals.length} Deal</div>
              </div>
              <div className="h-8 w-px bg-slate-700 mx-2" />
              <div className="text-right">
                <div className="text-xs text-slate-400">Giá trị thương vụ</div>
                <div className="text-lg font-bold text-emerald-400">
                  {formatVND(filteredDeals.reduce((acc, curr) => acc + curr.value, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('deals')}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 relative transition-all ${
              activeTab === 'deals' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Danh sách Cơ hội Kinh doanh
            <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">
              {filteredDeals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 relative transition-all ${
              activeTab === 'logs' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Nhật ký Chuyển giao (Audit Log)
            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {reassignmentLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 relative transition-all ${
              activeTab === 'team' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Trạng thái Đội ngũ
          </button>
        </div>

        {/* TAB 1: DANH SÁCH CƠ HỘI */}
        {activeTab === 'deals' && (
          <div className="space-y-4">
            
            {/* Action Bar & Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative min-w-[240px] flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên thương vụ, công ty, khách hàng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Filter Owner */}
                {currentUserRole === 'LEADER' && (
                  <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={filterOwner}
                      onChange={(e) => setFilterOwner(e.target.value)}
                      className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer"
                    >
                      <option value="all">Tất cả người phụ trách</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filter Stage */}
                <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả giai đoạn</option>
                    <option value="Mới tạo">Mới tạo</option>
                    <option value="Đã tiếp cận">Đã tiếp cận</option>
                    <option value="Đề xuất giải pháp">Đề xuất giải pháp</option>
                    <option value="Đàm phán">Đàm phán</option>
                  </select>
                </div>
              </div>

              {/* Bulk Action Trigger Button */}
              {selectedDealIds.length > 0 && (
                <div className="flex items-center gap-3 animate-fade-in bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                  <span className="text-xs text-indigo-900 font-semibold">
                    Đã chọn <span className="text-indigo-600 font-bold">{selectedDealIds.length}</span> cơ hội
                  </span>
                  <button
                    onClick={() => handleOpenTransferModal()}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Chuyển giao hàng loạt
                  </button>
                </div>
              )}
            </div>

            {/* Opportunities Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 w-10 text-center">
                        <button onClick={handleSelectAll} className="text-slate-400 hover:text-indigo-600">
                          {selectedDealIds.length > 0 && selectedDealIds.length === filteredDeals.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="p-3.5">Cơ hội / Công ty</th>
                      <th className="p-3.5">Giá trị thương vụ</th>
                      <th className="p-3.5">Giai đoạn</th>
                      <th className="p-3.5">Người phụ trách</th>
                      <th className="p-3.5">Cập nhật cuối</th>
                      <th className="p-3.5 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDeals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          Không tìm thấy cơ hội kinh doanh phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredDeals.map((deal) => {
                        const isSelected = selectedDealIds.includes(deal.id);
                        return (
                          <tr 
                            key={deal.id} 
                            className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}
                          >
                            <td className="p-3.5 text-center">
                              <button onClick={() => handleSelectOne(deal.id)} className="text-slate-400 hover:text-indigo-600">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            {/* Deal Title */}
                            <td className="p-3.5">
                              <div className="font-semibold text-slate-900 text-sm">{deal.title}</div>
                              <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {deal.company}
                                </span>
                                <span>•</span>
                                <span>{deal.customerName}</span>
                              </div>
                            </td>

                            {/* Value */}
                            <td className="p-3.5 font-bold text-slate-900">
                              {formatVND(deal.value)}
                            </td>

                            {/* Stage */}
                            <td className="p-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                deal.stage === 'Đàm phán' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                deal.stage === 'Đề xuất giải pháp' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                deal.stage === 'Đã tiếp cận' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {deal.stage}
                              </span>
                            </td>

                            {/* Owner */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={deal.ownerAvatar} 
                                  alt={deal.ownerName} 
                                  className="w-6 h-6 rounded-full object-cover border border-slate-200" 
                                />
                                <span className="font-medium text-slate-800">{deal.ownerName}</span>
                              </div>
                            </td>

                            {/* Last Activity */}
                            <td className="p-3.5 text-slate-500 text-[11px]">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {deal.lastActivity}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setSelectedDealForDetail(deal)}
                                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                                  title="Xem chi tiết & lịch sử"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleOpenTransferModal(deal.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                  Chuyển
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NHẬT KÝ CHUYỂN GIAO (AUDIT LOG) */}
        {activeTab === 'logs' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                Nhật ký Phân bổ & Chuyển giao Thương vụ (Audit Trails)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ghi nhận minh bạch lịch sử luân chuyển quyền sở hữu để theo dõi trách nhiệm công việc.
              </p>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {reassignmentLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Chưa có nhật ký chuyển giao nào được ghi nhận.
                </div>
              ) : (
                reassignmentLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {log.id}
                        </span>
                        <span className="text-xs text-slate-400">|</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.timestamp}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        Thực hiện bởi: <span className="text-slate-900 font-bold">{log.transferredBy}</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 mb-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <span>{log.fromUser}</span>
                        <ChevronRight className="w-4 h-4 text-indigo-500" />
                        <span className="text-indigo-600">{log.toUser}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        <strong>Lý do chuyển:</strong> <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium">{log.reason}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-1">
                        Danh sách cơ hội đã chuyển ({log.dealIds.length}):
                      </div>
                      <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5 pl-1">
                        {log.dealTitles.map((title, idx) => (
                          <li key={idx} className="font-medium">{title}</li>
                        ))}
                      </ul>
                      <div className="mt-2 text-xs text-slate-500">
                        Tổng giá trị thương vụ bàn giao: <strong className="text-slate-900">{formatVND(log.totalValue)}</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: QUẢN LÝ ĐỘI NGŨ */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100" 
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium text-slate-800">{member.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số deal đang giữ:</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {deals.filter(d => d.ownerId === member.id).length} Deal
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Trạng thái:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        member.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        member.status === 'on_leave' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.status === 'active' ? 'Sẵn sàng nhận' :
                         member.status === 'on_leave' ? 'Nghỉ phép dài' : 'Đang quá tải'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('deals');
                    setFilterOwner(member.id);
                  }}
                  className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors text-center"
                >
                  Xem thương vụ phụ trách
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ==================== MODAL: CHUYỂN GIAO CƠ HỘI ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Phân Bổ & Chuyển Giao Cơ Hội</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmReassignment} className="p-6 space-y-4">
              
              {/* Selected Deals Summary */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900">
                <span className="font-semibold block mb-1">Cơ hội được chọn ({selectedDealIds.length}):</span>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {deals
                    .filter(d => selectedDealIds.includes(d.id))
                    .map(d => (
                      <div key={d.id} className="flex justify-between text-[11px] font-medium bg-white/80 p-1.5 rounded">
                        <span className="truncate pr-2">• {d.title}</span>
                        <span className="font-bold text-indigo-700">{formatVND(d.value)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Target Member Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Chọn nhân viên tiếp nhận cơ hội <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="" disabled>-- Chọn nhân viên --</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.activeDealsCount} deal đang giữ - {m.status === 'active' ? 'Đang rảnh' : m.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Lý do chuyển giao (Bắt buộc ghi nhật ký) <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferReasonCategory}
                  onChange={(e) => setTransferReasonCategory(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Nghỉ phép dài hạn">Nghỉ phép dài hạn / Bệnh</option>
                  <option value="Quá tải công việc">Nhân viên hiện tại bị quá tải (Workload)</option>
                  <option value="Thay đổi địa bàn">Thay đổi địa bàn / Phân vùng khách hàng</option>
                  <option value="Yêu cầu từ khách hàng">Khách hàng yêu cầu thay đổi người tư vấn</option>
                  <option value="Khác">Lý do khác</option>
                </select>
              </div>

              {/* Custom Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. Ghi chú thêm cho người nhận
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập thông tin bàn giao chi tiết (ví dụ: Cần gọi lại cho anh Bảo trước 17h chiều nay)..."
                  value={customReasonNote}
                  onChange={(e) => setCustomReasonNote(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận chuyển giao
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CHI TIẾT & LỊCH SỬ CƠ HỘI ==================== */}
      {selectedDealForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-indigo-400 font-bold">{selectedDealForDetail.id}</span>
                <h3 className="font-bold text-base">{selectedDealForDetail.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedDealForDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Khách hàng:</span>
                  <span className="font-bold text-slate-800">{selectedDealForDetail.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Công ty:</span>
                  <span className="font-bold text-slate-800">{selectedDealForDetail.company}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Giá trị:</span>
                  <span className="font-bold text-emerald-600">{formatVND(selectedDealForDetail.value)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Người phụ trách hiện tại:</span>
                  <span className="font-bold text-indigo-600">{selectedDealForDetail.ownerName}</span>
                </div>
              </div>

              {/* Historical Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-600" />
                  Toàn bộ lịch sử chăm sóc & Chuyển giao:
                </h4>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedDealForDetail.historyLogs.map((log) => (
                    <div key={log.id} className="relative text-xs">
                      <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                      <div className="font-semibold text-slate-800 flex items-center justify-between">
                        <span>{log.performerName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{log.date}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{log.description}</p>
                      {log.reason && (
                        <div className="mt-1 bg-amber-50 text-amber-900 border border-amber-200 p-2 rounded text-[11px]">
                          <strong>Lý do chuyển:</strong> {log.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedDealForDetail(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}