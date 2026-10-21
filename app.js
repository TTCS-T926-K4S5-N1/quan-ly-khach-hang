// System Rules Configuration
let CONFIG = {
    autoApproveDiscountMax: 5.0,  // <= 5% auto approve
    leadApproveDiscountMax: 15.0, // 5.1% - 15% Lead approve
    minGrossMargin: 10.0          // Below 10% gross margin auto-reject
};

// Product Catalog Database (Price & COGS)
const PRODUCTS_DB = {
    "1": { name: "Gói Phần mềm ERP Enterprise", listPrice: 200000000, cogs: 130000000 },
    "2": { name: "Máy chủ Dell PowerEdge R750", listPrice: 120000000, cogs: 90000000 },
    "3": { name: "Dịch vụ Bảo trì Hệ thống 1 năm", listPrice: 50000000, cogs: 25000000 }
};

// Initial Mock Quotes Data
let quotes = [
    {
        id: "BG-1001",
        customer: "Công ty Cổ phần Tập đoàn FLC",
        saleName: "Trần Văn Nam",
        date: "2023-10-24 09:30",
        discountPercent: 8.5,
        status: "PENDING", // PENDING, AUTO, APPROVED, REJECTED
        note: "",
        items: [
            { name: "Gói Phần mềm ERP Enterprise", qty: 1, listPrice: 200000000, cogs: 130000000 }
        ]
    },
    {
        id: "BG-1002",
        customer: "Tập đoàn Công nghệ Viễn thông BKAV",
        saleName: "Lê Thị Mai",
        date: "2023-10-24 10:15",
        discountPercent: 3.0,
        status: "AUTO",
        note: "Hệ thống tự động phê duyệt (Chiết khấu <= 5%)",
        items: [
            { name: "Máy chủ Dell PowerEdge R750", qty: 2, listPrice: 120000000, cogs: 90000000 }
        ]
    },
    {
        id: "BG-1003",
        customer: "Ngân hàng TMCP TPBank",
        saleName: "Hoàng Minh Tuấn",
        date: "2023-10-24 11:00",
        discountPercent: 12.0,
        status: "PENDING",
        note: "",
        items: [
            { name: "Dịch vụ Bảo trì Hệ thống 1 năm", qty: 4, listPrice: 50000000, cogs: 25000000 }
        ]
    },
    {
        id: "BG-1004",
        customer: "Công ty Bất động sản Vinhomes",
        saleName: "Phạm Quốc Bảo",
        date: "2023-10-23 16:45",
        discountPercent: 18.0,
        status: "REJECTED",
        note: "Tự động từ chối: Chiết khấu 18% vi phạm hạn mức tối đa.",
        items: [
            { name: "Máy chủ Dell PowerEdge R750", qty: 1, listPrice: 120000000, cogs: 90000000 }
        ]
    },
    {
        id: "BG-1005",
        customer: "Chuỗi Nhà thuốc Long Châu",
        saleName: "Trần Văn Nam",
        date: "2023-10-23 14:20",
        discountPercent: 7.0,
        status: "APPROVED",
        note: "Đã duyệt thủ công: Khách tiềm năng hợp đồng dài hạn.",
        items: [
            { name: "Gói Phần mềm ERP Enterprise", qty: 1, listPrice: 200000000, cogs: 130000000 }
        ]
    }
];

let currentFilter = "ALL";
let activeQuoteId = null;

// Utility: Format Currency to VND
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Financial calculations per quote
function getQuoteFinancials(quote) {
    let totalListPrice = 0;
    let totalCogs = 0;

    quote.items.forEach(item => {
        totalListPrice += item.listPrice * item.qty;
        totalCogs += item.cogs * item.qty;
    });

    const finalPrice = totalListPrice * (1 - quote.discountPercent / 100);
    const grossProfit = finalPrice - totalCogs;
    const grossMarginPercent = finalPrice > 0 ? (grossProfit / finalPrice) * 100 : 0;

    return { totalListPrice, totalCogs, finalPrice, grossProfit, grossMarginPercent };
}

// Initialize application on load
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    calculateNewQuote();
});

