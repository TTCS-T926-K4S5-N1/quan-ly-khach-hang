import React, { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Lock, 
  Globe, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Briefcase, 
  Calendar, 
  X
} from 'lucide-react';

interface AppUser {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number; // Kích thước tệp tính bằng bytes
  type: string;
  category: 'Bid' | 'Meeting' | 'Contract' | 'Other';
  uploadedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  uploadedAt: string;
  allowedUserIds: string[]; // Danh sách ID người dùng có quyền tải xuống
  isPublic: boolean;
  url: string;
}

// Giả lập người dùng hiện tại
const CURRENT_USER: AppUser = {
  id: 'usr_001',
  name: 'Nguyễn Văn Kinh Doanh',
  role: 'Nhân viên Kinh doanh',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
};

const OTHER_USER: AppUser = {
  id: 'usr_002',
  name: 'Trần Thị Trưởng Phòng',
  role: 'Quản lý Bán hàng',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
};

const INITIAL_ATTACHMENTS: Attachment[] = [
  {
    id: 'att-1',
    name: 'Ho_so_dieu_kien_du_thau_2026.pdf',
    size: 14.5 * 1024 * 1024, // 14.5 MB
    type: 'pdf',
    category: 'Bid',
    uploadedBy: {
      id: CURRENT_USER.id,
      name: CURRENT_USER.name,
      avatar: CURRENT_USER.avatar
    },
    uploadedAt: '2026-10-20T09:30:00.000Z',
    allowedUserIds: [CURRENT_USER.id, OTHER_USER.id],
    isPublic: false,
    url: '#'
  },
  {
    id: 'att-2',
    name: 'Bien_ban_hop_chot_yeu_cau_khach_hang.docx',
    size: 3.2 * 1024 * 1024, // 3.2 MB
    type: 'docx',
    category: 'Meeting',
    uploadedBy: {
      id: OTHER_USER.id,
      name: OTHER_USER.name,
      avatar: OTHER_USER.avatar
    },
    uploadedAt: '2026-10-19T15:45:00.000Z',
    allowedUserIds: [OTHER_USER.id, CURRENT_USER.id],
    isPublic: true,
    url: '#'
  }
];

