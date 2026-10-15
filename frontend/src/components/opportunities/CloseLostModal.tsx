import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Opportunity, Competitor, CloseLostPayload } from '../../types/opportunity';
import {
  closeLostSchema,
  CloseLostFormValues,
  SUGGESTED_LOSS_REASONS,
  formatCurrencyVND,
} from '../../utils/validation';
import { opportunityService } from '../../services/opportunityService';
import { XCircle, ShieldAlert, FileText, X, AlertCircle, Loader2, Building2 } from 'lucide-react';

interface CloseLostModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: CloseLostPayload) => Promise<boolean>;
}

export const CloseLostModal: React.FC<CloseLostModalProps> = ({
  opportunity,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CloseLostFormValues>({
    resolver: zodResolver(closeLostSchema),
    defaultValues: {
      lossReasonName: SUGGESTED_LOSS_REASONS[0],
      otherReasonDetails: '',
      competitorName: '',
      notes: '',
    },
  });

  const selectedReason = useWatch({
    control,
    name: 'lossReasonName',
  });

  const isOtherReason = selectedReason === 'Lý do khác';

  useEffect(() => {
    if (isOpen) {
      reset({
        lossReasonName: SUGGESTED_LOSS_REASONS[0],
        otherReasonDetails: '',
        competitorName: '',
        notes: '',
      });
      setGeneralError(null);
      opportunityService.getCompetitors().then(setCompetitors).catch(console.error);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (values: CloseLostFormValues) => {
    setSubmitting(true);
    setGeneralError(null);
    try {
      await onSubmit(opportunity.id, {
        lossReasonName: values.lossReasonName,
        otherReasonDetails: values.otherReasonDetails,
        competitorName: values.competitorName,
        notes: values.notes,
      });
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Không thể đóng thua cơ hội. Vui lòng kiểm tra lại.');
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
        aria-labelledby="modal-lost-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 id="modal-lost-title" className="text-lg font-bold">
                Đóng Thua Cơ Hội Kinh Doanh
              </h2>
              <p className="text-xs text-rose-100">
                Ghi nhận nguyên nhân thất bại và đối thủ cạnh tranh để phân tích dữ liệu
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
              <span className="font-bold text-slate-700">
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

          {/* Lý do thua (Bắt buộc) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lý do thua thầu / thất bại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldAlert size={16} />
              </div>
              <select
                {...register('lossReasonName')}
                className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all text-slate-800 ${
                  errors.lossReasonName
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-rose-500/20 focus:border-rose-600'
                }`}
              >
                {SUGGESTED_LOSS_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
            {errors.lossReasonName && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle size={12} />
                {errors.lossReasonName.message}
              </p>
            )}
          </div>

          {/* Nếu chọn "Lý do khác", hiển thị thêm trường nhập chi tiết (Bắt buộc khi chọn) */}
          {isOtherReason && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 animate-modal">
              <label className="block text-xs font-semibold text-amber-900">
                Chi tiết lý do khác <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Vui lòng nêu rõ lý do thất bại cụ thể..."
                {...register('otherReasonDetails')}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.otherReasonDetails
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-amber-300 focus:ring-amber-500/20 focus:border-amber-600'
                }`}
              />
              {errors.otherReasonDetails && (
                <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} />
                  {errors.otherReasonDetails.message}
                </p>
              )}
            </div>
          )}

          {/* Đối thủ thắng thầu (Không bắt buộc) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Đối thủ thắng thầu (Tùy chọn)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building2 size={16} />
              </div>
              <input
                type="text"
                list="competitor-list"
                placeholder="Nhập hoặc chọn đối thủ thắng thầu..."
                {...register('competitorName')}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all text-slate-800"
              />
              <datalist id="competitor-list">
                {competitors.map((comp) => (
                  <option key={comp.id} value={comp.name} />
                ))}
              </datalist>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Bạn có thể chọn từ danh sách đối thủ đã lưu hoặc nhập tên đối thủ mới.
            </p>
          </div>

          {/* Ghi chú nguyên nhân thua (Không bắt buộc) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ghi chú nguyên nhân thua (Tùy chọn)
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 text-slate-400 pointer-events-none">
                <FileText size={16} />
              </div>
              <textarea
                rows={3}
                placeholder="Bài học kinh nghiệm, phản hồi chi tiết từ khách hàng về buổi thương lượng hoặc giá chào..."
                {...register('notes')}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all"
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
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-md shadow-rose-600/20 transition-all disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  <span>Xác nhận thua</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
