import React, { useState, type ChangeEvent } from 'react';
import { UserPlus, FileSpreadsheet, Download, Upload, AlertTriangle, Trash2, Check } from 'lucide-react';

export interface PreviewLead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  errors: { fullName?: string; email?: string; phone?: string; source?: string };
}

const SOURCES = ['Hội thảo', 'Sự kiện / Triển lãm', 'Danh thiếp', 'Website', 'Giới thiệu', 'Khác'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', company: '', source: 'Hội thảo', notes: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');
  const [previewLeads, setPreviewLeads] = useState<PreviewLead[]>([]);
  const [fileName, setFileName] = useState('');

  const validateLead = (data: { fullName: string; email: string; phone: string; source: string }) => {
    const errors: Record<string, string> = {};
    if (!data.fullName.trim()) errors.fullName = 'Họ tên là bắt buộc';
    if (!data.source.trim()) errors.source = 'Nguồn lead là bắt buộc (*)';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email không hợp lệ';
    if (data.phone && !/^[0-9+\-\s()]{8,15}$/.test(data.phone)) errors.phone = 'SĐT không hợp lệ';
    return errors;
  };

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateLead(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormData({ fullName: '', email: '', phone: '', company: '', source: 'Hội thảo', notes: '' });
    setFormErrors({});
    setSuccessMsg('Thêm mới Lead thành công!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((line: string) => line.trim() !== '');
      const mockParsedLeads: PreviewLead[] = [];
      const dataRows = lines.slice(1);

      if (dataRows.length === 0) {
        mockParsedLeads.push(
          { id: '1', fullName: 'Lê Văn C', email: 'vanc@gmail.com', phone: '0901234567', company: 'Sài Gòn Tech', source: 'Hội thảo', errors: {} },
          { id: '2', fullName: 'Phạm Minh D', email: 'minhd_invalid', phone: '123', company: 'Startup X', source: '', errors: { email: 'Email sai định dạng', phone: 'SĐT ngắn', source: 'Thiếu nguồn lead' } },
          { id: '3', fullName: 'Hoàng Kim E', email: 'kime@tech.io', phone: '0933445566', company: 'Công ty E', source: 'Sự kiện / Triển lãm', errors: {} }
        );
      } else {
        dataRows.forEach((rowStr: string, idx: number) => {
          const cols = rowStr.split(',').map((c: string) => c.trim().replace(/^"|"$/g, ''));
          const fullName = cols[0] || '';
          const email = cols[1] || '';
          const phone = cols[2] || '';
          const company = cols[3] || '';
          const source = cols[4] || '';
          const errors = validateLead({ fullName, email, phone, source });
          mockParsedLeads.push({ id: (idx + 1).toString(), fullName, email, phone, company, source, errors });
        });
      }
      setPreviewLeads(mockParsedLeads);
    };
    reader.readAsText(file);
  };

  const handleCellEdit = (id: string, field: keyof PreviewLead, value: string) => {
    setPreviewLeads((prev: PreviewLead[]) =>
      prev.map((row: PreviewLead) => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          const newErrors = validateLead({
            fullName: updatedRow.fullName,
            email: updatedRow.email,
            phone: updatedRow.phone,
            source: updatedRow.source
          });
          return { ...updatedRow, errors: newErrors };
        }
        return row;
      })
    );
  };

  const handleDeletePreviewRow = (id: string) => {
    setPreviewLeads((prev: PreviewLead[]) => prev.filter((r: PreviewLead) => r.id !== id));
  };

  const handleConfirmImport = () => {
    const validRows = previewLeads.filter((r: PreviewLead) => Object.keys(r.errors).length === 0);
    if (validRows.length === 0) return;
    setPreviewLeads([]);
    setFileName('');
    setSuccessMsg(`Đã nhập thành công ${validRows.length} lead vào hệ thống!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const downloadSampleFile = () => {
    const headers = 'Họ và Tên,Email,Số điện thoại,Công ty,Nguồn lead\n';
    const sampleData = 'Nguyễn Văn Mẫu,mau@gmail.com,0988776655,Công ty Mẫu,Hội thảo\n';
    const blob = new Blob([headers + sampleData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau_nhap_lead.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalErrors = previewLeads.reduce((acc: number, r: PreviewLead) => acc + Object.keys(r.errors).length, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="w-7 h-7" /> Nhập Lead Marketing
            </h1>
            <p className="text-indigo-200 text-sm">Hệ thống nhập lead thủ công và hàng loạt từ hội thảo</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition ${activeTab === 'manual' ? 'bg-white text-indigo-700 shadow' : 'hover:bg-indigo-600'}`}
            >
              <UserPlus className="w-4 h-4" /> Nhập Thủ Công
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition ${activeTab === 'import' ? 'bg-white text-indigo-700 shadow' : 'hover:bg-indigo-600'}`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Nhập Từ Excel
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'manual' && (
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" /> Nhập Tay Lead Mới
            </h2>
            <p className="text-sm text-slate-500 mb-6">Thêm thông tin lead thu thập từ sự kiện hoặc danh thiếp trực tiếp.</p>

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-lg flex items-center gap-2 border border-emerald-200">
                <Check className="w-5 h-5 text-emerald-600" /> {successMsg}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và Tên *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className={`w-full p-2.5 rounded-lg border ${formErrors.fullName ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@domain.com"
                    className={`w-full p-2.5 rounded-lg border ${formErrors.email ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912345678"
                    className={`w-full p-2.5 rounded-lg border ${formErrors.phone ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Công ty / Tổ chức</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Công ty ABC"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn Lead <span className="text-red-500">* (Bắt buộc)</span></label>
                  <select
                    value={formData.source}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, source: e.target.value })}
                    className={`w-full p-2.5 rounded-lg border ${formErrors.source ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`}
                  >
                    {SOURCES.map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {formErrors.source && <p className="text-red-500 text-xs mt-1">{formErrors.source}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Thêm thông tin trao đổi..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-md flex justify-center items-center gap-2"
              >
                <UserPlus className="w-5 h-5" /> Lưu Lead Vào Hệ Thống
              </button>
            </form>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> Nhập Lead Hàng Loạt Từ Excel / CSV
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Tải lên danh sách thu thập từ hội thảo để đưa vào hệ thống.</p>
                </div>
                <button
                  onClick={downloadSampleFile}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" /> Tải Tệp Mẫu (.CSV)
                </button>
              </div>

              <div className="mt-6 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:border-indigo-400 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Tải tệp Excel hoặc CSV lên</p>
                <p className="text-xs text-slate-400 mt-1">Kéo thả tệp vào đây hoặc nhấn để chọn tệp</p>
                {fileName && <p className="mt-3 text-sm text-indigo-600 font-medium">Đã chọn: {fileName}</p>}
              </div>
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg flex items-center gap-2 border border-emerald-200">
                <Check className="w-5 h-5 text-emerald-600" /> {successMsg}
              </div>
            )}

            {previewLeads.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg">Xem Trước Dữ Liệu ({previewLeads.length} dòng)</h3>
                    <p className="text-sm text-slate-500">Bạn có thể chỉnh sửa trực tiếp thông tin lỗi ngay trên bảng trước khi lưu.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {totalErrors > 0 ? (
                      <span className="text-xs px-3 py-1.5 bg-red-100 text-red-700 font-semibold rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Có {totalErrors} lỗi cần sửa
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 font-semibold rounded-full flex items-center gap-1">
                        <Check className="w-4 h-4" /> Dữ liệu hợp lệ 100%
                      </span>
                    )}
                    <button
                      onClick={handleConfirmImport}
                      disabled={previewLeads.filter((r: PreviewLead) => Object.keys(r.errors).length === 0).length === 0}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow transition flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Xác Nhận Nhập ({previewLeads.filter((r: PreviewLead) => Object.keys(r.errors).length === 0).length}) Lead
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-3">Họ và Tên</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Số điện thoại</th>
                        <th className="p-3">Công ty</th>
                        <th className="p-3">Nguồn lead *</th>
                        <th className="p-3">Lỗi / Trạng thái</th>
                        <th className="p-3 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {previewLeads.map((row: PreviewLead) => {
                        const hasErr = Object.keys(row.errors).length > 0;
                        return (
                          <tr key={row.id} className={hasErr ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.fullName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleCellEdit(row.id, 'fullName', e.target.value)}
                                className={`w-full p-1.5 rounded border text-sm ${row.errors.fullName ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.email}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleCellEdit(row.id, 'email', e.target.value)}
                                className={`w-full p-1.5 rounded border text-sm ${row.errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.phone}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleCellEdit(row.id, 'phone', e.target.value)}
                                className={`w-full p-1.5 rounded border text-sm ${row.errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.company}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleCellEdit(row.id, 'company', e.target.value)}
                                className="w-full p-1.5 rounded border border-slate-300 text-sm"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.source}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleCellEdit(row.id, 'source', e.target.value)}
                                className={`w-full p-1.5 rounded border text-sm bg-white ${row.errors.source ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                              >
                                <option value="">-- Chọn nguồn --</option>
                                {SOURCES.map((s: string) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 text-xs">
                              {hasErr ? (
                                <ul className="text-red-600 list-disc list-inside space-y-0.5">
                                  {Object.values(row.errors).map((err: string, i: number) => (
                                    <li key={i}>{err}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-emerald-600 font-medium flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Hợp lệ
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleDeletePreviewRow(row.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded transition"
                                title="Xóa dòng này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}