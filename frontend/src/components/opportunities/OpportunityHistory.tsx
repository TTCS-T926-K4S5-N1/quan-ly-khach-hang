import React from 'react';
import { OpportunityHistoryItem } from '../../types/opportunity';
import { formatCurrencyVND, formatDateTimeVN, formatDateVN } from '../../utils/validation';
import {
  Trophy,
  XCircle,
  RotateCcw,
  PlusCircle,
  GitCommit,
  User,
  Calendar,
  Building,
  FileText,
  Clock,
} from 'lucide-react';

interface OpportunityHistoryProps {
  history: OpportunityHistoryItem[];
  loading?: boolean;
}

export const OpportunityHistory: React.FC<OpportunityHistoryProps> = ({
  history,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400" />
        <p className="text-sm">Đang tải lịch sử hoạt động...</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">Chưa có bản ghi lịch sử hoạt động nào.</p>
      </div>
    );
  }

  const getActionBadge = (action: OpportunityHistoryItem['action']) => {
    switch (action) {
      case 'CLOSE_WON':
        return {
          icon: <Trophy size={16} className="text-white" />,
          bg: 'bg-emerald-500',
          ring: 'ring-emerald-100',
          badgeText: 'Thắng thầu',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'CLOSE_LOST':
        return {
          icon: <XCircle size={16} className="text-white" />,
          bg: 'bg-rose-500',
          ring: 'ring-rose-100',
          badgeText: 'Thua thầu',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'REOPEN':
        return {
          icon: <RotateCcw size={16} className="text-white" />,
          bg: 'bg-amber-500',
          ring: 'ring-amber-100',
          badgeText: 'Mở lại cơ hội',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'CREATE':
        return {
          icon: <PlusCircle size={16} className="text-white" />,
          bg: 'bg-sky-500',
          ring: 'ring-sky-100',
          badgeText: 'Khởi tạo',
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      default:
        return {
          icon: <GitCommit size={16} className="text-white" />,
          bg: 'bg-slate-500',
          ring: 'ring-slate-100',
          badgeText: 'Cập nhật',
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((item, idx) => {
        const style = getActionBadge(item.action);

        return (
          <div key={item.id || idx} className="relative group">
            {/* Timeline Dot with Icon */}
            <div
              className={`absolute -left-6 top-0 flex items-center justify-center w-6 h-6 rounded-full ${style.bg} ring-4 ${style.ring} shadow-sm z-10 transition-transform group-hover:scale-110`}
            >
              {style.icon}
            </div>

            {/* Event Content Card */}
            <div className="ml-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${style.badgeClass}`}
                  >
                    {item.actionNameVi || style.badgeText}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {item.description}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={13} className="text-slate-400" />
                  <span>{formatDateTimeVN(item.performedAt)}</span>
                </div>
              </div>

              {/* Performed By Info */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                <User size={13} className="text-slate-400" />
                <span>Thực hiện bởi:</span>
                <strong className="text-slate-700">{item.performedBy}</strong>
                {item.performedRole && (
                  <span className="text-[11px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                    {item.performedRole}
                  </span>
                )}
              </div>

              {/* Won Details */}
              {item.action === 'CLOSE_WON' && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {item.actualAmount !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-700 font-medium">Giá trị chốt thực tế:</span>
                      <strong className="text-emerald-900 font-bold">
                        {formatCurrencyVND(item.actualAmount)}
                      </strong>
                    </div>
                  )}
                  {item.contractDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Ngày ký hợp đồng:</span>
                      <strong className="text-emerald-900">{formatDateVN(item.contractDate)}</strong>
                    </div>
                  )}
                  {item.winReason && (
                    <div className="sm:col-span-2 flex items-center gap-1.5">
                      <span className="text-emerald-700 font-medium">Lý do thắng:</span>
                      <span className="text-emerald-900 font-medium">{item.winReason}</span>
                    </div>
                  )}
                  {item.notes && (
                    <div className="sm:col-span-2 flex items-start gap-1.5 text-emerald-800 italic pt-1 border-t border-emerald-100/80">
                      <FileText size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>"{item.notes}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* Lost Details */}
              {item.action === 'CLOSE_LOST' && (
                <div className="mt-3 p-3 rounded-lg bg-rose-50/70 border border-rose-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {item.lossReason && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-rose-700 font-medium">Lý do thua:</span>
                      <strong className="text-rose-900 font-bold">{item.lossReason}</strong>
                    </div>
                  )}
                  {item.competitor && (
                    <div className="flex items-center gap-1.5">
                      <Building size={13} className="text-rose-600" />
                      <span className="text-rose-700 font-medium">Đối thủ thắng thầu:</span>
                      <strong className="text-rose-900">{item.competitor}</strong>
                    </div>
                  )}
                  {item.notes && (
                    <div className="sm:col-span-2 flex items-start gap-1.5 text-rose-800 italic pt-1 border-t border-rose-100/80">
                      <FileText size={13} className="text-rose-600 shrink-0 mt-0.5" />
                      <span>"{item.notes}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* Reopen Details */}
              {item.action === 'REOPEN' && item.reason && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-amber-800 shrink-0">Lý do mở lại:</span>
                    <span className="font-medium italic">"{item.reason}"</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
