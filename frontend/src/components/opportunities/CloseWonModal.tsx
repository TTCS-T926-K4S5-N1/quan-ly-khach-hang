import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Opportunity, WinLossReason, CloseWonPayload } from '../../types/opportunity';
import { closeWonSchema, CloseWonFormValues, formatCurrencyVND } from '../../utils/validation';
import { opportunityService } from '../../services/opportunityService';
import { Trophy, Calendar, DollarSign, FileText, X, AlertCircle, Loader2 } from 'lucide-react';

interface CloseWonModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: CloseWonPayload) => Promise<boolean>;
}

export const CloseWonModal: React.FC<CloseWonModalProps> = ({
  opportunity,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [winReasons, setWinReasons] = useState<WinLossReason[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CloseWonFormValues>({
    resolver: zodResolver(closeWonSchema),
    defaultValues: {
      actualAmount: opportunity.amount || 0,
      contractDate: todayStr,
      winReasonId: 1,
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        actualAmount: opportunity.amount || 0,
        contractDate: todayStr,
        winReasonId: 1,
        notes: '',
      });
      setGeneralError(null);
      // Load win reasons
      opportunityService.getWinReasons().then(setWinReasons).catch(console.error);
    }
  }, [isOpen, opportunity, reset, todayStr]);

  if (!isOpen) return null;

  const handleFormSubmit = async (values: CloseWonFormValues) => {
    setSubmitting(true);
    setGeneralError(null);
    try {
      await onSubmit(opportunity.id, {
        actualAmount: values.actualAmount,
        contractDate: values.contractDate,
        winReasonId: values.winReasonId,
        notes: values.notes,
      });
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Không thể đóng thắng cơ hội. Vui lòng kiểm tra lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 modal-backdrop-blur">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-won-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Trophy className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 id="modal-won-title" className="text-lg font-bold">
                Đóng Thắng Cơ Hội Kinh Doanh
              </h2>
              <p className="text-xs text-emerald-100">
                Ghi nhận doanh số thành công và hợp đồng ký kết
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
        <div className="mx-6 mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Tên cơ hội:</span>
              <span className="font-semibold text-slate-800 line-clamp-1">
                {opportunity.name}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Khách hàng:</span>
              <span className="font-semibold text-slate-800 line-clamp-1">
                {opportunity.customerName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Người sở hữu:</span>
              <span className="font-medium text-slate-700">{opportunity.ownerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Giá trị dự kiến:</span>
              <span className="font-bold text-sky-700">
                {formatCurrencyVND(opportunity.amount)}
              </span>
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

          {/* Giá trị chốt thực tế (Bắt buộc) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Giá trị chốt thực tế (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <DollarSign size={16} />
              </div>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="Ví dụ: 850000000"
                {...register('actualAmount')}
                className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.actualAmount
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                }`}
              />
            </div>
            {errors.actualAmount && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle size={12} />
                {errors.actualAmount.message}
              </p>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              Số tiền thực tế trên hợp đồng ký với khách hàng.
            </p>
          </div>

          {/* Ngày ký hợp đồng (Bắt buộc) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ngày ký hợp đồng <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar size={16} />
              </div>
              <input
                type="date"
                {...register('contractDate')}
                className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.contractDate
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                }`}
              />
            </div>
            {errors.contractDate && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle size={12} />
                {errors.contractDate.message}
              </p>
            )}
          </div>

          {/* Lý do Thắng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lý do thắng thầu / Điểm mấu chốt
            </label>
            <select
              {...register('winReasonId')}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
            >
              {winReasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ghi chú bổ sung (Không bắt buộc) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ghi chú bổ sung (Tùy chọn)
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 text-slate-400 pointer-events-none">
                <FileText size={16} />
              </div>
              <textarea
                rows={3}
                placeholder="Nhập ghi chú thêm về hợp đồng, điều khoản thanh toán hoặc kinh nghiệm chốt deal..."
                {...register('notes')}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>
            {errors.notes && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.notes.message}</p>
            )}
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
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Trophy size={16} />
                  <span>Xác nhận thắng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
