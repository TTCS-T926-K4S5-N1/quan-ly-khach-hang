import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Flag, RotateCcw } from 'lucide-react';

export type LeadStatus = 'pending' | 'in_progress' | 'rejected';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  createdAt: string;
  slaDeadline: string;
  status: LeadStatus;
  rejectReason?: string;
  isFlagged?: boolean;
}

export interface SLACountdownProps {
  deadline: string;
  status: LeadStatus;
  onBreach?: () => void;
}

const SLACountdown: React.FC<SLACountdownProps> = ({ deadline, status, onBreach }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isBreached, setIsBreached] = useState<boolean>(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(0);
        if (!isBreached) {
          setIsBreached(true);
          if (onBreach) onBreach();
        }
      } else {
        setTimeLeft(diff);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [deadline, isBreached, onBreach]);

  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Đang chăm sóc
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Đã trả lại
      </span>
    );
  }

  if (isBreached) {
    return (
      <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Quá hạn SLA
      </span>
    );
  }

  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full text-blue-700 bg-blue-50">
      <Clock className="w-3.5 h-3.5 mr-1" />
      {hours > 0 ? `${hours}h ` : ''}{minutes}m {seconds}s
    </span>
  );
};

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 'LEAD-001',
      name: 'Nguyễn Văn An',
      phone: '0901234567',
      email: 'an.nguyen@example.com',
      source: 'Website Form',
      createdAt: new Date().toISOString(),
      slaDeadline: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      status: 'pending'
    },
    {
      id: 'LEAD-002',
      name: 'Trần Thị Bình',
      phone: '0912345678',
      email: 'binh.tran@example.com',
      source: 'Facebook Ads',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      slaDeadline: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: 'pending',
      isFlagged: true
    }
  ]);

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'rejected'>('pending');
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const handleAcceptLead = (id: string) => {
    setLeads(prev =>
      prev.map(lead =>
        lead.id === id ? { ...lead, status: 'in_progress' } : lead
      )
    );
  };

  const handleOpenRejectModal = (id: string) => {
    setSelectedLeadId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối!');
      return;
    }

    setLeads(prev =>
      prev.map(lead =>
        lead.id === selectedLeadId
          ? { ...lead, status: 'rejected', rejectReason }
          : lead
      )
    );

    setRejectModalOpen(false);
    setSelectedLeadId(null);
  };

  const handleSLABreach = (id: string) => {
    setLeads(prev =>
      prev.map(lead =>
        lead.id === id ? { ...lead, isFlagged: true } : lead
      )
    );
  };

  const filteredLeads = leads.filter(
    lead => activeTab === 'all' || lead.status === activeTab
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Phân bổ Lead (SLA CRM)</h1>
          <p className="text-slate-500 text-sm mt-1">
            Nhận/Từ chối Lead - Cảnh báo tự động cho Trưởng nhóm khi quá hạn phản hồi
          </p>
        </div>

        <div className="flex gap-2">
          {(['pending', 'in_progress', 'rejected', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
              }`}
            >
              {tab === 'pending' && 'Hàng chờ phân bổ'}
              {tab === 'in_progress' && 'Đang chăm sóc'}
              {tab === 'rejected' && 'Đã từ chối'}
              {tab === 'all' && 'Tất cả'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLeads.map(lead => (
            <div key={lead.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 relative">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-slate-400">{lead.id}</span>
                  <h3 className="text-lg font-bold text-slate-800">{lead.name}</h3>
                </div>
                {lead.isFlagged && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-semibold flex items-center gap-1">
                    <Flag className="w-3 h-3" /> Báo Trưởng nhóm
                  </span>
                )}
              </div>

              <div className="text-sm text-slate-600 space-y-1">
                <div>SĐT: {lead.phone}</div>
                <div>Email: {lead.email}</div>
                <div>Kênh: {lead.source}</div>
              </div>

              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-xs text-slate-500">Thời hạn SLA:</span>
                <SLACountdown 
                  deadline={lead.slaDeadline} 
                  status={lead.status} 
                  onBreach={() => handleSLABreach(lead.id)}
                />
              </div>

              {lead.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleAcceptLead(lead.id)}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
                  >
                    Nhận Lead
                  </button>
                  <button
                    onClick={() => handleOpenRejectModal(lead.id)}
                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 border"
                  >
                    Từ chối
                  </button>
                </div>
              )}

              {lead.status === 'rejected' && (
                <div className="bg-slate-50 p-2 rounded text-xs text-slate-600">
                  Lý do từ chối: {lead.rejectReason}
                </div>
              )}
            </div>
          ))}
        </div>

        {rejectModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-xl max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-red-600">Lý do từ chối Lead</h3>
              <p className="text-xs text-slate-500">Lead sẽ được chuyển trả lại hàng chờ phân bổ.</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Bắt buộc nhập lý do từ chối..."
                className="w-full h-24 p-3 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}