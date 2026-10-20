import React, { useState } from 'react';
import { 
  Phone, 
  Users, 
  Mail, 
  FileText, 
  Plus, 
  Clock, 
  Calendar, 
  Building, 
  User, 
  Briefcase, 
  CheckCircle, 
  History,
  Send,
  Sparkles
} from 'lucide-react';

// TypeScript Types
type ActivityType = 'call' | 'meeting' | 'email' | 'note';

interface ActivityLog {
  id: string;
  type: ActivityType;
  customer: string;
  contactPerson: string;
  opportunity: string;
  datetime: string;
  duration: number;
  content: string;
  outcome: string;
  isPastActivity: boolean;
  createdAt: string;
}

const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: '1',
    type: 'meeting',
    customer: 'Công ty TNHH Công Nghệ ABC',
    contactPerson: 'Anh Nguyễn Văn A (CEO)',
    opportunity: 'Hợp đồng phần mềm CRM Q4/2026',
    datetime: '2026-10-20T14:00',
    duration: 45,
    content: 'Gặp mặt trực tiếp tại văn phòng khách hàng. Đã demo tính năng quản lý lịch sử chăm sóc khách hàng.',
    outcome: 'Khách hàng rất hài lòng. Yêu cầu gửi báo giá chi tiết trước thứ 6.',
    isPastActivity: true,
    createdAt: '15 phút trước'
  },
  {
    id: '2',
    type: 'call',
    customer: 'Tập đoàn Bán Lẻ XYZ',
    contactPerson: 'Chị Trần Thị B (Trưởng phòng Mua hàng)',
    opportunity: 'Nâng cấp hệ thống quản lý bán hàng',
    datetime: '2026-10-19T09:30',
    duration: 15,
    content: 'Gọi điện trao đổi nhanh về tiến độ phê duyệt ngân sách.',
    outcome: 'Đã phê duyệt ngân sách, hẹn tuần sau ký hợp đồng.',
    isPastActivity: true,
    createdAt: 'Hôm qua'
  }
];

