import React from 'react';
import { Deal, Stage, Role } from '../types';
import { CalendarPlus, FileText, CheckSquare, History, UserCheck } from 'lucide-react';

interface Props {
  deal: Deal;
  stages: Stage[];
  currentRole: Role;
  onAttemptMove: (deal: Deal, targetStage: Stage) => void;
  onUpdateDeal: (updatedDeal: Deal) => void;
}

export const DealCard: React.FC<Props> = ({
  deal,
  stages,
  currentRole,
  onAttemptMove,
  onUpdateDeal
}) => {
  const currentStageIndex = stages.findIndex((s) => s.id === deal.currentStage);

  const handleAddMeeting = () => {
    onUpdateDeal({
      ...deal,
      loggedMeetingsCount: deal.loggedMeetingsCount + 1
    });
  };

  const handleToggleProposal = () => {
    onUpdateDeal({
      ...deal,
      hasProposal: !deal.hasProposal
    });
  };

  const handleToggleContract = () => {
    onUpdateDeal({
      ...deal,
      contractSigned: !deal.contractSigned
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 space-y-4">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {deal.company}
          </span>
          <h3 className="font-bold text-slate-800 text-base mt-2">{deal.title}</h3>
          <p className="text-sm font-bold text-slate-600 mt-0.5">
            {deal.value.toLocaleString('vi-VN')} VNĐ
          </p>
        </div>
      </div>

      {/* Stage selector pipeline */}
      <div className="space-y-1.5">
        <div className="text-xs font-semibold text-slate-500">Chuyển sang giai đoạn:</div>
        <div className="grid grid-cols-2 gap-2">
          {stages.map((stg, idx) => {
            const isCurrent = stg.id === deal.currentStage;
            return (
              <button
                key={stg.id}
                disabled={isCurrent}
                onClick={() => onAttemptMove(deal, stg)}
                className={`text-xs py-2 px-3 rounded-xl font-medium border text-left transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {stg.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Interactive Actions to satisfy conditions */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Mô phỏng dữ liệu thực tế:
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAddMeeting}
            className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1.5 rounded-lg text-slate-700 font-medium"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
            +1 Cuộc gặp ({deal.loggedMeetingsCount})
          </button>

          <button
            onClick={handleToggleProposal}
            className={`flex items-center gap-1.5 text-xs border px-2.5 py-1.5 rounded-lg font-medium transition ${
              deal.hasProposal
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            {deal.hasProposal ? 'Đã gửi báo giá ✓' : 'Đính kèm Báo giá'}
          </button>

          <button
            onClick={handleToggleContract}
            className={`flex items-center gap-1.5 text-xs border px-2.5 py-1.5 rounded-lg font-medium transition ${
              deal.contractSigned
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
            {deal.contractSigned ? 'Đã ký HĐ ✓' : 'Ký Hợp đồng'}
          </button>
        </div>
      </div>

      {/* Override History Logs */}
      {deal.overrideHistory && deal.overrideHistory.length > 0 && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
            <History className="w-3.5 h-3.5" />
            Lịch sử Ghi đè Ngoại lệ ({deal.overrideHistory.length}):
          </div>
          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {deal.overrideHistory.map((item, index) => (
              <div key={index} className="p-2 bg-amber-50/70 rounded-lg text-[11px] border border-amber-200">
                <div className="flex justify-between font-semibold text-amber-900">
                  <span>{item.overriddenBy} ({item.role})</span>
                  <span className="text-slate-400 font-normal">{item.timestamp}</span>
                </div>
                <div className="text-amber-800 mt-0.5">
                  Lý do: "{item.reason}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
