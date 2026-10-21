// Preset product packages
const PRESETS = {
    "1": [
        { name: "Phần mềm Quản lý Khách hàng CRM Cloud", unit: "Gói", qty: 1, price: 100000000 },
        { name: "Dịch vụ Khởi tạo & Tùy chỉnh Quy trình", unit: "Dịch vụ", qty: 1, price: 20000000 }
    ],
    "2": [
        { name: "Thiết kế Website Doanh nghiệp Chuẩn SEO", unit: "Website", qty: 1, price: 35000000 },
        { name: "Hosting High-speed + SSL 1 năm", unit: "Năm", qty: 1, price: 10000000 }
    ],
    "3": [
        { name: "Dịch vụ Bảo trì Server & Mạng 12 tháng", unit: "Gói", qty: 1, price: 24000000 }
    ]
};

// Mock Quotations Initial Data
let quotes = [
    {
        id: "BG-2023-01",
        customer: "Công ty TNHH Sản Xuất Minh An",
        contact: "Anh Hoàng - Giám đốc IT",
        email: "hoang@minhan.vn",
        date: "2023-10-24 08:30",
        discountPercent: 5,
        items: PRESETS["1"],
        // Tracking fields
        status: "ACCEPTED", // SENT, VIEWED, ACCEPTED, REJECTED
        viewsCount: 3,
        lastViewedTime: "2023-10-24 10:15",
        customerFeedback: "Đã đồng ý báo giá. Đề nghị gửi hợp đồng mẫu qua email."
    },
    {
        id: "BG-2023-02",
        customer: "Tập đoàn Bất động sản Tân Thời",
        contact: "Chị Ngọc - Trưởng phòng Mua hàng",
        email: "ngoc.pt@tanthoi.com",
        date: "2023-10-24 09:10",
        discountPercent: 0,
        items: PRESETS["2"],
        status: "VIEWED",
        viewsCount: 1,
        lastViewedTime: "2023-10-24 09:45",
        customerFeedback: ""
    },
    {
        id: "BG-2023-03",
        customer: "Chuỗi Cửa hàng Thời trang Chic",
        contact: "Anh Tuấn - CEO",
        email: "tuan@chic.vn",
        date: "2023-10-24 10:00",
        discountPercent: 10,
        items: PRESETS["3"],
        status: "SENT",
        viewsCount: 0,
        lastViewedTime: "Chưa mở link",
        customerFeedback: ""
    }
];

let currentFilter = "ALL";
let activeCustomerQuoteId = "BG-2023-01";

// Currency Formatter
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Calculate Quote Totals
function calculateQuoteTotal(quote) {
    let subtotal = quote.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    let discount = subtotal * (quote.discountPercent / 100);
    let vat = (subtotal - discount) * 0.1;
    let total = (subtotal - discount) + vat;
    return { subtotal, discount, vat, total };
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderSalesTable();
    populateCustomerSelector();
    loadCustomerQuoteView(activeCustomerQuoteId);
});

// Switch Portals (Sales Dashboard <-> Customer View)
function switchPortal(portalType) {
    const salesTab = document.getElementById('tab-sales');
    const custTab = document.getElementById('tab-customer');
    const salesPortal = document.getElementById('sales-portal');
    const custPortal = document.getElementById('customer-portal');

    if (portalType === 'SALES') {
        salesTab.className = "px-4 py-1.5 text-xs font-bold rounded-lg transition bg-blue-600 text-white shadow-sm";
        custTab.className = "px-4 py-1.5 text-xs font-bold rounded-lg transition text-slate-300 hover:text-white";
        salesPortal.classList.remove('hidden');
        custPortal.classList.add('hidden');
    } else {
        custTab.className = "px-4 py-1.5 text-xs font-bold rounded-lg transition bg-blue-600 text-white shadow-sm";
        salesTab.className = "px-4 py-1.5 text-xs font-bold rounded-lg transition text-slate-300 hover:text-white";
        custPortal.classList.remove('hidden');
        salesPortal.classList.add('hidden');

        // Simulate customer viewing link
        simulateCustomerOpenLink(activeCustomerQuoteId);
    }
}

