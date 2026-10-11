// Biến lưu trữ dữ liệu State
let leadsData = [
  {
    id: "LEAD-101",
    name: "Phạm Minh Anh",
    email: "minhanh.pham@techcorp.vn",
    phone: "0912345678",
    company: "TechCorp Vietnam",
    title: "Giám đốc Công nghệ",
    source: "Hội thảo Software Expo 2026",
    status: "New",
    created: "2026-10-10",
    notes: "Gặp tại gian hàng triển lãm. Quan tâm giải pháp CRM cho 50 nhân viên."
  },
  {
    id: "LEAD-102",
    name: "Trần Hoàng Nam",
    email: "nam.tran@innovate.io",
    phone: "0987654321",
    company: "Innovate Solutions",
    title: "Trưởng phòng Marketing",
    source: "Hội thảo Software Expo 2026",
    status: "Contacted",
    created: "2026-10-10",
    notes: "Đã gửi mail báo giá lần 1. Hẹn gọi lại vào đầu tuần sau."
  },
  {
    id: "LEAD-103",
    name: "Lê Thị Thu Thảo",
    email: "thao.le@greenlogistics.com",
    phone: "0903112233",
    company: "Green Logistics",
    title: "Trưởng phòng Nhân sự",
    source: "Sự kiện B2B Networking",
    status: "Qualified",
    created: "2026-10-09",
    notes: "Nhu cầu rất rõ ràng. Cần triển khai trong quý IV."
  }
];

let selectedLeadId = null;
let parsedImportData = [];

// Khởi chạy ứng dụng
document.addEventListener("DOMContentLoaded", () => {
  renderTable(leadsData);
  updateStats();
});

// Render danh sách bảng Lead
function renderTable(data) {
  const tbody = document.getElementById("lead-table-body");
  const emptyState = document.getElementById("empty-state");
  tbody.innerHTML = "";

  if (data.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  } else {
    emptyState.classList.add("hidden");
  }

  data.forEach((lead) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-blue-50/50 transition cursor-pointer border-b border-gray-100";
    tr.onclick = (e) => {
      // Ngăn mở drawer nếu bấm nút xóa
      if (!e.target.closest('.no-drawer')) {
        openDrawer(lead.id);
      }
    };

    tr.innerHTML = `
      <td class="py-3.5 px-4 font-semibold text-xs text-blue-600">${lead.id}</td>
      <td class="py-3.5 px-4 font-medium text-gray-900">${lead.name}</td>
      <td class="py-3.5 px-4 text-xs">
        <div class="text-gray-900">${lead.email}</div>
        <div class="text-gray-500">${lead.phone}</div>
      </td>
      <td class="py-3.5 px-4 text-xs">
        <div class="font-medium text-gray-800">${lead.company || '--'}</div>
        <div class="text-gray-500">${lead.title || '--'}</div>
      </td>
      <td class="py-3.5 px-4 text-xs text-gray-600">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          ${lead.source}
        </span>
      </td>
      <td class="py-3.5 px-4">${getStatusBadge(lead.status)}</td>
      <td class="py-3.5 px-4 text-right no-drawer">
        <button onclick="deleteLead('${lead.id}')" title="Xóa" class="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-100 transition">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Hàm lấy Badge trạng thái
function getStatusBadge(status) {
  switch (status) {
    case 'New':
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Mới (New)</span>`;
    case 'Contacted':
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Đang liên hệ</span>`;
    case 'Qualified':
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Tiềm năng</span>`;
    case 'Unqualified':
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Chưa phù hợp</span>`;
    default:
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${status}</span>`;
  }
}

// Cập nhật số liệu thống kê
function updateStats() {
  document.getElementById("stat-total").innerText = leadsData.length;
  document.getElementById("stat-new").innerText = leadsData.filter(l => l.status === 'New').length;
  document.getElementById("stat-contacted").innerText = leadsData.filter(l => l.status === 'Contacted').length;
  document.getElementById("stat-qualified").innerText = leadsData.filter(l => l.status === 'Qualified').length;
}

