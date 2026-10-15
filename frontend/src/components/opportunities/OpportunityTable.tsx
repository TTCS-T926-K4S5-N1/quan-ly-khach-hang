import React from 'react';
import { Opportunity, UserContext } from '../../types/opportunity';
import { OpportunityStatusBadge } from './OpportunityStatusBadge';
import { formatCurrencyVND, formatDateVN } from '../../utils/validation';
import {
  Trophy,
  XCircle,
  RotateCcw,
  Eye,
  Lock,
  Calendar,
  User,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OpportunityTableProps {
  opportunities: Opportunity[];
  currentUser: UserContext;
  onOpenCloseWon: (opp: Opportunity) => void;
  onOpenCloseLost: (opp: Opportunity) => void;
  onOpenReopen: (opp: Opportunity) => void;
  loading?: boolean;
}

export const OpportunityTable: React.FC<OpportunityTableProps> = ({
  opportunities,
  currentUser,
  onOpenCloseWon,
  onOpenCloseLost,
  onOpenReopen,
  loading = false,
}) => {
  const navigate = useNavigate();

  // Permission check: Team Lead, Manager, Admin can reopen
  const canReopen =
    currentUser.role === 'TEAM_LEAD' ||
    currentUser.role === 'MANAGER' ||
    currentUser.role === 'ADMIN';

  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-r-transparent"></div>
        <p className="mt-3 text-sm text-slate-500 font-medium">Đang tải danh sách cơ hội kinh doanh...</p>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-12 h-12 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
          <TrendingUp size={24} />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Không tìm thấy cơ hội kinh doanh nào</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc trạng thái và người sở hữu.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4">Mã & Tên cơ hội</th>
              <th className="py-3.5 px-4">Khách hàng</th>
              <th className="py-3.5 px-4">Người sở hữu</th>
              <th className="py-3.5 px-4 text-right">Giá trị dự kiến</th>
              <th className="py-3.5 px-4">Giai đoạn</th>
              <th className="py-3.5 px-4">Ngày chốt</th>
              <th className="py-3.5 px-4 text-center">Trạng thái</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {opportunities.map((opp) => {
              const isOpen = opp.status === 'OPEN';
              const isClosed = opp.status === 'WON' || opp.status === 'LOST';

              return (
                <tr
                  key={opp.id}
                  className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/opportunities/${opp.id}`)}
                >
                  {/* Mã & Tên cơ hội */}
                  <td className="py-3.5 px-4 max-w-[240px]">
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] font-semibold text-sky-700">
                        {opp.code}
                      </span>
                      <span className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1 text-sm">
                        {opp.name}
                      </span>
                    </div>
                  </td>

                  {/* Khách hàng */}
                  <td className="py-3.5 px-4 max-w-[180px]">
                    <span className="font-medium text-slate-800 line-clamp-1">
                      {opp.customerName}
                    </span>
                    {opp.contactName && (
                      <span className="text-[11px] text-slate-400 block line-clamp-1">
                        LH: {opp.contactName}
                      </span>
                    )}
                  </td>

                  {/* Người sở hữu */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <User size={13} className="text-slate-400" />
                      <span className="font-medium text-slate-800">{opp.ownerName}</span>
                    </div>
                  </td>

                  {/* Giá trị dự kiến */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="font-bold text-slate-900 text-sm">
                      {formatCurrencyVND(opp.amount)}
                    </span>
                    {opp.actualAmount && opp.status === 'WON' && (
                      <span className="text-[11px] text-emerald-600 font-semibold block">
                        Chốt: {formatCurrencyVND(opp.actualAmount)}
                      </span>
                    )}
                  </td>

                  {/* Giai đoạn */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">{opp.stageName}</span>
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            opp.status === 'WON'
                              ? 'bg-emerald-500'
                              : opp.status === 'LOST'
                              ? 'bg-rose-400'
                              : 'bg-sky-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, opp.probability))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Ngày dự kiến chốt */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Calendar size={12} className="text-slate-400" />
                      <span>{formatDateVN(opp.expectedCloseDate)}</span>
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <OpportunityStatusBadge status={opp.status} size="sm" />
                  </td>

                  {/* Thao tác (Actions) */}
                  <td
                    className="py-3.5 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()} // Do not trigger row click
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Nút Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => navigate(`/opportunities/${opp.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Xem chi tiết cơ hội"
                      >
                        <Eye size={13} />
                        <span className="hidden sm:inline">Chi tiết</span>
                      </button>

                      {/* Khi Đang mở: Hiển thị nút Đóng Thắng & Đóng Thua */}
                      {isOpen && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenCloseWon(opp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
                            title="Đóng Thắng cơ hội kinh doanh"
                          >
                            <Trophy size={13} />
                            <span>Đóng Thắng</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenCloseLost(opp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/20 transition-all active:scale-95"
                            title="Đóng Thua cơ hội kinh doanh"
                          >
                            <XCircle size={13} />
                            <span>Đóng Thua</span>
                          </button>
                        </>
                      )}

                      {/* Khi Đã đóng (Thắng hoặc Thua): Khóa chỉnh sửa */}
                      {isClosed && (
                        <div className="inline-flex items-center gap-1.5">
                          {canReopen ? (
                            <button
                              type="button"
                              onClick={() => onOpenReopen(opp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                              title="Mở lại cơ hội kinh doanh (Quyền Quản lý / Trưởng nhóm)"
                            >
                              <RotateCcw size={13} />
                              <span>Mở lại</span>
                            </button>
                          ) : (
                            <div
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"
                              title="Cơ hội đã đóng, không thể chỉnh sửa. Vui lòng liên hệ Trưởng nhóm nếu cần mở lại."
                            >
                              <Lock size={12} className="text-slate-400" />
                              <span>Đã khóa</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
