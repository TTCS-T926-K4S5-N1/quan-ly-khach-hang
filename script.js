// CẤU HÌNH GIAI ĐOẠN PIPELINE & NGƯỠNG BỊ TẮC (TÍNH THEO NGÀY)
const STAGES = [
  { id: 'LEAD', name: '1. Mới nhận (Lead)', winRate: 0.1, maxDaysAllowed: 3 },
  { id: 'QUALIFIED', name: '2. Xác định nhu cầu', winRate: 0.3, maxDaysAllowed: 5 },
  { id: 'PROPOSAL', name: '3. Gửi báo giá / Demo', winRate: 0.5, maxDaysAllowed: 7 },
  { id: 'NEGOTIATION', name: '4. Đàm phán HD', winRate: 0.8, maxDaysAllowed: 10 },
  { id: 'WON', name: '5. Thành công (Won)', winRate: 1.0, maxDaysAllowed: 999 },
  { id: 'LOST', name: '6. Thất bại (Lost)', winRate: 0.0, maxDaysAllowed: 999 }
];

// DỮ LIỆU MẪU BAN ĐẦU
const INITIAL_DEALS = [
  {
    id: 'deal-1',
    title: 'Triển khai ERP cho Chuỗi Cafe',
    customer: 'Công ty Highlands',
    phone: '0988123456',
    value: 120000000,
    stage: 'NEGOTIATION',
    priority: 'HIGH',
    lastActivity: getPastDate(12), // Đã 12 ngày không chăm -> TẮC (>10 ngày)
    nextStep: 'Trình Sếp duyệt giảm giá 5%',
    notes: 'Khách yêu cầu chiết khấu thêm.'
  },
  {
    id: 'deal-2',
    title: 'Mua 50 License Phần mềm CRM',
    customer: 'Tập đoàn BK-Group',
    phone: '0912345678',
    value: 45000000,
    stage: 'PROPOSAL',
    priority: 'HIGH',
    lastActivity: getPastDate(9), // Đã 9 ngày -> TẮC (>7 ngày)
    nextStep: 'Gửi lại báo giá điều chỉnh',
    notes: 'Đã demo xong hôm tuần trước.'
  },
  {
    id: 'deal-3',
    title: 'Nâng cấp Hạ tầng Cloud',
    customer: 'Công ty Logistics VN',
    phone: '0903999888',
    value: 80000000,
    stage: 'QUALIFIED',
    priority: 'MEDIUM',
    lastActivity: getPastDate(2), // 2 ngày -> Bình thường
    nextStep: 'Họp khảo sát kỹ thuật',
    notes: 'Khách cần mở rộng Server.'
  },
  {
    id: 'deal-4',
    title: 'Gói tư vấn Chuyển đổi số',
    customer: 'Nhà máy Minh Phát',
    phone: '0977112233',
    value: 200000000,
    stage: 'WON',
    priority: 'HIGH',
    lastActivity: getPastDate(1),
    nextStep: 'Bàn giao hợp đồng & Xuất hóa đơn',
    notes: 'Đã ký hợp đồng chính thức.'
  }
];

// Hàm hỗ trợ tạo ngày trong quá khứ
function getPastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// STATE CỦA ỨNG DỤNG
let deals = JSON.parse(localStorage.getItem('crm_deals')) || INITIAL_DEALS;
let filterSearch = '';
let filterPriority = 'ALL';
let filterOnlyStuck = false;
let draggedDealId = null;

// DOM ELEMENTS
const boardEl = document.getElementById('kanban-board');
const modalEl = document.getElementById('deal-modal');
const dealForm = document.getElementById('deal-form');

// KHỞI TẠOỨNG DỤNG
document.addEventListener('DOMContentLoaded', () => {
  renderBoard();
  updateStats();
  setupEventListeners();
});

// THIẾT LẬP LẮNG NGHE SỰ KIỆN
function setupEventListeners() {
  // Tìm kiếm & Lọc
  document.getElementById('input-search').addEventListener('input', (e) => {
    filterSearch = e.target.value.toLowerCase();
    renderBoard();
  });

  document.getElementById('filter-priority').addEventListener('change', (e) => {
    filterPriority = e.target.value;
    renderBoard();
  });

  const btnStuck = document.getElementById('btn-toggle-stuck');
  btnStuck.addEventListener('click', () => {
    filterOnlyStuck = !filterOnlyStuck;
    btnStuck.classList.toggle('active', filterOnlyStuck);
    renderBoard();
  });

  // Modal
  document.getElementById('btn-add-deal').addEventListener('click', () => openModal());
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  dealForm.addEventListener('submit', handleFormSubmit);

  // Reset Data
  document.getElementById('btn-demo-data').addEventListener('click', () => {
    if (confirm('Khôi phục về dữ liệu mẫu ban đầu?')) {
      deals = [...INITIAL_DEALS];
      saveAndRefresh();
    }
  });
}