// Lọc dữ liệu theo từ khóa và bộ lọc
function filterLeads() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const source = document.getElementById("filter-source").value;
  const status = document.getElementById("filter-status").value;

  const filtered = leadsData.filter(lead => {
    const matchQuery = lead.name.toLowerCase().includes(query) ||
                       lead.email.toLowerCase().includes(query) ||
                       lead.phone.includes(query) ||
                       lead.company.toLowerCase().includes(query);
    const matchSource = source === "" || lead.source === source;
    const matchStatus = status === "" || lead.status === status;

    return matchQuery && matchSource && matchStatus;
  });

  renderTable(filtered);
}

// Drawer Chi Tiết (Giao diện kiểu Jira Work Item)
function openDrawer(id) {
  const lead = leadsData.find(l => l.id === id);
  if (!lead) return;

  selectedLeadId = id;
  document.getElementById("drawer-key").innerText = lead.id;
  document.getElementById("drawer-title").innerText = lead.name;
  document.getElementById("drawer-subtitle").innerText = `${lead.title || 'Chưa rõ'} - ${lead.company || 'Chưa rõ'}`;
  document.getElementById("drawer-email").innerText = lead.email;
  document.getElementById("drawer-phone").innerText = lead.phone;
  document.getElementById("drawer-source").innerText = lead.source;
  document.getElementById("drawer-created").innerText = lead.created;
  document.getElementById("drawer-status-select").value = lead.status;
  document.getElementById("drawer-notes").value = lead.notes || "";

  document.getElementById("jira-drawer").classList.remove("translate-x-full");
}

function closeDrawer() {
  document.getElementById("jira-drawer").classList.add("translate-x-full");
  selectedLeadId = null;
}

function updateLeadStatus() {
  if (!selectedLeadId) return;
  const newStatus = document.getElementById("drawer-status-select").value;
  const lead = leadsData.find(l => l.id === selectedLeadId);
  if (lead) {
    lead.status = newStatus;
    renderTable(leadsData);
    updateStats();
    showToast("Đã cập nhật trạng thái Lead!");
  }
}

function updateLeadNotes() {
  if (!selectedLeadId) return;
  const newNotes = document.getElementById("drawer-notes").value;
  const lead = leadsData.find(l => l.id === selectedLeadId);
  if (lead) {
    lead.notes = newNotes;
    showToast("Đã lưu ghi chú!");
  }
}

function deleteLead(id) {
  if (confirm("Bạn có chắc chắn muốn xóa Lead này?")) {
    leadsData = leadsData.filter(l => l.id !== id);
    renderTable(leadsData);
    updateStats();
    if (selectedLeadId === id) closeDrawer();
    showToast("Đã xóa lead thành công!");
  }
}

// Modal Tạo Lead thủ công
function openCreateModal() {
  document.getElementById("create-modal").classList.remove("hidden");
  document.getElementById("create-modal").classList.add("flex");
}

function closeCreateModal() {
  document.getElementById("create-modal").classList.add("hidden");
  document.getElementById("create-modal").classList.remove("flex");
  document.getElementById("create-lead-form").reset();
}

function handleCreateLead(e) {
  e.preventDefault();
  const newLead = {
    id: `LEAD-${Math.floor(100 + Math.random() * 900)}`,
    name: document.getElementById("form-name").value,
    email: document.getElementById("form-email").value,
    phone: document.getElementById("form-phone").value,
    company: document.getElementById("form-company").value || "--",
    title: document.getElementById("form-title").value || "--",
    source: document.getElementById("form-source").value,
    status: "New",
    created: new Date().toISOString().split('T')[0],
    notes: document.getElementById("form-notes").value || ""
  };

  leadsData.unshift(newLead);
  renderTable(leadsData);
  updateStats();
  closeCreateModal();
  showToast("Thêm mới lead thành công!");
}

// Modal Import Excel
function openImportModal() {
  document.getElementById("import-modal").classList.remove("hidden");
  document.getElementById("import-modal").classList.add("flex");
}