// Render table and refresh KPIs
function renderTable() {
    const tbody = document.getElementById('quote-table-body');
    const searchKeyword = document.getElementById('search-input').value.toLowerCase();
    tbody.innerHTML = '';

    let filtered = quotes.filter(q => {
        const matchesFilter = (currentFilter === 'ALL') || (q.status === currentFilter);
        const matchesSearch = q.customer.toLowerCase().includes(searchKeyword) || 
                              q.id.toLowerCase().includes(searchKeyword) ||
                              q.saleName.toLowerCase().includes(searchKeyword);
        return matchesFilter && matchesSearch;
    });

    document.getElementById('empty-state').classList.toggle('hidden', filtered.length > 0);

    filtered.forEach(q => {
        const fin = getQuoteFinancials(q);
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50 transition border-b border-slate-100";

        let marginColorClass = "text-emerald-600 bg-emerald-50 border-emerald-200";
        if (fin.grossMarginPercent < CONFIG.minGrossMargin) {
            marginColorClass = "text-rose-600 bg-rose-50 border-rose-200";
        } else if (fin.grossMarginPercent < 20) {
            marginColorClass = "text-amber-600 bg-amber-50 border-amber-200";
        }

        let statusBadge = '';
        if (q.status === 'PENDING') {
            statusBadge = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>Chờ bạn duyệt</span>`;
        } else if (q.status === 'AUTO') {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><i class="fa-solid fa-robot"></i> Tự động duyệt</span>`;
        } else if (q.status === 'APPROVED') {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><i class="fa-solid fa-check"></i> Đã duyệt</span>`;
        } else {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><i class="fa-solid fa-xmark"></i> Từ chối</span>`;
        }

        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="font-bold text-slate-900">${q.customer}</div>
                <div class="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>${q.id}</span> • <span>${q.date}</span>
                </div>
            </td>
            <td class="px-6 py-4 font-medium text-slate-700">${q.saleName}</td>
            <td class="px-6 py-4 font-semibold text-slate-800">${formatVND(fin.totalListPrice)}</td>
            <td class="px-6 py-4 text-center">
                <span class="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md font-bold text-slate-800 text-xs">
                    -${q.discountPercent}%
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="font-bold text-slate-900">${formatVND(fin.finalPrice)}</div>
                <div class="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold ${marginColorClass}">
                    Biên LN: ${fin.grossMarginPercent.toFixed(1)}%
                </div>
            </td>
            <td class="px-6 py-4 text-center">${statusBadge}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="openDetailModal('${q.id}')" class="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200">
                    ${q.status === 'PENDING' ? '<i class="fa-solid fa-gavel mr-1"></i> Duyệt ngay' : '<i class="fa-solid fa-eye mr-1"></i> Xem chi tiết'}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updateKPIs();
    updateFilterBadges();
}

// Update Top Dashboard Metrics
function updateKPIs() {
    const pendingQuotes = quotes.filter(q => q.status === 'PENDING');
    const autoQuotes = quotes.filter(q => q.status === 'AUTO');
    
    document.getElementById('kpi-pending').innerText = pendingQuotes.length;
    document.getElementById('kpi-auto').innerText = autoQuotes.length;

    const pendingRev = pendingQuotes.reduce((sum, q) => sum + getQuoteFinancials(q).finalPrice, 0);
    document.getElementById('kpi-revenue').innerText = formatVND(pendingRev);

    let totalMarginSum = quotes.reduce((sum, q) => sum + getQuoteFinancials(q).grossMarginPercent, 0);
    const avgMargin = quotes.length > 0 ? (totalMarginSum / quotes.length) : 0;
    document.getElementById('kpi-avg-margin').innerText = avgMargin.toFixed(1) + '%';
}

function updateFilterBadges() {
    document.getElementById('cnt-all').innerText = quotes.length;
    document.getElementById('cnt-pending').innerText = quotes.filter(q => q.status === 'PENDING').length;
    document.getElementById('cnt-auto').innerText = quotes.filter(q => q.status === 'AUTO').length;
    document.getElementById('cnt-approved').innerText = quotes.filter(q => q.status === 'APPROVED').length;
    document.getElementById('cnt-rejected').innerText = quotes.filter(q => q.status === 'REJECTED').length;
}

function setFilter(filterType) {
    currentFilter = filterType;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = "filter-btn px-4 py-2 rounded-lg text-sm font-medium transition bg-slate-100 text-slate-600 hover:bg-slate-200";
    });
    const activeBtn = document.getElementById(`btn-filter-${filterType}`);
    if (activeBtn) {
        activeBtn.className = "filter-btn px-4 py-2 rounded-lg text-sm font-medium transition bg-slate-900 text-white shadow-sm";
    }
    renderTable();
}

