// Dữ liệu dòng thời gian tương tác thực tế (Hoàn toàn loại bỏ tên "Trần Thị Sales")
let timelineData = [
  {
    id: 1,
    type: "TICKET",
    title: "Ticket #TK-1029: Yêu cầu kết nối Hóa đơn MISA",
    timestamp: "2026-10-21 10:15",
    actor: "Nguyễn Hoàng Anh (Khách hàng)",
    handler: "Lê Minh Tâm (CSKH)",
    status: "Đang xử lý",
    content: "Khách gửi yêu cầu kết nối phần mềm Hóa đơn điện tử MISA Meinvoice vào hệ thống ERP Enterprise. Cần gấp để xuất hóa đơn trước cuối tuần.",
    statusBg: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: 2,
    type: "NOTE",
    title: "Ghi chú bàn giao tài khoản Khách hàng",
    timestamp: "2026-10-20 16:00",
    actor: "Nguyễn Thị Mai (Phòng Kinh Doanh)",
    handler: "Lê Minh Tâm (CSKH)",
    status: "Bàn giao",
    content: "Khách hàng vừa hoàn tất hợp đồng gia hạn 2 năm. Khách rất hài lòng với dịch vụ hỗ trợ năm ngoái. Lưu ý khách bận vào sáng thứ 2, nên gọi điện sau 14h chiều.",
    statusBg: "bg-slate-100 text-slate-700 border-slate-200"
  },
  {
    id: 3,
    type: "CONTRACT",
    title: "Gia hạn Hợp đồng ERP Enterprise - Năm thứ 2",
    timestamp: "2026-10-20 14:00",
    actor: "Phòng Hợp Đồng & Kế Toán",
    handler: "Nguyễn Hoàng Anh",
    status: "Thành công",
    content: "Ký kết thành công hợp đồng gia hạn trị giá 120.000.000 VNĐ (Thời hạn 12 tháng). Khách đã hoàn tất thanh toán 100%.",
    statusBg: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: 4,
    type: "CALL",
    title: "Cuộc gọi Outbound: Trao đổi điều khoản gia hạn",
    timestamp: "2026-10-15 09:30",
    actor: "Nguyễn Thị Mai (Phòng Kinh Doanh)",
    handler: "Nguyễn Hoàng Anh",
    status: "Hoàn thành",
    content: "Thời lượng cuộc gọi: 6 phút 20 giây. Khách đồng ý gia hạn gói ERP nhưng đề xuất hỗ trợ kết nối miễn phí phần mềm MISA.",
    statusBg: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: 5,
    type: "EMAIL",
    title: "Email Inbound: Báo lỗi lệch số liệu tồn kho",
    timestamp: "2026-09-05 11:20",
    actor: "Nguyễn Hoàng Anh",
    handler: "Đội Kỹ Thuật ERP",
    status: "Đã giải quyết",
    content: "Khách báo dữ liệu kho bị lệch. Kỹ thuật kiểm tra xác định do nhân viên khách hàng nhập sai định dạng tệp Excel. Đã hướng dẫn lại quy trình chuẩn.",
    statusBg: "bg-emerald-50 text-emerald-700 border-emerald-200"
  }
];

let currentFilter = 'ALL';

// Render danh sách Timeline
function renderTimeline() {
  const container = document.getElementById('timeline-container');
  container.innerHTML = '';

  const filteredData = currentFilter === 'ALL' 
    ? timelineData 
    : timelineData.filter(item => item.type === currentFilter);

  document.getElementById('activity-count').innerText = `${filteredData.length} hoạt động`;

  if (filteredData.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-xs italic">
        Không có hoạt động nào thuộc danh mục này.
      </div>
    `;
    return;
  }

  filteredData.forEach(item => {
    const el = document.createElement('div');
    el.className = 'relative pl-5 pb-4 group';

    el.innerHTML = `
      <!-- Mốc tròn màu xám trên timeline -->
      <span class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white ring-1 ring-slate-200"></span>

      <div class="bg-white border border-slate-200 rounded p-3 text-xs hover:border-slate-300 transition">
        <!-- Header Item -->
        <div class="flex flex-wrap justify-between items-start gap-2 mb-1.5">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
              ${getLabelByType(item.type)}
            </span>
            <h4 class="font-semibold text-slate-900">${item.title}</h4>
          </div>
          <span class="text-[10px] text-slate-400 font-mono"><i class="fa-regular fa-clock me-1"></i>${item.timestamp}</span>
        </div>

        <!-- Nội dung -->
        <p class="text-slate-600 leading-relaxed my-2 bg-slate-50 p-2 rounded border border-slate-100">
          ${item.content}
        </p>

        <!-- Footer Item -->
        <div class="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
          <div>
            Tạo bởi: <span class="text-slate-600 font-medium">${item.actor}</span>
            ${item.handler ? ` | Người xử lý: <span class="text-indigo-600 font-medium">${item.handler}</span>` : ''}
          </div>
          <span class="px-1.5 py-0.5 rounded border ${item.statusBg}">${item.status}</span>
        </div>
      </div>
    `;

    container.appendChild(el);
  });
}

// Chuyển mã Type thành chữ Tiếng Việt
function getLabelByType(type) {
  switch (type) {
    case 'CALL': return 'CUỘC GỌI';
    case 'EMAIL': return 'EMAIL';
    case 'TICKET': return 'TICKET';
    case 'NOTE': return 'GHI CHÚ';
    case 'CONTRACT': return 'HỢP ĐỒNG';
    default: return 'HOẠT ĐỘNG';
  }
}

// Toggle đóng mở Modal
function toggleModal() {
  const modal = document.getElementById('log-modal');
  modal.classList.toggle('hidden');
  if (!modal.classList.contains('hidden')) {
    document.getElementById('log-form').reset();
  }
}

// Thêm tương tác mới
function handleAddLog(e) {
  e.preventDefault();

  const type = document.getElementById('input-type').value;
  const title = document.getElementById('input-title').value.trim();
  const content = document.getElementById('input-content').value.trim();
  const status = document.getElementById('input-status').value;

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let statusBg = "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "Hoàn thành") statusBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Đang xử lý") statusBg = "bg-amber-50 text-amber-700 border-amber-200";

  const newLog = {
    id: Date.now(),
    type: type,
    title: title,
    timestamp: timestamp,
    actor: "Lê Minh Tâm (CSKH)",
    handler: "Lê Minh Tâm",
    status: status,
    content: content,
    statusBg: statusBg
  };

  timelineData.unshift(newLog);
  renderTimeline();
  toggleModal();
}

// Gắn các sự kiện khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
  // Gắn bộ lọc
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentFilter = e.currentTarget.getAttribute('data-type');
      renderTimeline();
    });
  });

  // Modal events
  document.getElementById('btn-open-log').addEventListener('click', toggleModal);
  document.getElementById('btn-close-modal').addEventListener('click', toggleModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', toggleModal);
  document.getElementById('log-form').addEventListener('submit', handleAddLog);

  // Render khởi tạo
  renderTimeline();
});