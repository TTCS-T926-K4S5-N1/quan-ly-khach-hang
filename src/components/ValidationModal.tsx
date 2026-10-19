import React, { useState } from 'react';
import { Deal, Stage, Role } from '../types';
import { AlertTriangle, CheckCircle2, XCircle, Lock, ShieldAlert, ArrowRight } from 'lucide-react';

interface Props {
  deal: Deal;
  targetStage: Stage;
  currentRole: Role;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess: (targetStageId: string) => void;
  onConfirmOverride: (targetStageId: string, reason: string) => void;
}

export const ValidationModal: React.FC<Props> = ({
  deal,
  targetStage,
  currentRole,
  isOpen,
  onClose,
  onConfirmSuccess,
  onConfirmOverride
}) => {
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [errorText, setErrorText] = useState('');

  if (!isOpen) return null;

  const conditions = targetStage.requiredConditions(deal);
  const missingConditions = conditions.filter((c) => !c.isMet);
  const isAllMet = missingConditions.length === 0;
  const canOverride = currentRole === 'TEAM_LEAD' || currentRole === 'DIRECTOR';

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setErrorText('Vui lòng nhập lý do cụ thể để ghi đè điều kiện!');
      return;
    }
    onConfirmOverride(targetStage.id, overrideReason.trim());
    setOverrideReason('');
    setShowOverrideInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden transition-all animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className={`p-5 text-white flex items-center justify-between ${
          isAllMet ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          <div className="flex items-center gap-2.5">
            {isAllMet ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
            <h3 className="font-bold text-lg">
              {isAllMet ? 'Đủ điều kiện chuyển giai đoạn' : 'Không thể chuyển giai đoạn'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-sm">
            <div className="font-semibold text-slate-800">{deal.title}</div>
            <div className="text-slate-500 text-xs flex items-center gap-2 mt-1">
              <span>{deal.currentStage}</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-blue-600">{targetStage.name}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Kiểm tra điều kiện bắt buộc (Gate Rules)
            </h4>
            <div className="space-y-2.5">
              {conditions.map((cond) => (
                <div
                  key={cond.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    cond.isMet
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50/50 border-red-200 text-red-900'
                  }`}
                >
                  {cond.isMet ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-sm">{cond.name}</div>
                    <div className="text-xs opacity-80 mt-0.5">{cond.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing conditions notification */}
          {!isAllMet && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Chưa thỏa mãn {missingConditions.length} điều kiện:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {missingConditions.map((c) => (
                    <li key={c.id}>{c.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Override Form section for Team Lead / Director */}
          {!isAllMet && canOverride && (
            <div className="border-t border-slate-200 pt-4">
              {!showOverrideInput ? (
                <button
                  type="button"
                  onClick={() => setShowOverrideInput(true)}
                  className="w-full py-2.5 px-4 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Ghi đè quy tắc (Dành cho Trưởng nhóm / Giám đốc)
                </button>
              ) : (
                <form onSubmit={handleOverrideSubmit} className="space-y-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900">
                    Bắt buộc nhập lý do ngoại lệ (Ghi đè hệ thống):
                  </label>
                  <textarea
                    rows={3}
                    value={overrideReason}
                    onChange={(e) => {
                      setOverrideReason(e.target.value);
                      setErrorText('');
                    }}
                    placeholder="VD: Khách hàng đồng ý qua điện thoại nhưng chưa bổ sung lịch hẹn trên CRM..."
                    className="w-full text-xs p-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errorText && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOverrideInput(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-sm"
                    >
                      Xác nhận Ghi đè
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Sales Rep restriction warning */}
          {!isAllMet && !canOverride && (
            <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Chỉ <b>Trưởng nhóm</b> hoặc <b>Giám đốc</b> mới có quyền ghi đè điều kiện này.</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Đóng
          </button>

          {isAllMet && (
            <button
              onClick={() => onConfirmSuccess(targetStage.id)}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition"
            >
              Chấp nhận Chuyển giai đoạn
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
