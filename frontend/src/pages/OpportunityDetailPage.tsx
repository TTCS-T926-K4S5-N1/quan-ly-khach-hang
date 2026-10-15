import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Opportunity, OpportunityHistoryItem } from '../types/opportunity';
import { opportunityService } from '../services/opportunityService';
import { OpportunityDetail } from '../components/opportunities/OpportunityDetail';
import { CloseWonModal } from '../components/opportunities/CloseWonModal';
import { CloseLostModal } from '../components/opportunities/CloseLostModal';
import { ReopenOpportunityModal } from '../components/opportunities/ReopenOpportunityModal';
import { useOpportunities, AVAILABLE_ROLES } from '../hooks/useOpportunities';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

export const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    currentUser,
    setCurrentUser,
    toast,
    setToast,
    showToast,
    submitCloseWon,
    submitCloseLost,
    submitReopen,
  } = useOpportunities();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [history, setHistory] = useState<OpportunityHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [modalWonOpen, setModalWonOpen] = useState(false);
  const [modalLostOpen, setModalLostOpen] = useState(false);
  const [modalReopenOpen, setModalReopenOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const opp = await opportunityService.getOpportunityById(Number(id));
      setOpportunity(opp);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông tin cơ hội kinh doanh.');
    } finally {
      setLoading(false);
    }

    // Load history
    setHistoryLoading(true);
    try {
      const h = await opportunityService.getOpportunityHistory(Number(id));
      setHistory(h);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWonSubmit = async (oppId: number, payload: any) => {
    const success = await submitCloseWon(oppId, payload);
    if (success) {
      await loadData();
    }
    return success;
  };

  const handleLostSubmit = async (oppId: number, payload: any) => {
    const success = await submitCloseLost(oppId, payload);
    if (success) {
      await loadData();
    }
    return success;
  };

  const handleReopenSubmit = async (oppId: number, payload: any) => {
    const success = await submitReopen(oppId, payload);
    if (success) {
      await loadData();
    }
    return success;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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

      {/* Top Navigation & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/opportunities')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Quay lại danh sách</span>
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-medium">Chi tiết cơ hội #{id}</span>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
          <ShieldCheck size={16} className="text-sky-600" />
          <span className="text-slate-500">Vai trò:</span>
          <select
            value={currentUser.role}
            onChange={(e) => {
              const found = AVAILABLE_ROLES.find((r) => r.role === e.target.value);
              if (found) setCurrentUser(found);
            }}
            className="font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            {AVAILABLE_ROLES.map((r) => (
              <option key={r.role} value={r.role}>
                {r.fullName} ({r.roleNameVi})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-r-transparent"></div>
          <p className="mt-3 text-sm text-slate-500">Đang tải dữ liệu chi tiết cơ hội...</p>
        </div>
      ) : error || !opportunity ? (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-12 text-center text-rose-700">
          <AlertCircle size={36} className="mx-auto mb-3 text-rose-500" />
          <h3 className="text-base font-bold">Không thể hiển thị cơ hội</h3>
          <p className="text-sm mt-1 text-slate-600">{error || 'Cơ hội không tồn tại hoặc đã bị xóa.'}</p>
          <button
            onClick={() => navigate('/opportunities')}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            Về danh sách cơ hội
          </button>
        </div>
      ) : (
        <OpportunityDetail
          opportunity={opportunity}
          history={history}
          currentUser={currentUser}
          onOpenCloseWon={() => setModalWonOpen(true)}
          onOpenCloseLost={() => setModalLostOpen(true)}
          onOpenReopen={() => setModalReopenOpen(true)}
          historyLoading={historyLoading}
        />
      )}

      {/* Modals */}
      {opportunity && modalWonOpen && (
        <CloseWonModal
          opportunity={opportunity}
          isOpen={modalWonOpen}
          onClose={() => setModalWonOpen(false)}
          onSubmit={handleWonSubmit}
        />
      )}

      {opportunity && modalLostOpen && (
        <CloseLostModal
          opportunity={opportunity}
          isOpen={modalLostOpen}
          onClose={() => setModalLostOpen(false)}
          onSubmit={handleLostSubmit}
        />
      )}

      {opportunity && modalReopenOpen && (
        <ReopenOpportunityModal
          opportunity={opportunity}
          isOpen={modalReopenOpen}
          onClose={() => setModalReopenOpen(false)}
          onSubmit={handleReopenSubmit}
        />
      )}
    </div>
  );
};