// LƯU VÀO LOCALSTORAGE VÀ LÀM MỚI giao diện
function saveAndRefresh() {
  localStorage.setItem('crm_deals', JSON.stringify(deals));
  renderBoard();
  updateStats();
}

// TÍNH TOÁN DEAL CÓ BỊ TẮC KHÔNG
function isDealStuck(deal) {
  if (deal.stage === 'WON' || deal.stage === 'LOST') return false;
  const stageInfo = STAGES.find(s => s.id === deal.stage);
  if (!stageInfo) return false;

  const lastAct = new Date(deal.lastActivity);
  const today = new Date();
  const diffTime = Math.abs(today - lastAct);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > stageInfo.maxDaysAllowed;
}

// LẤY SỐ NGÀY CHỜ SỬA ĐỔI
function getDaysInactive(lastActivityDate) {
  const lastAct = new Date(lastActivityDate);
  const today = new Date();
  const diffTime = Math.abs(today - lastAct);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// RENDER BẢNG KANBAN
function renderBoard() {
  boardEl.innerHTML = '';

  STAGES.forEach(stage => {
    // Lọc deal thuộc stage & bộ lọc tìm kiếm
    const stageDeals = deals.filter(d => {
      if (d.stage !== stage.id) return false;

      // Filter search
      const matchSearch = d.title.toLowerCase().includes(filterSearch) ||
                          d.customer.toLowerCase().includes(filterSearch) ||
                          (d.phone && d.phone.includes(filterSearch));

      // Filter priority
      const matchPriority = filterPriority === 'ALL' || d.priority === filterPriority;

      // Filter stuck
      const matchStuck = !filterOnlyStuck || isDealStuck(d);

      return matchSearch && matchPriority && matchStuck;
    });

    const totalVal = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);

    // Tạo HTML Cột
    const colEl = document.createElement('div');
    colEl.className = `kanban-col col-${stage.id.toLowerCase()}`;
    colEl.dataset.stage = stage.id;

    colEl.innerHTML = `
      <div class="col-header">
        <div class="col-header-info">
          <span>${stage.name}</span>
          <span class="col-count">${stageDeals.length}</span>
        </div>
        <div class="col-total">${formatCurrency(totalVal)}</div>
      </div>
      <div class="col-body" data-stage="${stage.id}"></div>
    `;

    const colBody = colEl.querySelector('.col-body');

    // Thẻ Drag Over events
    colBody.addEventListener('dragover', (e) => {
      e.preventDefault();
      colBody.classList.add('drag-over');
    });

    colBody.addEventListener('dragleave', () => {
      colBody.classList.remove('drag-over');
    });

    colBody.addEventListener('drop', (e) => {
      e.preventDefault();
      colBody.classList.remove('drag-over');
      if (draggedDealId) {
        moveDealStage(draggedDealId, stage.id);
      }
    });

    // Render từng Deal Card
    stageDeals.forEach(deal => {
      const stuck = isDealStuck(deal);
      const days = getDaysInactive(deal.lastActivity);

      const cardEl = document.createElement('div');
      cardEl.className = `deal-card ${stuck ? 'is-stuck' : ''}`;
      cardEl.draggable = true;
      cardEl.dataset.id = deal.id;

      cardEl.innerHTML = `
        ${stuck ? `<div class="stuck-badge"><i class="fa-solid fa-triangle-exclamation"></i> TẮC (${days} ngày chưa chăm)</div>` : ''}
        <div class="deal-title">${escapeHtml(deal.title)}</div>
        <div class="deal-customer"><i class="fa-solid fa-building"></i> ${escapeHtml(deal.customer)} ${deal.phone ? '• ' + deal.phone : ''}</div>
        <div class="deal-value">${formatCurrency(deal.value)}</div>
        ${deal.nextStep ? `<div class="deal-next-step"><strong>Tiếp theo:</strong> ${escapeHtml(deal.nextStep)}</div>` : ''}
        
        <div class="deal-footer">
          <span class="days-count ${stuck ? 'warning' : ''}">
            <i class="fa-regular fa-clock"></i> ${days === 0 ? 'Hôm nay' : days + ' ngày trước'}
          </span>
          <span class="priority-badge priority-${deal.priority}">${deal.priority}</span>
        </div>

        <div class="card-actions">
          <button class="btn-icon" onclick="touchDeal('${deal.id}')" title="Cập nhật tương tác hôm nay">
            <i class="fa-solid fa-check"></i>
          </button>
          <button class="btn-icon" onclick="openModal('${deal.id}')" title="Sửa">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon delete" onclick="deleteDeal('${deal.id}')" title="Xóa">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;

      // Drag Events
      cardEl.addEventListener('dragstart', () => {
        draggedDealId = deal.id;
        cardEl.classList.add('dragging');
      });

      cardEl.addEventListener('dragend', () => {
        draggedDealId = null;
        cardEl.classList.remove('dragging');
      });

      colBody.appendChild(cardEl);
    });

    boardEl.appendChild(colEl);
  });
}

// CẬP NHẬT GIAI ĐOẠN KHI KÉO THẢ
function moveDealStage(dealId, newStage) {
  const deal = deals.find(d => d.id === dealId);
  if (deal && deal.stage !== newStage) {
    deal.stage = newStage;
    deal.lastActivity = new Date().toISOString().split('T')[0]; // Reset ngày tương tác khi chuyển stage
    saveAndRefresh();
  }
}

// CẬP NHẬT NHANH TƯƠNG TÁC
window.touchDeal = function(id) {
  const deal = deals.find(d => d.id === id);
  if (deal) {
    deal.lastActivity = new Date().toISOString().split('T')[0];
    saveAndRefresh();
  }
};

// XÓA DEAL
window.deleteDeal = function(id) {
  if (confirm('Bạn có chắc chắn muốn xóa cơ hội bán hàng này?')) {
    deals = deals.filter(d => d.id !== id);
    saveAndRefresh();
  }
};

// MỞ MODAL THÊM / SỬA
window.openModal = function(id = null) {
  dealForm.reset();
  document.getElementById('field-deal-id').value = '';
  document.getElementById('field-last-activity').value = new Date().toISOString().split('T')[0];

  if (id) {
    const deal = deals.find(d => d.id === id);
    if (deal) {
      document.getElementById('modal-title').innerText = 'Chỉnh Sửa Cơ Hội Bán Hàng';
      document.getElementById('field-deal-id').value = deal.id;
      document.getElementById('field-title').value = deal.title;
      document.getElementById('field-customer').value = deal.customer;
      document.getElementById('field-phone').value = deal.phone || '';
      document.getElementById('field-value').value = deal.value;
      document.getElementById('field-stage').value = deal.stage;
      document.getElementById('field-priority').value = deal.priority;
      document.getElementById('field-last-activity').value = deal.lastActivity;
      document.getElementById('field-next-step').value = deal.nextStep || '';
      document.getElementById('field-notes').value = deal.notes || '';
    }
  } else {
    document.getElementById('modal-title').innerText = 'Thêm Cơ Hội Bán Hàng Mới';
  }

  modalEl.classList.add('open');
};

function closeModal() {
  modalEl.classList.remove('open');
}

// XỬ LÝ SUBMIT FORM
function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('field-deal-id').value;
  const dealData = {
    id: id || 'deal-' + Date.now(),
    title: document.getElementById('field-title').value,
    customer: document.getElementById('field-customer').value,
    phone: document.getElementById('field-phone').value,
    value: parseFloat(document.getElementById('field-value').value) || 0,
    stage: document.getElementById('field-stage').value,
    priority: document.getElementById('field-priority').value,
    lastActivity: document.getElementById('field-last-activity').value,
    nextStep: document.getElementById('field-next-step').value,
    notes: document.getElementById('field-notes').value
  };

  if (id) {
    const index = deals.findIndex(d => d.id === id);
    if (index !== -1) deals[index] = dealData;
  } else {
    deals.unshift(dealData);
  }

  closeModal();
  saveAndRefresh();
}

// CẬP NHẬT THỐNG KÊ DASHBOARD
function updateStats() {
  let totalVal = 0;
  let weightedVal = 0;
  let stuckCount = 0;
  let wonCount = 0;
  let totalClosed = 0;

  deals.forEach(d => {
    if (d.stage !== 'LOST') {
      totalVal += Number(d.value);
    }

    const stageInfo = STAGES.find(s => s.id === d.stage);
    if (stageInfo) {
      weightedVal += Number(d.value) * stageInfo.winRate;
    }

    if (isDealStuck(d)) {
      stuckCount++;
    }

    if (d.stage === 'WON') wonCount++;
    if (d.stage === 'WON' || d.stage === 'LOST') totalClosed++;
  });

  const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

  document.getElementById('stat-total-val').innerText = formatCurrency(totalVal);
  document.getElementById('stat-weighted-val').innerText = formatCurrency(weightedVal);
  document.getElementById('stat-stuck-count').innerText = `${stuckCount} Deal`;
  document.getElementById('stat-win-rate').innerText = `${winRate}%`;
}

// UTILS
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function escapeHtml(str) {
  return str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
}