// Render Table Data in Sales View
function renderSalesTable() {
    const tbody = document.getElementById('quotes-table-body');
    tbody.innerHTML = '';

    let filtered = quotes.filter(q => (currentFilter === 'ALL') || (q.status === currentFilter));

    filtered.forEach(q => {
        const totals = calculateQuoteTotal(q);
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";

        let statusBadge = '';
        if (q.status === 'SENT') {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200"><i class="fa-solid fa-paper-plane text-slate-400"></i> Chưa mở xem</span>`;
        } else if (q.status === 'VIEWED') {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200"><i class="fa-solid fa-eye text-amber-600"></i> Đã mở xem (${q.viewsCount} lần)</span>`;
        } else if (q.status === 'ACCEPTED') {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><i class="fa-solid fa-check-circle text-emerald-600"></i> Đã Chấp Nhận</span>`;
        } else if (q.status === 'REJECTED') {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200"><i class="fa-solid fa-comment-dots text-rose-600"></i> Yêu cầu điều chỉnh</span>`;
        }

        const shareLink = `https://quotetrack.app/view/${q.id.toLowerCase()}`;

        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="font-bold text-slate-900">${q.customer}</div>
                <div class="text-xs text-slate-400 font-mono mt-0.5">${q.id} • ${q.contact}</div>
            </td>
            <td class="px-6 py-4 font-bold text-slate-800">${formatVND(totals.total)}</td>
            <td class="px-6 py-4 text-center">${statusBadge}</td>
            <td class="px-6 py-4 text-center text-xs text-slate-500">${q.lastViewedTime}</td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <input type="text" readonly value="${shareLink}" class="bg-slate-50 border border-slate-200 text-slate-500 text-xs px-2 py-1 rounded font-mono w-40 truncate">
                    <button onclick="copyShareLink('${shareLink}')" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200 font-medium">
                        <i class="fa-regular fa-copy"></i> Copy
                    </button>
                </div>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="previewCustomerLink('${q.id}')" class="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-lg text-xs font-bold transition">
                    <i class="fa-solid fa-arrow-up-right-from-square mr-1"></i> Xem góc Khách
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateSalesStats();
}

// Update Top Metric Counters
function updateSalesStats() {
    document.getElementById('stat-total').innerText = quotes.length;
    document.getElementById('stat-viewed').innerText = quotes.filter(q => q.status === 'VIEWED').length;
    document.getElementById('stat-accepted').innerText = quotes.filter(q => q.status === 'ACCEPTED').length;
    document.getElementById('stat-rejected').innerText = quotes.filter(q => q.status === 'REJECTED').length;
}

// Copy Shareable Link
function copyShareLink(link) {
    navigator.clipboard.writeText(link);
    alert("Đã sao chép liên kết báo giá! Bạn có thể dán (Paste) để gửi cho khách qua Zalo hoặc Email.");
}

// Filter Status
function setFilter(filterType) {
    currentFilter = filterType;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = "filter-btn px-4 py-2 rounded-lg text-sm font-medium transition bg-slate-100 text-slate-600 hover:bg-slate-200";
    });
    document.getElementById(`btn-f-${filterType}`).className = "filter-btn px-4 py-2 rounded-lg text-sm font-medium transition bg-slate-900 text-white";
    renderSalesTable();
}

// View Link as Customer
function previewCustomerLink(quoteId) {
    activeCustomerQuoteId = quoteId;
    document.getElementById('customer-quote-selector').value = quoteId;
    loadCustomerQuoteView(quoteId);
    switchPortal('CUSTOMER');
}