function closeImportModal() {
  document.getElementById("import-modal").classList.add("hidden");
  document.getElementById("import-modal").classList.remove("flex");
  resetImport();
}

function resetImport() {
  parsedImportData = [];
  document.getElementById("excel-file-input").value = "";
  document.getElementById("drop-zone").classList.remove("hidden");
  document.getElementById("preview-container").classList.add("hidden");
  document.getElementById("btn-import-submit").disabled = true;
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    if (jsonData.length === 0) {
      alert("Tập tin Excel không có dữ liệu!");
      return;
    }

    // Map dữ liệu
    parsedImportData = jsonData.map((row, index) => ({
      id: `LEAD-${Math.floor(100 + Math.random() * 900)}`,
      name: row['Họ và tên'] || row['Name'] || `Khách hàng ${index + 1}`,
      email: row['Email'] || row['email'] || 'chua_co@gmail.com',
      phone: row['Số điện thoại'] || row['Phone'] || '0900000000',
      company: row['Công ty'] || row['Company'] || '--',
      title: row['Chức danh'] || row['Title'] || '--',
      source: row['Nguồn'] || 'Hội thảo Software Expo 2026',
      status: 'New',
      created: new Date().toISOString().split('T')[0],
      notes: row['Ghi chú'] || 'Nhập từ file Excel'
    }));

    // Hiển thị preview
    document.getElementById("drop-zone").classList.add("hidden");
    document.getElementById("preview-container").classList.remove("hidden");
    document.getElementById("preview-count").innerText = parsedImportData.length;

    const tbody = document.getElementById("preview-table-body");
    tbody.innerHTML = "";
    parsedImportData.slice(0, 5).forEach(item => {
      tbody.innerHTML += `
        <tr>
          <td class="p-2 border-b">${item.name}</td>
          <td class="p-2 border-b">${item.email}</td>
          <td class="p-2 border-b">${item.phone}</td>
          <td class="p-2 border-b">${item.company}</td>
        </tr>
      `;
    });

    document.getElementById("btn-import-submit").disabled = false;
  };
  reader.readAsArrayBuffer(file);
}

function confirmImport() {
  if (parsedImportData.length === 0) return;
  leadsData = [...parsedImportData, ...leadsData];
  renderTable(leadsData);
  updateStats();
  closeImportModal();
  showToast(`Đã nhập thành công ${parsedImportData.length} lead!`);
}

// Xuất file mẫu Excel
function downloadSampleExcel() {
  const sampleData = [
    { 'Họ và tên': 'Nguyễn Văn Minh', 'Email': 'minh.nguyen@example.com', 'Số điện thoại': '0912345678', 'Công ty': 'ABC Corp', 'Chức danh': 'Manager', 'Nguồn': 'Hội thảo Software Expo 2026', 'Ghi chú': 'Quan tâm sản phẩm A' },
    { 'Họ và tên': 'Trần Thị Hoa', 'Email': 'hoa.tran@example.com', 'Số điện thoại': '0987654321', 'Công ty': 'Global Tech', 'Chức danh': 'Director', 'Nguồn': 'Hội thảo Software Expo 2026', 'Ghi chú': 'Cần gửi báo giá' }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Lead Template");
  XLSX.writeFile(workbook, "Mau_Danh_Sach_Lead.xlsx");
}

// Xuất danh sách Lead hiện tại ra Excel
function exportToExcel() {
  const exportData = leadsData.map(l => ({
    'Mã Lead': l.id,
    'Họ và tên': l.name,
    'Email': l.email,
    'Số điện thoại': l.phone,
    'Công ty': l.company,
    'Chức danh': l.title,
    'Nguồn': l.source,
    'Trạng thái': l.status,
    'Ngày tạo': l.created,
    'Ghi chú': l.notes
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sach Lead");
  XLSX.writeFile(workbook, `Danh_Sach_Lead_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Thông báo Toast Notification
function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "bg-gray-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce";
  toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}