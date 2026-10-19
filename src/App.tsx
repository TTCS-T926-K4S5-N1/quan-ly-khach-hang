import React, { useState } from 'react';
import { STAGES, INITIAL_DEALS } from './data/mockData';
import { Deal, Stage, Role } from './types';
import { RoleSelector } from './components/RoleSelector';
import { DealCard } from './components/DealCard';
import { ValidationModal } from './components/ValidationModal';
import { ShieldCheck, Kanban, Filter } from 'lucide-react';

export function App() {
  const [currentRole, setCurrentRole] = useState<Role>('SALES_REP');
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [targetStage, setTargetStage] = useState<Stage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAttemptMove = (deal: Deal, stage: Stage) => {
    setSelectedDeal(deal);
    setTargetStage(stage);
    setIsModalOpen(true);
  };

  const handleUpdateDeal = (updatedDeal: Deal) => {
    setDeals((prev) => prev.map((d) => (d.id === updatedDeal.id ? updatedDeal : d)));
  };

  const handleConfirmSuccess = (targetStageId: string) => {
    if (!selectedDeal) return;
    setDeals((prev) =>
      prev.map((d) =>
        d.id === selectedDeal.id ? { ...d, currentStage: targetStageId } : d
      )
    );
    setIsModalOpen(false);
  };

  const handleConfirmOverride = (targetStageId: string, reason: string) => {
    if (!selectedDeal || !targetStage) return;

    const roleName =
      currentRole === 'DIRECTOR'
        ? 'Giám đốc'
        : currentRole === 'TEAM_LEAD'
        ? 'Trưởng nhóm'
        : 'Nhân viên';

    const newHistory = [
      ...(selectedDeal.overrideHistory || []),
      {
        overriddenBy: roleName,
        role: currentRole,
        reason,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }),
        fromStage: selectedDeal.currentStage,
        toStage: targetStage.id
      }
    ];

    setDeals((prev) =>
      prev.map((d) =>
        d.id === selectedDeal.id
          ? { ...d, currentStage: targetStageId, overrideHistory: newHistory }
          : d
      )
    );
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Banner Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <Kanban className="w-4 h-4" />
              CRM Pipeline Control Center
            </div>
            <h1 className="text-2xl font-black text-slate-800 mt-1">
              Điều kiện chuyển Stage Pipeline (Gate Rules)
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Đảm bảo Pipeline phản ánh thực tế, tránh tình trạng đẩy giai đoạn để đẹp báo cáo.
            </p>
          </div>

          {/* Role selector */}
          <RoleSelector currentRole={currentRole} onRoleChange={setCurrentRole} />
        </div>

        
        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              stages={STAGES}
              currentRole={currentRole}
              onAttemptMove={handleAttemptMove}
              onUpdateDeal={handleUpdateDeal}
            />
          ))}
        </div>

        {/* Validation Modal */}
        {selectedDeal && targetStage && (
          <ValidationModal
            deal={selectedDeal}
            targetStage={targetStage}
            currentRole={currentRole}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirmSuccess={handleConfirmSuccess}
            onConfirmOverride={handleConfirmOverride}
          />
        )}

      </div>
    </div>
  );
}