// Simulate customer opening link
function simulateCustomerOpenLink(quoteId) {
    const q = quotes.find(item => item.id === quoteId);
    if (!q) return;

    if (q.status === 'SENT') {
        q.status = 'VIEWED';
    }
    q.viewsCount += 1;
    const now = new Date();
    q.lastViewedTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} Hôm nay`;

    renderSalesTable();
    loadCustomerQuoteView(quoteId);
}

// Populate customer view selector
function populateCustomerSelector() {
    const select = document.getElementById('customer-quote-selector');
    select.innerHTML = '';
    quotes.forEach(q => {
        const opt = document.createElement('option');
        opt.value = q.id;
        opt.innerText = `Đang chọn: ${q.id} - ${q.customer}`;
        select.appendChild(opt);
    });
}

// Load Quotation details into Customer View
function loadCustomerQuoteView(quoteId) {
    activeCustomerQuoteId = quoteId;
    const q = quotes.find(item => item.id === quoteId);
    if (!q) return;

    document.getElementById('cust-doc-id').innerText = q.id;
    document.getElementById('cust-doc-date').innerText = `Ngày gửi: ${q.date}`;
    document.getElementById('cust-doc-name').innerText = q.customer;
    document.getElementById('cust-doc-contact').innerText = `Người nhận: ${q.contact}`;
    document.getElementById('cust-doc-email').innerText = `Email: ${q.email}`;

    // Render Items
    const itemsTbody = document.getElementById('cust-doc-items');
    itemsTbody.innerHTML = '';
    q.items.forEach((idx, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-3 text-slate-400 font-mono">${i + 1}</td>
            <td class="p-3 font-semibold text-slate-800">${idx.name}</td>
            <td class="p-3 text-center">${idx.unit}</td>
            <td class="p-3 text-center font-bold">${idx.qty}</td>
            <td class="p-3 text-right">${formatVND(idx.price)}</td>
            <td class="p-3 text-right font-bold text-slate-800">${formatVND(idx.price * idx.qty)}</td>
        `;
        itemsTbody.appendChild(tr);
    });

    // Render Totals
    const totals = calculateQuoteTotal(q);
    document.getElementById('cust-doc-subtotal').innerText = formatVND(totals.subtotal);
    document.getElementById('cust-doc-discount').innerText = `-${formatVND(totals.discount)}`;
    document.getElementById('cust-doc-vat').innerText = formatVND(totals.vat);
    document.getElementById('cust-doc-total').innerText = formatVND(totals.total);

    // Status Tag in Action Area
    const tagBox = document.getElementById('cust-current-status-tag');
    if (q.status === 'ACCEPTED') {
        tagBox.innerHTML = `<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold"><i class="fa-solid fa-circle-check mr-1"></i> Quý khách đã chấp nhận báo giá này</span>`;
    } else if (q.status === 'REJECTED') {
        tagBox.innerHTML = `<span class="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-3 py-1 rounded-full font-bold"><i class="fa-solid fa-comment-dots mr-1"></i> Đã gửi yêu cầu chỉnh sửa</span>`;
    } else {
        tagBox.innerHTML = `<span class="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-bold"><i class="fa-solid fa-clock mr-1"></i> Đang chờ phản hồi từ quý khách</span>`;
    }

    hideRejectInput();
}

// Customer Decision Action
function customerRespond(newStatus) {
    const q = quotes.find(item => item.id === activeCustomerQuoteId);
    if (!q) return;

    if (newStatus === 'REJECTED') {
        const reason = document.getElementById('cust-reason-input').value.trim();
        if (!reason) {
            alert("Vui lòng nhập nội dung cần điều chỉnh!");
            return;
        }
        q.customerFeedback = reason;
    }

    q.status = newStatus;
    alert(newStatus === 'ACCEPTED' 
        ? "Cảm ơn quý khách! Đã xác nhận CHẤP NHẬN BÁO GIÁ. Nhân viên phụ trách sẽ liên hệ hỗ trợ hợp đồng ngay." 
        : "Phản hồi của quý khách đã được gửi tới Nhân viên phụ trách!");

    loadCustomerQuoteView(activeCustomerQuoteId);
    renderSalesTable();
}

// Show / Hide Reject input field
function showRejectInput() {
    document.getElementById('reject-reason-box').classList.remove('hidden');
}

function hideRejectInput() {
    document.getElementById('reject-reason-box').classList.add('hidden');
}

// Handle Form Create New Quote
function handleCreateQuote(e) {
    e.preventDefault();
    const customer = document.getElementById('new-customer-name').value;
    const contact = document.getElementById('new-contact-person').value;
    const email = document.getElementById('new-contact-info').value;
    const presetId = document.getElementById('new-product-preset').value;
    const discount = parseFloat(document.getElementById('new-discount').value) || 0;

    const newId = `BG-2023-0${quotes.length + 1}`;
    const newQuote = {
        id: newId,
        customer,
        contact,
        email,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        discountPercent: discount,
        items: PRESETS[presetId],
        status: "SENT",
        viewsCount: 0,
        lastViewedTime: "Chưa mở link",
        customerFeedback: ""
    };

    quotes.unshift(newQuote);
    closeModal('modal-create');
    renderSalesTable();
    populateCustomerSelector();
    alert(`Đã tạo báo giá ${newId} thành công! Nhấp vào "Copy" để lấy liên kết gửi cho khách hàng.`);
}

// Modal Helpers
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }