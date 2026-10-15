import React from 'react';
import { Opportunity, UserContext, OpportunityHistoryItem } from '../../types/opportunity';
import { OpportunityStatusBadge } from './OpportunityStatusBadge';
import { OpportunityHistory } from './OpportunityHistory';
import { formatCurrencyVND, formatDateVN, formatDateTimeVN } from '../../utils/validation';
import {
  Trophy,
  XCircle,
  RotateCcw,
  Lock,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface OpportunityDetailProps {
  opportunity: Opportunity;
  history: OpportunityHistoryItem[];
  currentUser: UserContext;
  onOpenCloseWon: (opp: Opportunity) => void;
  onOpenCloseLost: (opp: Opportunity) => void;
  onOpenReopen: (opp: Opportunity) => void;
  historyLoading?: boolean;
}

export const OpportunityDetail: React.FC<OpportunityDetailProps> = ({
  opportunity,
  history,
  currentUser,
  onOpenCloseWon,
  onOpenCloseLost,
  onOpenReopen,
  historyLoading = false,
}) => {
  const isClosed = opportunity.status === 'WON' || opportunity.status === 'LOST';
  const isWon = opportunity.status === 'WON';
  const isLost = opportunity.status === 'LOST';

  // Permission check: Team Lead, Manager, Admin can reopen
  const canReopen =
    currentUser.role === 'TEAM_LEAD' ||
    currentUser.role === 'MANAGER' ||
    currentUser.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* 3.4. Cảnh báo khóa khi cơ hội đã đóng */}
      {isClosed && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl shadow-sm text-amber-900 animate-modal">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
              <Lock size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Cơ hội đã đóng ({isWon ? 'Thắng' : 'Thua'}) — Khóa chỉnh sửa
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Cơ hội đã đóng, không thể chỉnh sửa. Vui lòng liên hệ Trưởng nhóm nếu cần mở lại.
              </p>
            </div>
          </div>

          {/* Chỉ hiển thị nút "Mở lại cơ hội" cho Trưởng nhóm trở lên */}
          {canReopen && (
            <button
              type="button"
              onClick={() => onOpenReopen(opportunity)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 active:bg-amber-400 rounded-xl shadow-sm transition-all shrink-0"
            >
              <RotateCcw size={14} />
              <span>Mở lại cơ hội</span>
            </button>
          )}
        </div>
      )}

      {/* Main Opportunity Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {opportunity.code}
              </span>
              <OpportunityStatusBadge status={opportunity.status} size="md" />
              {opportunity.reopenedAt && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  Từng được mở lại
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {opportunity.name}
            </h1>
          </div>

          {/* Action Buttons: Only show when OPEN */}
          {!isClosed ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenCloseWon(opportunity)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Trophy size={16} />
                <span>Đóng Thắng</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenCloseLost(opportunity)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all active:scale-95"
              >
                <XCircle size={16} />
                <span>Đóng Thua</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <Lock size={13} />
              <span>Các nút chỉnh sửa & đóng đã bị khóa</span>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Expected Amount */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <DollarSign size={14} className="text-sky-600" />
              <span>Giá trị dự kiến</span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {formatCurrencyVND(opportunity.amount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Xác suất thành công: {opportunity.probability}%
            </div>
          </div>

          {/* Pipeline Stage */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Layers size={14} className="text-indigo-600" />
              <span>Giai đoạn bán hàng</span>
            </div>
            <div className="text-base font-semibold text-slate-800">
              {opportunity.stageName}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full ${
                  isWon ? 'bg-emerald-500' : isLost ? 'bg-rose-500' : 'bg-sky-500'
                }`}
                style={{ width: `${Math.max(5, opportunity.probability)}%` }}
              />
            </div>
          </div>

          {/* Expected Close Date */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Calendar size={14} className="text-amber-600" />
              <span>Ngày dự kiến chốt</span>
            </div>
            <div className="text-base font-semibold text-slate-800">
              {formatDateVN(opportunity.expectedCloseDate)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Khởi tạo: {formatDateVN(opportunity.createdAt)}
            </div>
          </div>

          {/* Owner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <User size={14} className="text-teal-600" />
              <span>Người sở hữu</span>
            </div>
            <div className="text-base font-semibold text-slate-800">
              {opportunity.ownerName}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Nhân viên phụ trách trực tiếp
            </div>
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="p-5 rounded-xl bg-sky-50/50 border border-sky-100">
          <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 size={15} className="text-sky-700" />
            <span>Thông tin Khách hàng & Người liên hệ</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Tên khách hàng / Doanh nghiệp:</span>
              <strong className="text-slate-800 text-sm">{opportunity.customerName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Người liên hệ chính:</span>
              <span className="font-semibold text-slate-700">
                {opportunity.contactName || 'Chưa cập nhật'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Kênh liên hệ:</span>
              <div className="flex items-center gap-3 text-slate-600">
                {opportunity.contactPhone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    {opportunity.contactPhone}
                  </span>
                )}
                {opportunity.contactEmail && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-slate-400" />
                    {opportunity.contactEmail}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Thẻ hiển thị kết quả Đóng Thắng (nếu có) */}
        {isWon && (
          <div className="p-5 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-sm animate-modal">
            <div className="flex items-center gap-2.5 mb-3 text-emerald-900">
              <Trophy className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold">Thông tin Chốt Thắng Cơ Hội</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-emerald-700 block mb-0.5">Giá trị chốt thực tế:</span>
                <strong className="text-emerald-950 text-base font-bold">
                  {formatCurrencyVND(opportunity.actualAmount)}
                </strong>
              </div>
              <div>
                <span className="text-emerald-700 block mb-0.5">Ngày ký hợp đồng:</span>
                <strong className="text-emerald-900 text-sm">
                  {formatDateVN(opportunity.contractDate)}
                </strong>
              </div>
              <div>
                <span className="text-emerald-700 block mb-0.5">Lý do thắng thầu:</span>
                <span className="font-medium text-emerald-900">
                  {opportunity.winReasonName || 'Giải pháp kỹ thuật tối ưu'}
                </span>
              </div>
              {opportunity.winNotes && (
                <div className="sm:col-span-3 pt-2 border-t border-emerald-200/70 text-emerald-800">
                  <span className="font-semibold text-emerald-900 block mb-0.5">Ghi chú bổ sung:</span>
                  <p className="italic">"{opportunity.winNotes}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Thẻ hiển thị kết quả Đóng Thua (nếu có) */}
        {isLost && (
          <div className="p-5 rounded-xl bg-rose-50/80 border border-rose-200 shadow-sm animate-modal">
            <div className="flex items-center gap-2.5 mb-3 text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold">Thông tin Đóng Thua Cơ Hội</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-rose-700 block mb-0.5">Lý do thua:</span>
                <strong className="text-rose-950 text-sm font-bold">
                  {opportunity.lossReasonName || 'Chưa ghi nhận'}
                </strong>
                {opportunity.otherReasonDetails && (
                  <p className="mt-1 text-rose-800 italic">"{opportunity.otherReasonDetails}"</p>
                )}
              </div>
              <div>
                <span className="text-rose-700 block mb-0.5">Đối thủ thắng thầu:</span>
                <span className="font-semibold text-rose-900">
                  {opportunity.competitorName || 'Không có đối thủ / Không xác định'}
                </span>
              </div>
              <div>
                <span className="text-rose-700 block mb-0.5">Ghi chú nguyên nhân:</span>
                <span className="text-rose-900">
                  {opportunity.lostReason || opportunity.lossNotes || 'Không có ghi chú thêm'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Thông tin Mở lại cơ hội (nếu có) */}
        {opportunity.reopenReason && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-amber-800">
              <RotateCcw size={14} />
              <span>Ghi chú Mở Lại Cơ Hội:</span>
            </div>
            <p className="italic">"{opportunity.reopenReason}"</p>
            {opportunity.reopenedBy && (
              <p className="text-[11px] text-amber-700 mt-1">
                Người mở lại: {opportunity.reopenedBy} vào lúc {formatDateTimeVN(opportunity.reopenedAt)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 5. Lịch sử thay đổi trạng thái (Timeline) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-sky-600" />
              <span>Lịch Sử Hoạt Động & Thay Đổi Trạng Thái (Timeline)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi chi tiết các mốc chốt thắng, chốt thua, mở lại và cập nhật hệ thống
            </p>
          </div>
        </div>

        <OpportunityHistory history={history} loading={historyLoading} />
      </div>
    </div>
  );
};
