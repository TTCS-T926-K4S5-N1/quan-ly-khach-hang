import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Opportunity, ReopenPayload } from '../../types/opportunity';
import { reopenSchema, ReopenFormValues } from '../../utils/validation';
import { OpportunityStatusBadge } from './OpportunityStatusBadge';
import { RotateCcw, AlertTriangle, X, AlertCircle, Loader2 } from 'lucide-react';

interface ReopenOpportunityModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: ReopenPayload) => Promise<boolean>;
}

export const ReopenOpportunityModal: React.FC<ReopenOpportunityModalProps> = ({
  opportunity,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReopenFormValues>({
    resolver: zodResolver(reopenSchema),
    defaultValues: {
      reason: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ reason: '' });
      setGeneralError(null);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (values: ReopenFormValues) => {
    setSubmitting(true);
    setGeneralError(null);
    try {
      await onSubmit(opportunity.id, {
        reason: values.reason,
      });
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Không thể mở lại cơ hội kinh doanh. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 modal-backdrop-blur">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-reopen-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 id="modal-reopen-title" className="text-lg font-bold">
                Mở Lại Cơ Hội Kinh Doanh
              </h2>
              <p className="text-xs text-amber-100">
                Thao tác quản lý chỉ dành cho Trưởng nhóm trở lên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Opportunity Summary Read-Only Card */}
        <div className="mx-6 mt-5 p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tên cơ hội:</span>
              <span className="font-semibold text-slate-800 text-right max-w-[280px] truncate">
                {opportunity.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="font-medium text-slate-700">{opportunity.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Trạng thái hiện tại:</span>
              <OpportunityStatusBadge status={opportunity.status} size="sm" />
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {generalError && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <div className="flex items-start gap-2.5 p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 text-xs">
            <AlertTriangle size={16} className="text-sky-600 shrink-0 mt-0.5" />
            <span>
              Khi mở lại, cơ hội sẽ chuyển về trạng thái <strong>Đang mở</strong> và cho phép nhân viên tiếp tục cập nhật thông tin và theo đuổi đàm phán.
            </span>
          </div>

          {/* Lý do mở lại (Bắt buộc) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lý do mở lại cơ hội <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Vui lòng nêu rõ lý do tại sao cơ hội được mở lại (Ví dụ: Khách hàng yêu cầu tái khởi động đàm phán, đối thủ cũ rút lui...)"
              {...register('reason')}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.reason
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-amber-500/20 focus:border-amber-500'
              }`}
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle size={12} />
                {errors.reason.message}
              </p>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              Lý do mở lại sẽ được ghi vào lịch sử hoạt động để phục vụ kiểm toán và báo cáo.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl shadow-md shadow-amber-500/20 transition-all disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang mở lại...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  <span>Xác nhận mở lại</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
