// Data State cơ hội kinh doanh
let opportunity = {
  id: "OPP-2026-889",
  name: "Dự án Triển khai ERP - Tập đoàn ABC",
  amount: 1200000000,
  closeDate: "2026-11-15",
  stage: "Đang đàm phán",
  owner: "Trần Thị Sales"
};

// Dữ liệu Audit Logs ban đầu
let auditLogs = [
  {
    id: 1,
    timestamp: "2026-10-20 14:30",
    user: "Trần Thị Sales",
    field: "closeDate",
    fieldName: "Ngày chốt",
    oldValue: "2026-10-30",
    newValue: "2026-11-15",
    reason: "Khách hàng dời lịch họp Hội đồng quản trị sang giữa tháng 11 để duyệt ngân sách chính thức."
  },
  {
    id: 2,
    timestamp: "2026-10-15 09:15",
    user: "Trần Thị Sales",
    field: "amount",
    fieldName: "Giá trị",
    oldValue: "1.500.000.000 VNĐ",
    newValue: "1.200.000.000 VNĐ",
    reason: "Bỏ bớt phân hệ Quản lý Kho theo yêu cầu tối ưu chi phí giai đoạn 1 của KH."
  },
  {
    id: 3,
    timestamp: "2026-10-01 10:00",
    user: "Trần Thị Sales",
    field: "stage",
    fieldName: "Giai đoạn",
    oldValue: "Đề xuất giải pháp",
    newValue: "Đang đàm phán",
    reason: "Đã gửi Demo thành công, Khách hàng chốt báo giá và chuyển sang bước đàm phán điều khoản hợp đồng."
  }
];

// Helper: Format tiền tệ VNĐ
function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

// Helper: Format hiển thị ngày DD/MM/YYYY
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

// Cập nhật thông tin chính lên UI
function updateUI() {
  document.getElementById('opp-amount-display').innerText = formatCurrency(opportunity.amount);
  document.getElementById('opp-date-display').innerText = formatDate(opportunity.closeDate);
  document.getElementById('opp-stage-badge').innerText = opportunity.stage;
  renderAuditLog();
}

// Render danh sách Timeline Lịch sử thay đổi
function renderAuditLog() {
  const container = document.getElementById('timeline-container');
  const filter = document.getElementById('filter-type').value;
  container.innerHTML = '';

  const filteredLogs = filter === 'ALL' ? auditLogs : auditLogs.filter(log => log.field === filter);
  document.getElementById('log-count').innerText = `${filteredLogs.length} thay đổi`;

  if (filteredLogs.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 italic pl-4 py-2">Không có lịch sử cho bộ lọc này.</p>`;
    return;
  }

  filteredLogs.forEach(log => {
    let badgeColor = "bg-blue-100 text-blue-800";
    let icon = "fa-pen";

    if (log.field === 'amount') {
      badgeColor = "bg-emerald-100 text-emerald-800";
      icon = "fa-dollar-sign";
    } else if (log.field === 'closeDate') {
      badgeColor = "bg-amber-100 text-amber-800";
      icon = "fa-calendar-days";
    } else if (log.field === 'stage') {
      badgeColor = "bg-purple-100 text-purple-800";
      icon = "fa-diagram-project";
    }

    const logItem = document.createElement('div');
    logItem.className = 'relative pl-6 group';
    logItem.innerHTML = `
      <span class="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center text-[10px] text-blue-600 shadow-sm">
        <i class="fa-solid ${icon}"></i>
      </span>

      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition">
        <div class="flex justify-between items-start gap-2 mb-1">
          <span class="text-xs font-semibold ${badgeColor} px-2 py-0.5 rounded">
            Thay đổi ${log.fieldName}
          </span>
          <span class="text-[11px] text-slate-400"><i class="fa-regular fa-clock me-1"></i>${log.timestamp}</span>
        </div>

        <div class="text-xs text-slate-700 my-2 space-y-1 bg-white p-2 rounded border border-slate-100">
          <div class="line-through text-slate-400">Cũ: <span class="font-medium">${log.oldValue}</span></div>
          <div class="text-slate-900 font-bold">Mới: <span class="text-blue-600">${log.newValue}</span></div>
        </div>

        <div class="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200/60">
          <span class="font-semibold text-slate-800"><i class="fa-solid fa-comment-dots text-slate-400 me-1"></i>Lý do:</span> 
          <span class="italic text-slate-700 font-medium">"${log.reason}"</span>
        </div>

        <div class="text-[10px] text-slate-400 mt-2 text-right">
          Bởi: <span class="font-medium text-slate-600">${log.user}</span>
        </div>
      </div>
    `;
    container.appendChild(logItem);
  });
}

// Toggle đòng/mở Modal
function toggleEditModal() {
  const modal = document.getElementById('edit-modal');
  modal.classList.toggle('hidden');

  if (!modal.classList.contains('hidden')) {
    document.getElementById('input-amount').value = opportunity.amount;
    document.getElementById('input-date').value = opportunity.closeDate;
    document.getElementById('input-stage').value = opportunity.stage;
    document.getElementById('input-reason').value = '';
  }
}

// Xử lý submit Form cập nhật
function handleFormSubmit(e) {
  e.preventDefault();

  const newAmount = parseFloat(document.getElementById('input-amount').value);
  const newDate = document.getElementById('input-date').value;
  const newStage = document.getElementById('input-stage').value;
  const reason = document.getElementById('input-reason').value.trim();

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Kiểm tra & lưu log đổi Giá trị
  if (newAmount !== opportunity.amount) {
    auditLogs.unshift({
      id: Date.now() + 1,
      timestamp: timestamp,
      user: opportunity.owner,
      field: "amount",
      fieldName: "Giá trị",
      oldValue: formatCurrency(opportunity.amount),
      newValue: formatCurrency(newAmount),
      reason: reason
    });
    opportunity.amount = newAmount;
  }

  // Kiểm tra & lưu log đổi Ngày chốt
  if (newDate !== opportunity.closeDate) {
    auditLogs.unshift({
      id: Date.now() + 2,
      timestamp: timestamp,
      user: opportunity.owner,
      field: "closeDate",
      fieldName: "Ngày chốt",
      oldValue: formatDate(opportunity.closeDate),
      newValue: formatDate(newDate),
      reason: reason
    });
    opportunity.closeDate = newDate;
  }

  // Kiểm tra & lưu log đổi Giai đoạn
  if (newStage !== opportunity.stage) {
    auditLogs.unshift({
      id: Date.now() + 3,
      timestamp: timestamp,
      user: opportunity.owner,
      field: "stage",
      fieldName: "Giai đoạn",
      oldValue: opportunity.stage,
      newValue: newStage,
      reason: reason
    });
    opportunity.stage = newStage;
  }

  updateUI();
  toggleEditModal();
}

// Gắn các Event Listeners khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
  // Gắn sự kiện click nút
  document.getElementById('btn-open-edit').addEventListener('click', toggleEditModal);
  document.getElementById('btn-close-modal').addEventListener('click', toggleEditModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', toggleEditModal);

  // Gắn sự kiện submit form
  document.getElementById('edit-form').addEventListener('submit', handleFormSubmit);

  // Gắn sự kiện lọc loại log
  document.getElementById('filter-type').addEventListener('change', renderAuditLog);

  // Khởi chạy render ban đầu
  updateUI();
});