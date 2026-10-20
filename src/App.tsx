import React, { useState } from 'react';
import { 
  Bell, AlertTriangle, Clock, CheckCircle2, User, 
  Users, Plus, Calendar, ShieldAlert, X
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  assignee: string;
  assigneeAvatar: string;
  dueDate: string;
  reminderMinutesBefore: number;
  status: 'PENDING' | 'COMPLETED';
  dealValue: string;
  clientName: string;
}

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Gửi báo giá hợp đồng phần mềm cho Công ty A',
    assignee: 'Nguyễn Văn A',
    assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    dueDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    reminderMinutesBefore: 30,
    status: 'PENDING',
    dealValue: '120,000,000 VNĐ',
    clientName: 'Tập đoàn A'
  },
  {
    id: '2',
    title: 'Gọi điện chốt hợp đồng gia hạn dịch vụ',
    assignee: 'Nguyễn Văn A',
    assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    dueDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    reminderMinutesBefore: 60,
    status: 'PENDING',
    dealValue: '45,000,000 VNĐ',
    clientName: 'Công ty B'
  },
  {
    id: '3',
    title: 'Họp Demo sản phẩm trực tuyến',
    assignee: 'Nguyễn Văn A',
    assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    dueDate: new Date(Date.now() + 3600000 * 3).toISOString(),
    reminderMinutesBefore: 15,
    status: 'PENDING',
    dealValue: '300,000,000 VNĐ',
    clientName: 'Dự án C'
  },
  {
    id: '4',
    title: 'Chăm sóc khách hàng sau tư vấn',
    assignee: 'Trần Thị B',
    assigneeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    dueDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    reminderMinutesBefore: 60,
    status: 'PENDING',
    dealValue: '80,000,000 VNĐ',
    clientName: 'Khách hàng cá nhân'
  },
  {
    id: '5',
    title: 'Gửi hồ sơ năng lực cho đối tác',
    assignee: 'Lê Văn C',
    assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    dueDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    reminderMinutesBefore: 120,
    status: 'PENDING',
    dealValue: '210,000,000 VNĐ',
    clientName: 'Đối tác D'
  }
];