export default function App() {
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Form State
  const [type, setType] = useState<ActivityType>('call');
  const [customer, setCustomer] = useState('Công ty TNHH Công Nghệ ABC');
  const [contactPerson, setContactPerson] = useState('Anh Nguyễn Văn A');
  const [opportunity, setOpportunity] = useState('Hợp đồng phần mềm CRM Q4/2026');
  const [datetime, setDatetime] = useState(new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState<number>(15);
  const [content, setContent] = useState('');
  const [outcome, setOutcome] = useState('');
  const [isPastActivity, setIsPastActivity] = useState(true);

  // Success Notification state
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !outcome.trim()) {
      alert('Vui lòng nhập đầy đủ nội dung trao đổi và kết quả!');
      return;
    }

    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      type,
      customer,
      contactPerson,
      opportunity,
      datetime,
      duration: Number(duration),
      content,
      outcome,
      isPastActivity,
      createdAt: 'Vừa xong'
    };

    setActivities([newActivity, ...activities]);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Reset Form content
    setContent('');
    setOutcome('');
    setActiveTab('history');
  };

  const getActivityBadge = (actType: ActivityType) => {
    switch (actType) {
      case 'call':
        return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold"><Phone className="w-3.5 h-3.5" /> Cuộc gọi</span>;
      case 'meeting':
        return <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold"><Users className="w-3.5 h-3.5" /> Cuộc gặp</span>;
      case 'email':
        return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold"><Mail className="w-3.5 h-3.5" /> Email</span>;
      case 'note':
        return <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold"><FileText className="w-3.5 h-3.5" /> Ghi chú</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Ghi Nhận Hoạt Động CRM</h1>
              <p className="text-xs text-blue-100">Lưu trữ lịch sử trao đổi dùng chung tập trung</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-white/10 px-3 py-1.5 rounded-full text-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Tối ưu di động
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        {/* Toast Notification */}
        {showToast && (
          <div className="mb-4 p-4 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Đã ghi nhận hoạt động thành công!</p>
              <p className="text-xs text-emerald-100">Dữ liệu đã được lưu vào hệ thống chung cho toàn team.</p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex bg-slate-200 p-1 rounded-xl mb-6 shadow-inner">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" /> Ghi hoạt động mới
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" /> Lịch sử trao đổi ({activities.length})
          </button>
        </div>

        {/* FORM VIEW */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Tạo Nhật Ký Khách Hàng
              </h2>
              <span className="text-xs text-slate-400">Dành cho NV Kinh Doanh</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Loại hoạt động */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  1. Loại hoạt động *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'call', label: 'Cuộc gọi', icon: Phone, color: 'hover:border-blue-500 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700' },
                    { id: 'meeting', label: 'Cuộc gặp', icon: Users, color: 'hover:border-purple-500 peer-checked:border-purple-600 peer-checked:bg-purple-50 peer-checked:text-purple-700' },
                    { id: 'email', label: 'Email', icon: Mail, color: 'hover:border-amber-500 peer-checked:border-amber-600 peer-checked:bg-amber-50 peer-checked:text-amber-700' },
                    { id: 'note', label: 'Ghi chú', icon: FileText, color: 'hover:border-emerald-500 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-700' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <label key={item.id} className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="activityType"
                          value={item.id}
                          checked={type === item.id}
                          onChange={() => setType(item.id as ActivityType)}
                          className="peer sr-only"
                        />
                        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 border-slate-200 bg-white transition-all text-slate-600 font-medium text-xs sm:text-sm ${item.color}`}>
                          <Icon className="w-5 h-5 mb-1" />
                          {item.label}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 2. Gắn kết nối */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  2. Liên kết thông tin khách hàng
                </span>
                
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Khách hàng / Công ty</label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <select
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Công ty TNHH Công Nghệ ABC">Công ty TNHH Công Nghệ ABC</option>
                      <option value="Tập đoàn Bán Lẻ XYZ">Tập đoàn Bán Lẻ XYZ</option>
                      <option value="Công ty Cổ phần Đầu tư DEF">Công ty Cổ phần Đầu tư DEF</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-medium">Người liên hệ</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Nhập tên người liên hệ..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-medium">Cơ hội kinh doanh liên quan</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <select
                        value={opportunity}
                        onChange={(e) => setOpportunity(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Hợp đồng phần mềm CRM Q4/2026">Hợp đồng phần mềm CRM Q4/2026</option>
                        <option value="Nâng cấp hệ thống quản lý bán hàng">Nâng cấp hệ thống quản lý bán hàng</option>
                        <option value="Gói tư vấn chuyển đổi số">Gói tư vấn chuyển đổi số</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Thời gian & Thời lượng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Thời điểm diễn ra *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={datetime}
                      onChange={(e) => setDatetime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Thời lượng (phút) *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tag Hoạt động đã diễn ra trong quá quá khứ */}
              <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800">
                <input
                  type="checkbox"
                  id="pastToggle"
                  checked={isPastActivity}
                  onChange={(e) => setIsPastActivity(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="pastToggle" className="cursor-pointer font-medium">
                  Đây là hoạt động <strong>đã diễn ra trong quá quá khứ</strong> (Ghi nhận lại lịch sử ngay sau cuộc gặp/gọi)
                </label>
              </div>

              {/* 4. Nội dung trao đổi */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nội dung trao đổi *
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tóm tắt các điểm quan trọng đã trao đổi với khách hàng..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>

              {/* 5. Kết quả & Hành động tiếp theo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Kết quả & Bước tiếp theo *
                </label>
                <textarea
                  rows={2}
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="Kết quả đạt được (ví dụ: Khách chốt demo, yêu cầu báo giá, hẹn gọi lại sau...)"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-base"
              >
                <Send className="w-5 h-5" /> Lưu Hoạt Động Vào Lịch Sử Chung
              </button>
            </form>
          </div>
        )}

        {/* HISTORY VIEW */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Lịch sử hoạt động đã ghi nhận
              </h2>
              <span className="text-xs text-slate-500">Hiển thị cho cả bộ phận</span>
            </div>

            {activities.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
                Chưa có hoạt động nào được ghi nhận.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      {getActivityBadge(act.type)}
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {new Date(act.datetime).toLocaleString('vi-VN')} ({act.duration} phút)
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {act.createdAt}
                    </span>
                  </div>

                  {/* Customer Context */}
                  <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-600" /> {act.customer}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> {act.contactPerson}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400" /> {act.opportunity}
                      </span>
                    </div>
                  </div>

                  {/* Content & Outcome */}
                  <div className="space-y-2 text-sm text-slate-700">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">Nội dung trao đổi:</span>
                      <p className="mt-0.5 text-slate-800 leading-relaxed">{act.content}</p>
                    </div>
                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-xs font-bold text-emerald-800 block">Kết quả & Hành động:</span>
                      <p className="mt-0.5 text-emerald-950 font-medium">{act.outcome}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}