// Open Detail/Approval Modal
function openDetailModal(quoteId) {
    activeQuoteId = quoteId;
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;

    const fin = getQuoteFinancials(quote);

    document.getElementById('detail-quote-id').innerText = quote.id;
    document.getElementById('detail-customer').innerText = quote.customer;
    document.getElementById('detail-sale-name').innerText = `Yêu cầu bởi Sales: ${quote.saleName} | Ngày: ${quote.date}`;

    document.getElementById('detail-total-list').innerText = formatVND(fin.totalListPrice);
    document.getElementById('detail-total-final').innerText = formatVND(fin.finalPrice);
    document.getElementById('detail-discount-tag').innerText = `Giảm -${quote.discountPercent}%`;
    document.getElementById('detail-margin-percent').innerText = `${fin.grossMarginPercent.toFixed(1)}%`;
    document.getElementById('detail-profit-amount').innerText = `Lợi nhuận gộp: ${formatVND(fin.grossProfit)}`;

    // Populate Items
    const itemsTbody = document.getElementById('detail-items-body');
    itemsTbody.innerHTML = '';
    quote.items.forEach(item => {
        const itemListTotal = item.listPrice * item.qty;
        const itemCogsTotal = item.cogs * item.qty;
        const itemFinalTotal = itemListTotal * (1 - quote.discountPercent / 100);
        const itemProfit = itemFinalTotal - itemCogsTotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-3 font-semibold text-slate-800">${item.name}</td>
            <td class="p-3 text-center">${item.qty}</td>
            <td class="p-3 text-right">${formatVND(item.listPrice)}</td>
            <td class="p-3 text-right text-slate-500">${formatVND(item.cogs)}</td>
            <td class="p-3 text-right font-bold text-blue-600">${formatVND(itemFinalTotal / item.qty)}</td>
            <td class="p-3 text-right font-bold text-emerald-600">${formatVND(itemProfit)}</td>
        `;
        itemsTbody.appendChild(tr);
    });

    const banner = document.getElementById('detail-status-banner');
    const footerActions = document.getElementById('detail-footer-actions');
    const noteBox = document.getElementById('approval-note-box');
    document.getElementById('approval-note').value = quote.note || '';

    if (quote.status === 'PENDING') {
        banner.className = "p-4 rounded-xl flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900";
        document.getElementById('banner-title').innerText = "Yêu cầu Trưởng Nhóm Phê Duyệt";
        document.getElementById('banner-desc').innerText = `Chiết khấu ${quote.discountPercent}% vượt hạn mức tự động (${CONFIG.autoApproveDiscountMax}%). Vui lòng duyệt trước khi gửi khách.`;
        footerActions.classList.remove('hidden');
        noteBox.classList.remove('hidden');
    } else if (quote.status === 'AUTO') {
        banner.className = "p-4 rounded-xl flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900";
        document.getElementById('banner-title').innerText = "Hệ thống Tự động Phê duyệt (Auto-Approved)";
        document.getElementById('banner-desc').innerText = `Mức chiết khấu (${quote.discountPercent}%) nằm trong hạn mức an toàn (&le; ${CONFIG.autoApproveDiscountMax}%).`;
        footerActions.classList.add('hidden');
        noteBox.classList.add('hidden');
    } else if (quote.status === 'APPROVED') {
        banner.className = "p-4 rounded-xl flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-900";
        document.getElementById('banner-title').innerText = "Đã Phê Duyệt Bởi Trưởng Nhóm";
        document.getElementById('banner-desc').innerText = `Ghi chú: ${quote.note || 'Không có ghi chú'}`;
        footerActions.classList.add('hidden');
        noteBox.classList.add('hidden');
    } else {
        banner.className = "p-4 rounded-xl flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-900";
        document.getElementById('banner-title').innerText = "Báo Giá Đã Bị Từ Chối";
        document.getElementById('banner-desc').innerText = `Lý do: ${quote.note || 'Chiết khấu quá cao, vi phạm biên lợi nhuận.'}`;
        footerActions.classList.add('hidden');
        noteBox.classList.add('hidden');
    }

    openModal('modal-detail');
}

// Process Approval
function processApproval(isApproved) {
    const quote = quotes.find(q => q.id === activeQuoteId);
    if (!quote) return;

    const note = document.getElementById('approval-note').value.trim();

    if (!isApproved && !note) {
        alert("Vui lòng nhập lý do từ chối để nhân viên Sales biết đường chỉnh sửa!");
        return;
    }

    quote.status = isApproved ? 'APPROVED' : 'REJECTED';
    quote.note = note || (isApproved ? 'Đã duyệt bởi Trưởng nhóm' : 'Từ chối');

    closeModal('modal-detail');
    renderTable();
}

// Calculate preview when creating new quote
function calculateNewQuote() {
    const productId = document.getElementById('new-product').value;
    const qty = parseInt(document.getElementById('new-qty').value) || 1;
    const discount = parseFloat(document.getElementById('new-discount').value) || 0;

    const prod = PRODUCTS_DB[productId];
    const listTotal = prod.listPrice * qty;
    const finalTotal = listTotal * (1 - discount / 100);
    const cogsTotal = prod.cogs * qty;
    const profit = finalTotal - cogsTotal;
    const margin = finalTotal > 0 ? (profit / finalTotal) * 100 : 0;

    document.getElementById('preview-list-price').innerText = formatVND(listTotal);
    document.getElementById('preview-final-price').innerText = formatVND(finalTotal);
    document.getElementById('preview-margin').innerText = `${margin.toFixed(1)}% (Lãi ${formatVND(profit)})`;

    const badgeEl = document.getElementById('preview-rule-badge');
    
    if (discount <= CONFIG.autoApproveDiscountMax && margin >= CONFIG.minGrossMargin) {
        badgeEl.className = "mt-2 text-center py-1.5 rounded font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300";
        badgeEl.innerHTML = `<i class="fa-solid fa-bolt mr-1"></i> TỰ ĐỘNG DUYỆT NGAY (CK &le; ${CONFIG.autoApproveDiscountMax}%)`;
    } else if (discount <= CONFIG.leadApproveDiscountMax && margin >= CONFIG.minGrossMargin) {
        badgeEl.className = "mt-2 text-center py-1.5 rounded font-bold text-xs bg-amber-100 text-amber-800 border border-amber-300";
        badgeEl.innerHTML = `<i class="fa-solid fa-hourglass-half mr-1"></i> Cần Trưởng nhóm duyệt thủ công`;
    } else {
        badgeEl.className = "mt-2 text-center py-1.5 rounded font-bold text-xs bg-rose-100 text-rose-800 border border-rose-300";
        badgeEl.innerHTML = `<i class="fa-solid fa-ban mr-1"></i> TỰ ĐỘNG TỪ CHỐI (Vượt hạn mức chiết khấu / Biên LN quá thấp)`;
    }
}

// Handle Form Submission for New Quote
function handleCreateQuote(e) {
    e.preventDefault();
    const customer = document.getElementById('new-customer').value;
    const saleName = document.getElementById('new-sale-name').value;
    const productId = document.getElementById('new-product').value;
    const qty = parseInt(document.getElementById('new-qty').value) || 1;
    const discount = parseFloat(document.getElementById('new-discount').value) || 0;

    const prod = PRODUCTS_DB[productId];
    const listTotal = prod.listPrice * qty;
    const finalTotal = listTotal * (1 - discount / 100);
    const cogsTotal = prod.cogs * qty;
    const margin = ((finalTotal - cogsTotal) / finalTotal) * 100;

    let status = "PENDING";
    let note = "";

    if (margin < CONFIG.minGrossMargin || discount > CONFIG.leadApproveDiscountMax) {
        status = "REJECTED";
        note = "Tự động từ chối: Vi phạm hạn mức chiết khấu hoặc biên lợi nhuận tối thiểu.";
    } else if (discount <= CONFIG.autoApproveDiscountMax) {
        status = "AUTO";
        note = "Hệ thống tự động phê duyệt (Chiết khấu trong ngưỡng an toàn).";
    }

    const newQuote = {
        id: `BG-${1001 + quotes.length}`,
        customer,
        saleName,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        discountPercent: discount,
        status,
        note,
        items: [
            { name: prod.name, qty, listPrice: prod.listPrice, cogs: prod.cogs }
        ]
    };

    quotes.unshift(newQuote);
    closeModal('modal-create');
    renderTable();

    document.getElementById('create-quote-form').reset();
    calculateNewQuote();
}

// Save Policy Settings
function savePolicy() {
    CONFIG.autoApproveDiscountMax = parseFloat(document.getElementById('policy-auto-discount').value) || 5;
    CONFIG.leadApproveDiscountMax = parseFloat(document.getElementById('policy-lead-discount').value) || 15;
    CONFIG.minGrossMargin = parseFloat(document.getElementById('policy-min-margin').value) || 10;

    closeModal('modal-policy');
    renderTable();
    alert("Cập nhật quy tắc phê duyệt chiết khấu thành công!");
}

// Modal Toggle Helpers
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}