export default function App() {
  const [role, setRole] = useState<'SALES' | 'LEADER'>('SALES');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [currentUser] = useState('Nguyễn Văn A');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    clientName: '',
    dealValue: '',
    dueDate: '',
    reminderMinutesBefore: 30
  });

  const isOverdue = (dueDateStr: string) => new Date(dueDateStr) < new Date();
  const isDueSoon = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 3600);
    return diffHours > 0 && diffHours <= 24;
  };

  const myTasks = tasks.filter(t => t.assignee === currentUser);
  const myOverdueTasks = myTasks.filter(t => t.status === 'PENDING' && isOverdue(t.dueDate));
  const myDueSoonTasks = myTasks.filter(t => t.status === 'PENDING' && isDueSoon(t.dueDate));
  const myUpcomingTasks = myTasks.filter(t => t.status === 'PENDING' && !isOverdue(t.dueDate));

  const teamMembers = Array.from(new Set(tasks.map(t => t.assignee))).map(name => {
    const memberTasks = tasks.filter(t => t.assignee === name);
    const overdueCount = memberTasks.filter(t => t.status === 'PENDING' && isOverdue(t.dueDate)).length;
    const pendingCount = memberTasks.filter(t => t.status === 'PENDING').length;
    const completedCount = memberTasks.filter(t => t.status === 'COMPLETED').length;
    const avatar = memberTasks[0]?.assigneeAvatar || '';

    return { name, avatar, overdueCount, pendingCount, completedCount, total: memberTasks.length };
  });

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.dueDate) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      clientName: newTask.clientName || 'Chưa định tên',
      dealValue: newTask.dealValue ? `${Number(newTask.dealValue).toLocaleString('vi-VN')} VNĐ` : '0 VNĐ',
      dueDate: new Date(newTask.dueDate).toISOString(),
      reminderMinutesBefore: Number(newTask.reminderMinutesBefore),
      assignee: currentUser,
      assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      status: 'PENDING'
    };

    setTasks(prev => [task, ...prev]);
    setShowAddModal(false);
    setNewTask({ title: '', clientName: '', dealValue: '', dueDate: '', reminderMinutesBefore: 30 });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg font-bold">CRM</div>
            <h1 className="font-bold text-lg text-slate-900 hidden sm:block">Nhắc Việc Thương Vụ</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-sm font-medium">
              <button 
                onClick={() => setRole('SALES')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${role === 'SALES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                <User size={16} />
                <span>NVKD</span>
              </button>
              <button 
                onClick={() => setRole('LEADER')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${role === 'LEADER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                <Users size={16} />
                <span>Trưởng nhóm</span>
              </button>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition"
              >
                <Bell size={20} />
                {myOverdueTasks.length > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {myOverdueTasks.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 font-semibold text-slate-800 text-sm flex justify-between items-center">
                    <span>Thông báo nhắc việc</span>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{myOverdueTasks.length} quá hạn</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {myOverdueTasks.map(t => (
                      <div key={t.id} className="p-3 border-b border-slate-50 bg-red-50/50 hover:bg-red-50 flex items-start space-x-2">
                        <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-red-900">{t.title}</p>
                          <p className="text-[10px] text-red-600 mt-0.5">Quá hạn từ: {new Date(t.dueDate).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    ))}
                    {myDueSoonTasks.map(t => (
                      <div key={t.id} className="p-3 border-b border-slate-50 bg-amber-50/50 hover:bg-amber-50 flex items-start space-x-2">
                        <Clock size={16} className="text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{t.title}</p>
                          <p className="text-[10px] text-amber-600 mt-0.5">Sắp đến hạn: {new Date(t.dueDate).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {role === 'SALES' ? (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Trang chủ Cá nhân</h2>
                <p className="text-slate-500 text-sm">Xin chào {currentUser}, đây là danh sách công việc thương vụ của bạn.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition shadow-sm"
              >
                <Plus size={18} />
                <span>Thêm việc thương vụ</span>
              </button>
            </div>

            {/* Cảnh báo Quá Hạn Nổi Bật */}
            {myOverdueTasks.length > 0 && (
              <section className="bg-red-50 border-2 border-red-500/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 bg-red-500 text-white rounded-xl shadow-md animate-pulse">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-900">CẢNH BÁO QUÁ HẠN ({myOverdueTasks.length})</h3>
                    <p className="text-sm text-red-700">Cần xử lý ngay để không ảnh hưởng tới tiến độ thương vụ!</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {myOverdueTasks.map(t => (
                    <div key={t.id} className="bg-white rounded-xl p-4 border border-red-200 shadow-sm flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="inline-block bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Khách hàng: {t.clientName} ({t.dealValue})
                        </div>
                        <h4 className="font-semibold text-slate-800 text-sm">{t.title}</h4>
                        <div className="flex items-center space-x-1 text-red-600 text-xs">
                          <Clock size={12} />
                          <span>Hạn: {new Date(t.dueDate).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleTaskStatus(t.id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Đánh dấu hoàn thành"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Danh sách việc */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center space-x-2">
                <Clock className="text-indigo-600" size={20} />
                <span>Danh sách công việc đang thực hiện</span>
              </h3>

              <div className="space-y-3">
                {myUpcomingTasks.map(t => {
                  const dueSoon = isDueSoon(t.dueDate);
                  return (
                    <div 
                      key={t.id} 
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        dueSoon ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50/50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <button 
                          onClick={() => toggleTaskStatus(t.id)}
                          className="mt-0.5 text-slate-300 hover:text-emerald-500 transition"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-slate-500">{t.clientName}</span>
                            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">{t.dealValue}</span>
                            {dueSoon && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                Sắp đến hạn
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-slate-800 text-sm mt-1">{t.title}</h4>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-500 self-end sm:self-center">
                        <div className="flex items-center space-x-1">
                          <Bell size={14} className="text-slate-400" />
                          <span>Nhắc trước {t.reminderMinutesBefore} phút</span>
                        </div>
                        <div className="flex items-center space-x-1 font-medium text-slate-700">
                          <Calendar size={14} />
                          <span>{new Date(t.dueDate).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          /* Trưởng nhóm View */
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Dashboard Quản Lý Trưởng Nhóm</h2>
              <p className="text-slate-500 text-sm">Theo dõi tổng quan việc quá hạn của từng thành viên.</p>
            </div>

            <section className="grid gap-4 sm:grid-cols-3">
              {teamMembers.map(m => (
                <div key={m.name} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-slate-800">{m.name}</h4>
                      <p className="text-xs text-slate-500">NVKD</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-red-600">Số việc quá hạn:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.overdueCount > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        {m.overdueCount} việc
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Việc đang thực hiện:</span>
                      <span>{m.pendingCount} việc</span>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}
      </main>

      {/* Modal Thêm Việc */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tạo Thương Vụ / Nhắc Việc Mới</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên công việc</label>
                <input 
                  type="text" 
                  required
                  placeholder="VD: Gửi báo giá thương vụ..."
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên Khách hàng / Dự án</label>
                <input 
                  type="text"
                  placeholder="VD: Tập đoàn ABC"
                  value={newTask.clientName}
                  onChange={e => setNewTask({...newTask, clientName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hạn hoàn thành (Due Date)</label>
                <input 
                  type="datetime-local" 
                  required
                  value={newTask.dueDate}
                  onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Thời gian nhắc trước</label>
                <select 
                  value={newTask.reminderMinutesBefore}
                  onChange={e => setNewTask({...newTask, reminderMinutesBefore: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={15}>Trước 15 phút</option>
                  <option value={30}>Trước 30 phút</option>
                  <option value={60}>Trước 1 giờ</option>
                  <option value={120}>Trước 2 giờ</option>
                  <option value={1440}>Trước 1 ngày</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Tạo nhắc việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}