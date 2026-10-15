import React from 'react';
import { useOpportunities, AVAILABLE_ROLES } from '../hooks/useOpportunities';
import { OpportunityTable } from '../components/opportunities/OpportunityTable';
import { CloseWonModal } from '../components/opportunities/CloseWonModal';
import { CloseLostModal } from '../components/opportunities/CloseLostModal';
import { ReopenOpportunityModal } from '../components/opportunities/ReopenOpportunityModal';
import { formatCurrencyVND } from '../utils/validation';
import {
  Search,
  Filter,
  UserCheck,
  Trophy,
  Target,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const OpportunitiesPage: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    opportunities,
    total,
    totalPages,
    loading,
    error,
    filterParams,
    quota,
    toast,
    setToast,
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
  } = useOpportunities();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border animate-modal text-sm ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-slate-800 text-white border-slate-700'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 size={18} className="shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={18} className="shrink-0" />}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header and User Role Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
              CRM Point 76
            </span>
            <span className="text-xs text-slate-500">Hệ thống Quản lý Khách hàng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý & Đóng Cơ Hội Kinh Doanh
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quy trình chốt hợp đồng Thắng / Thua, kiểm soát phân quyền và khóa cơ hội
          </p>
        </div>

        {/* 4. Giả lập / Chuyển đổi vai trò người dùng (Role Switcher) */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Vai trò thử nghiệm (RBAC):</div>
            <select
              value={currentUser.role}
              onChange={(e) => {
                const found = AVAILABLE_ROLES.find((r) => r.role === e.target.value);
                if (found) setCurrentUser(found);
              }}
              className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.fullName} ({r.roleNameVi})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Sales Quota Card (Backend calculated) */}
      {quota && (
        <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <Target size={14} />
              <span>Chỉ tiêu doanh số cá nhân — {quota.period}</span>
            </div>
            <h3 className="text-lg font-bold">
              Người sở hữu: {quota.userName}
            </h3>
            <p className="text-xs text-slate-300">
              * Dữ liệu chỉ tiêu được backend đồng bộ tự động mỗi khi đóng cơ hội Thắng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Mục tiêu:</span>
              <span className="font-bold text-base text-slate-200">
                {formatCurrencyVND(quota.targetAmount)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Đã đạt được:</span>
              <span className="font-bold text-base text-emerald-400">
                {formatCurrencyVND(quota.achievedAmount)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Tỷ lệ hoàn thành:</span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-yellow-400">
                  {quota.achievedPercentage}%
                </span>
                <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-slate-300">
                  {quota.wonCount} deal Thắng
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên cơ hội..."
            value={filterParams.keyword || ''}
            onChange={(e) => handleKeywordChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Filter size={14} className="text-slate-400" />
            <span>Trạng thái:</span>
            <select
              value={filterParams.status || 'ALL'}
              onChange={(e) =>
                handleStatusChange(e.target.value as 'ALL' | 'OPEN' | 'WON' | 'LOST')
              }
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="OPEN">Đang mở (OPEN)</option>
              <option value="WON">Thắng (WON)</option>
              <option value="LOST">Thua (LOST)</option>
            </select>
          </div>

          {/* Owner Filter */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <UserCheck size={14} className="text-slate-400" />
            <span>Người sở hữu:</span>
            <select
              value={filterParams.ownerId || 'ALL'}
              onChange={(e) =>
                handleOwnerChange(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 cursor-pointer"
            >
              <option value="ALL">Tất cả nhân viên</option>
              <option value="1">Nguyễn Văn Hiếu</option>
              <option value="2">Lê Thu Trang</option>
              <option value="3">Trần Văn Nam</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchOpportunities}
            title="Làm mới danh sách"
            className="p-2 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <OpportunityTable
        opportunities={opportunities}
        currentUser={currentUser}
        onOpenCloseWon={setSelectedOppForWon}
        onOpenCloseLost={setSelectedOppForLost}
        onOpenReopen={setSelectedOppForReopen}
        loading={loading}
      />

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="text-xs text-slate-500">
          Hiển thị{' '}
          <strong className="text-slate-700 font-semibold">{opportunities.length}</strong> trong tổng số{' '}
          <strong className="text-slate-700 font-semibold">{total}</strong> cơ hội kinh doanh
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={filterParams.page === 1 || loading}
            onClick={() => handlePageChange((filterParams.page || 1) - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
            <span>Trang trước</span>
          </button>

          <span className="text-xs font-semibold text-slate-700 px-3 py-1.5 bg-slate-100 rounded-xl">
            {filterParams.page} / {totalPages || 1}
          </span>

          <button
            type="button"
            disabled={filterParams.page === totalPages || totalPages === 0 || loading}
            onClick={() => handlePageChange((filterParams.page || 1) + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>Trang sau</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Modals */}
      {selectedOppForWon && (
        <CloseWonModal
          opportunity={selectedOppForWon}
          isOpen={Boolean(selectedOppForWon)}
          onClose={() => setSelectedOppForWon(null)}
          onSubmit={submitCloseWon}
        />
      )}

      {selectedOppForLost && (
        <CloseLostModal
          opportunity={selectedOppForLost}
          isOpen={Boolean(selectedOppForLost)}
          onClose={() => setSelectedOppForLost(null)}
          onSubmit={submitCloseLost}
        />
      )}

      {selectedOppForReopen && (
        <ReopenOpportunityModal
          opportunity={selectedOppForReopen}
          isOpen={Boolean(selectedOppForReopen)}
          onClose={() => setSelectedOppForReopen(null)}
          onSubmit={submitReopen}
        />
      )}
    </div>
  );
};