export default function App() {
  const [attachments, setAttachments] = useState<Attachment[]>(INITIAL_ATTACHMENTS);
  const [activeUser, setActiveUser] = useState<AppUser>(CURRENT_USER);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

  // Hiển thị kích thước file đẹp hơn
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format ngày giờ
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Xử lý Upload Tệp
  const handleFiles = (files: FileList) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const validFiles: Attachment[] = [];
    let oversizeDetected = false;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        oversizeDetected = true;
      } else {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let category: Attachment['category'] = 'Other';
        if (file.name.toLowerCase().includes('thau') || file.name.toLowerCase().includes('bid')) {
          category = 'Bid';
        } else if (file.name.toLowerCase().includes('hop') || file.name.toLowerCase().includes('bien_ban')) {
          category = 'Meeting';
        }

        const newAttachment: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: ext,
          category: category,
          uploadedBy: {
            id: activeUser.id,
            name: activeUser.name,
            avatar: activeUser.avatar
          },
          uploadedAt: new Date().toISOString(),
          allowedUserIds: [activeUser.id], // Mặc định người sở hữu được tải
          isPublic: true, // Mặc định chia sẻ rộng rãi trong thương vụ
          url: URL.createObjectURL(file)
        };
        validFiles.push(newAttachment);
      }
    });

    if (oversizeDetected) {
      setErrorMsg('Một số tệp bị từ chối do vượt quá dung lượng tối đa 20MB.');
    }

    if (validFiles.length > 0) {
      setAttachments((prev) => [...validFiles, ...prev]);
      setSuccessMsg(`Đã đính kèm thành công ${validFiles.length} tệp tài liệu.`);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleDelete = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    setSuccessMsg('Đã xóa tài liệu đính kèm.');
  };

  const canDownload = (attachment: Attachment): boolean => {
    if (attachment.isPublic) return true;
    return attachment.uploadedBy.id === activeUser.id || attachment.allowedUserIds.includes(activeUser.id);
  };

  const filteredAttachments = attachments.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.uploadedBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-tight">Cơ hội Kinh doanh #OPP-2026-88</h1>
              <p className="text-xs text-slate-500">Dự án Cung cấp Giải pháp Phần mềm Enterprise</p>
            </div>
          </div>

          {/* Chuyển đổi User giả lập để kiểm tra phân quyền */}
          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-500 pl-2 hidden sm:inline">Giả lập tài khoản:</span>
            <button
              onClick={() => setActiveUser(CURRENT_USER)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeUser.id === CURRENT_USER.id 
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <img src={CURRENT_USER.avatar} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
              <span>Chính mình</span>
            </button>
            <button
              onClick={() => setActiveUser(OTHER_USER)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeUser.id === OTHER_USER.id 
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <img src={OTHER_USER.avatar} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
              <span>Đồng nghiệp</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Thông báo Alert */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <span className="flex-1">{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Khu vực Upload Tệp */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Đính kèm tài liệu vào thương vụ</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tải lên hồ sơ thầu, biên bản họp và các tài liệu quan trọng khác.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
              Tối đa 20MB / tệp
            </span>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/50 scale-[1.005]' 
                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Kéo thả các tệp vào đây hoặc <span className="text-blue-600 underline">bấm để chọn</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Hỗ trợ nhiều tệp (PDF, Word, Excel, PNG, JPG...). Tối đa 20MB mỗi tệp.
            </p>
          </div>
        </div>

        {/* Danh sách & Bộ lọc Tài liệu */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900">Danh sách tài liệu ({filteredAttachments.length})</h3>
            </div>

            {/* Tìm kiếm & Bọ lọc */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Tìm kiếm */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên tệp, người tải..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Lọc loại tài liệu */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                {[
                  { id: 'All', label: 'Tất cả' },
                  { id: 'Bid', label: 'Hồ sơ thầu' },
                  { id: 'Meeting', label: 'Biên bản họp' },
                  { id: 'Other', label: 'Khác' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bảng hiển thị danh sách tệp */}
          <div className="overflow-x-auto">
            {filteredAttachments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Không tìm thấy tài liệu đính kèm nào phù hợp.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Tài liệu</th>
                    <th className="py-3.5 px-4">Loại</th>
                    <th className="py-3.5 px-4">Người tải lên</th>
                    <th className="py-3.5 px-4">Thời điểm</th>
                    <th className="py-3.5 px-4">Quyền truy cập</th>
                    <th className="py-3.5 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredAttachments.map((file) => {
                    const userCanDownload = canDownload(file);
                    return (
                      <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Tên & Kích thước */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 truncate max-w-xs">{file.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                        </td>

                        {/* Phân loại */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            file.category === 'Bid' 
                              ? 'bg-purple-50 text-purple-700 border-purple-200' 
                              : file.category === 'Meeting'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {file.category === 'Bid' ? 'Hồ sơ thầu' : file.category === 'Meeting' ? 'Biên bản họp' : 'Khác'}
                          </span>
                        </td>

                        {/* Người tải lên */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={file.uploadedBy.avatar} 
                              alt={file.uploadedBy.name} 
                              className="w-7 h-7 rounded-full object-cover border border-slate-200" 
                            />
                            <span className="text-xs font-medium text-slate-700">{file.uploadedBy.name}</span>
                          </div>
                        </td>

                        {/* Thời điểm */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(file.uploadedAt)}</span>
                          </div>
                        </td>

                        {/* Phân quyền */}
                        <td className="py-4 px-4">
                          {file.isPublic ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <Globe className="w-3.5 h-3.5" /> Được chia sẻ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                              <Lock className="w-3.5 h-3.5 text-slate-400" /> Chỉ người sở hữu
                            </span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Xem trước */}
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem trước"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Tải xuống */}
                            {userCanDownload ? (
                              <a
                                href={file.url}
                                download={file.name}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                                title="Tải xuống"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            ) : (
                              <button
                                disabled
                                className="p-1.5 text-slate-300 cursor-not-allowed"
                                title="Bạn không có quyền tải tệp này"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            )}

                            {/* Xóa tệp (Chỉ người tạo mới được xóa) */}
                            {file.uploadedBy.id === activeUser.id && (
                              <button
                                onClick={() => handleDelete(file.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa tệp"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Modal Preview File */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">{previewFile.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(previewFile.size)}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Phân loại:</span>
                <span className="font-semibold text-slate-700">{previewFile.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Người tải lên:</span>
                <span className="font-semibold text-slate-700">{previewFile.uploadedBy.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian:</span>
                <span className="font-semibold text-slate-700">{formatDate(previewFile.uploadedAt)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPreviewFile(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Đóng
              </button>
              {canDownload(previewFile) && (
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Tải xuống
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}