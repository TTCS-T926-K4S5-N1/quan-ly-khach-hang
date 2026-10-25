"use strict";

const API_BASE = "http://localhost:8080/crm";

let quotes = [];
let activeApprQuoteId = null;
let currentCompareQuoteId = null;
let compareVersionsList = [];

// Pagination state
let currentPage = 1;
let pageSize = 10;
let totalItems = 0;
let totalPages = 1;

const quoteTableBody = document.getElementById("quoteTableBody");
const quoteEmpty = document.getElementById("quoteEmpty");
const mobileList = document.getElementById("quoteMobileList");
const search = document.getElementById("quoteSearch");
const statusFilter = document.getElementById("quoteStatusFilter");
const quotePagination = document.getElementById("quotePagination");
const quotePaginationRange = document.getElementById("quotePaginationRange");
const quotePageSizeSelect = document.getElementById("quotePageSizeSelect");
const quotePaginationControls = document.getElementById("quotePaginationControls");

/* =========================================================
   API CLIENT
========================================================= */
async function api(path, options = {}) {
    const config = {
        credentials: "include",
        headers: {
            "Accept": "application/json",
            ...(options.body ? { "Content-Type": "application/json; charset=utf-8" } : {}),
            ...(options.headers || {})
        },
        ...options
    };

    const response = await fetch(API_BASE + path, config);
    let result = null;
    try {
        result = await response.json();
    } catch (_) {
        result = null;
    }

    if (response.status === 401) {
        localStorage.removeItem("crm_ui_session");
        window.location.href = "login";
        throw new Error("Phiên đăng nhập đã hết hạn.");
    }

    if (!response.ok || !result?.success) {
        const error = new Error(result?.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = result?.data;
        throw error;
    }

    return result.data;
}

/* =========================================================
   SAMPLE SEED DATA IF EMPTY
========================================================= */
function ensureSeedQuotes() {
    let saved = [];
    try {
        saved = JSON.parse(localStorage.getItem("crm_ui_quotes")) || [];
    } catch (_) {
        saved = [];
    }

    if (!Array.isArray(saved) || saved.length === 0) {
        saved = [
            {
                id: 101,
                code: "BG-2026-001",
                title: "Báo giá Hệ thống ERP Cloud đa nhà máy",
                customer: "Tập đoàn Công nghiệp Foxconn VN",
                customerId: 1,
                opportunityName: "Triển khai ERP Foxconn Đình Trám & Quế Võ",
                opportunityId: 1001,
                total: 850000000,
                subtotal: 900000000,
                discountPercent: 5.5,
                status: "APPROVED",
                requiresApproval: false,
                approvalLevel: "NONE",
                version: 1,
                isActiveVersion: true,
                validUntil: "2026-11-15",
                lines: [
                    { product: "Gói giải pháp Quản trị Sản xuất ERP Cloud", quantity: 1, price: 500000000, discount: 5, vat: 10, total: 475000000 }
                ]
            },
            {
                id: 102,
                code: "BG-2026-002",
                title: "Báo giá Nâng cấp Hạ tầng Call Center & CRM",
                customer: "Công ty CP Du lịch & Lữ hành Vietravel",
                customerId: 2,
                opportunityName: "Mở rộng Tổng đài CSKH Cloud 200 Seats",
                opportunityId: 1002,
                total: 320000000,
                subtotal: 350000000,
                discountPercent: 8.6,
                status: "PENDING_APPROVAL",
                requiresApproval: true,
                approvalLevel: "TEAM_LEAD",
                version: 1,
                isActiveVersion: true,
                validUntil: "2026-11-20",
                lines: [
                    { product: "Module Đặt Tour & Thanh toán Trực tuyến", quantity: 1, price: 200000000, discount: 10, vat: 8, total: 180000000 }
                ]
            },
            {
                id: 103,
                code: "BG-2026-003",
                title: "Báo giá Phần mềm Khách hàng Thân thiết (Loyalty)",
                customer: "Chuỗi Bán lẻ Thời trang NEM Fashion",
                customerId: 3,
                opportunityName: "Tích hợp Loyalty System 50 Showroom",
                opportunityId: 1003,
                total: 185000000,
                subtotal: 185000000,
                discountPercent: 0,
                status: "SENT",
                requiresApproval: false,
                approvalLevel: "NONE",
                version: 2,
                isActiveVersion: true,
                validUntil: "2026-11-10",
                lines: [
                    { product: "Phần mềm Tích điểm NEM Fashion App", quantity: 1, price: 185000000, discount: 0, vat: 8, total: 185000000 }
                ]
            },
            {
                id: 104,
                code: "BG-2026-004",
                title: "Báo giá Cung cấp Giải pháp Core Banking API",
                customer: "Ngân hàng TMCP VPBank - CN Thăng Long",
                customerId: 4,
                opportunityName: "Gói giải pháp API Gateway VPBank",
                opportunityId: 1004,
                total: 620000000,
                subtotal: 650000000,
                discountPercent: 4.6,
                status: "CONVERTED",
                contractId: 1,
                requiresApproval: false,
                approvalLevel: "NONE",
                version: 1,
                isActiveVersion: true,
                validUntil: "2026-10-31",
                lines: [
                    { product: "Module Bảo mật & Gateway API Core Banking", quantity: 1, price: 620000000, discount: 0, vat: 10, total: 620000000 }
                ]
            }
        ];
        localStorage.setItem("crm_ui_quotes", JSON.stringify(saved));
    }
}

/* =========================================================
   INITIALIZATION
========================================================= */
async function loadQuotes() {
    ensureSeedQuotes();

    try {
        const data = await api("/api/quotes");
        if (Array.isArray(data) && data.length > 0) {
            quotes = data.map(q => normalizeQuote(q));
            saveQuotesCache();
            render();
            return;
        }
    } catch (err) {
        console.warn("Could not load quotes from backend, falling back to cache:", err);
    }

    try {
        const cached = JSON.parse(localStorage.getItem("crm_ui_quotes"));
        quotes = Array.isArray(cached) ? cached : [];
    } catch {
        quotes = [];
    }
    render();
}

function normalizeQuote(q) {
    let st = String(q.status || "DRAFT").toUpperCase();
    return {
        id: q.id,
        code: q.quoteNumber || q.code || `BG-${q.id}`,
        title: q.title || "",
        customer: q.customerName || q.customer || "Khách hàng",
        customerEmail: q.customerEmail || "",
        customerId: q.customerId,
        opportunityName: q.opportunityName || q.opportunity || "",
        opportunityId: q.opportunityId,
        total: Number(q.totalAmount || q.total || 0),
        subtotal: Number(q.subtotal || 0),
        discountPercent: Number(q.discountPercent || 0),
        status: st,
        requiresApproval: !!q.requiresApproval,
        approvalLevel: q.approvalLevel || "NONE",
        validUntil: q.validUntil || (q.createdAt ? q.createdAt.split("T")[0] : "—"),
        version: Number(q.version || 1),
        isActiveVersion: q.isActiveVersion !== undefined ? !!q.isActiveVersion : true,
        sentToCustomerAt: q.sentToCustomerAt || null,
        rejectionReason: q.rejectionReason || null,
        publicToken: q.publicToken || null,
        customerFeedback: q.customerFeedback || null,
        customerFeedbackComment: q.customerFeedbackComment || null,
        customerFeedbackAt: q.customerFeedbackAt || null,
        contractId: q.contractId || null,
        lines: q.items || q.lines || []
    };
}

function saveQuotesCache() {
    try {
        localStorage.setItem("crm_ui_quotes", JSON.stringify(quotes));
    } catch (_) {}
}

/* =========================================================
   RENDER QUOTES TABLE & PAGINATION
========================================================= */
function render() {
    const query = search ? search.value.trim().toLowerCase() : "";
    const filterSt = statusFilter ? statusFilter.value.toUpperCase() : "";

    const filtered = quotes.filter(quote => {
        const text = `${quote.code || ""} ${quote.customer || ""} ${quote.title || ""} ${quote.opportunityName || ""}`.toLowerCase();
        const searchOk = !query || text.includes(query);
        const statusOk = !filterSt || quote.status === filterSt;
        return searchOk && statusOk;
    });

    totalItems = filtered.length;
    totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    if (quoteTableBody) quoteTableBody.innerHTML = "";
    if (mobileList) mobileList.innerHTML = "";

    if (quoteEmpty) {
        quoteEmpty.style.display = totalItems === 0 ? "flex" : "none";
    }

    // Slice for current page
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pagedQuotes = filtered.slice(startIndex, endIndex);

    pagedQuotes.forEach((quote, index) => {
        renderDesktopRow(quote, startIndex + index);
        renderMobileCard(quote, startIndex + index);
    });

    renderPagination();
}

function renderDesktopRow(quote, index) {
    if (!quoteTableBody) return;
    const tr = document.createElement("tr");

    // Approval level badge
    let levelBadge = '';
    if (quote.approvalLevel === "DIRECTOR") {
        levelBadge = '<span class="appr-level-chip appr-level-director">Giám đốc duyệt</span>';
    } else if (quote.approvalLevel === "TEAM_LEAD") {
        levelBadge = '<span class="appr-level-chip appr-level-team">Trưởng nhóm duyệt</span>';
    } else {
        levelBadge = '<span class="appr-level-chip appr-level-none">Tự động</span>';
    }

    // Version chip
    const verHtml = `<span class="version-chip ${quote.isActiveVersion ? 'active' : 'history'}">v${quote.version}${quote.isActiveVersion ? ' (Hiệu lực)' : ''}</span>`;

    // Status notes
    let statusNote = '';
    if (quote.status === "ACCEPTED") {
        statusNote = `<div style="font-size:10.5px; color:#15803d; max-width:140px; margin-top:2px;">✓ Khách đồng ý${quote.customerFeedbackComment ? ': ' + escapeHtml(quote.customerFeedbackComment) : ''}</div>`;
    } else if (quote.status === "REJECTED" || quote.customerFeedback === "REJECTED") {
        statusNote = `<div style="font-size:10.5px; color:#ef4444; max-width:140px; margin-top:2px;">✕ Khách từ chối${quote.customerFeedbackComment ? ': ' + escapeHtml(quote.customerFeedbackComment) : ''}</div>`;
    } else if (quote.status === "CONVERTED") {
        statusNote = `<div style="font-size:10.5px; color:#7c3aed; max-width:140px; margin-top:2px;">Đã lập hợp đồng #${quote.contractId || ''}</div>`;
    } else if (quote.status === "EXPIRED") {
        statusNote = `<div style="font-size:10.5px; color:#64748b; max-width:140px; margin-top:2px;">Hết hạn hiệu lực</div>`;
    } else if (quote.rejectionReason) {
        statusNote = `<div style="font-size:10.5px; color:#ef4444; max-width:140px; margin-top:2px;" title="${escapeHtml(quote.rejectionReason)}">Lý do: ${escapeHtml(quote.rejectionReason)}</div>`;
    }

    const canApprove = quote.status === "PENDING_APPROVAL" || quote.status === "PENDING" || (quote.status === "DRAFT" && quote.requiresApproval);
    const canConvert = (quote.status === "ACCEPTED" || quote.status === "APPROVED") && !quote.contractId && quote.status !== "CONVERTED";
    const canSend = quote.status === "APPROVED" || quote.status === "SENT";

    tr.innerHTML = `
        <td class="quote-code">
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-weight:700; color:var(--crm-text);">${escapeHtml(quote.code)}</span>
                ${verHtml}
            </div>
            <div style="font-size:11.5px; color:var(--crm-muted); font-weight:normal; margin-top:2px;">
                ${escapeHtml(quote.title || "")}
            </div>
        </td>
        <td>
            <div style="font-weight:600; color:var(--crm-text);">${escapeHtml(quote.customer || "—")}</div>
            ${quote.opportunityName ? `<div style="font-size:11px; color:#2563eb; margin-top:2px;">🎯 ${escapeHtml(quote.opportunityName)}</div>` : ''}
        </td>
        <td style="text-align: right;">
            <div style="font-weight:700; color:#15803d; font-size:13.5px;">${money(quote.total)}</div>
            ${quote.subtotal ? `<div style="font-size:11px; color:var(--crm-muted);">Gốc: ${money(quote.subtotal)}</div>` : ''}
        </td>
        <td style="text-align: center;">
            <div style="font-weight:600; color:${quote.discountPercent > 0 ? '#dc2626' : 'var(--crm-muted)'};">
                ${quote.discountPercent > 0 ? `-${quote.discountPercent.toFixed(1)}%` : '0%'}
            </div>
            ${levelBadge}
        </td>
        <td style="text-align: center;">
            <span class="quote-status ${quote.status.toLowerCase()}">
                ${statusLabel(quote.status)}
            </span>
            ${statusNote}
        </td>
        <td style="text-align: center; color:var(--crm-muted); font-size:12px;">
            ${escapeHtml(quote.validUntil || "—")}
        </td>
        <td class="action-col" style="text-align: center;">
            <div class="row-actions-group" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                <a class="action-btn action-btn-360" href="quote-editor?id=${encodeURIComponent(quote.id)}" title="Xem chi tiết báo giá">
                    Xem
                </a>
                <div class="row-action-wrap">
                    <button class="row-action-button" type="button" data-action-menu="${index}" title="Thao tác khác">
                        ⋮
                    </button>
                    <div class="row-action-menu" data-menu="${index}">
                        <a href="quote-editor?id=${encodeURIComponent(quote.id)}">
                            ✏️ Chỉnh sửa báo giá
                        </a>
                        <a href="quote-print.html?id=${encodeURIComponent(quote.id)}" target="_blank">
                            🖨️ Xem bản in / PDF
                        </a>
                        ${canApprove ? `<button type="button" onclick="openApprovalModal(${quote.id})">⚖️ Duyệt báo giá</button>` : ""}
                        ${canConvert ? `<a href="contract-create?id=${encodeURIComponent(quote.id)}">✓ Tạo Hợp đồng</a>` : ""}
                        ${quote.contractId ? `<a href="contracts?search=${encodeURIComponent(quote.code || '')}">📑 Xem Hợp đồng</a>` : ""}
                        <button type="button" onclick="openSendEmailModal(${quote.id})">
                            ✉️ Gửi Email khách hàng
                        </button>
                        <button type="button" onclick="openHistoryModal(${quote.id})">
                            📜 Lịch sử phê duyệt
                        </button>
                        <button type="button" onclick="openCompareModal(${quote.id})">
                            ⚖️ So sánh phiên bản
                        </button>
                        <div style="height:1px; background:var(--crm-border); margin:4px 0;"></div>
                        <button type="button" class="danger" onclick="handleDeleteQuote(${quote.id})">
                            🗑️ Xóa báo giá
                        </button>
                    </div>
                </div>
            </div>
        </td>
    `;
    quoteTableBody.appendChild(tr);
}

function renderMobileCard(quote, index) {
    if (!mobileList) return;
    const card = document.createElement("article");
    card.className = "quote-mobile-card";
    card.innerHTML = `
        <div class="quote-mobile-head">
            <div>
                <strong>${escapeHtml(quote.code)}</strong> (v${quote.version})
                <div style="margin-top:4px; font-weight:600;">${escapeHtml(quote.customer || "—")}</div>
            </div>
            <span class="quote-status ${quote.status.toLowerCase()}">
                ${statusLabel(quote.status)}
            </span>
        </div>
        <div class="quote-mobile-info">
            <span>Tổng tiền: <b style="color:#15803d;">${money(quote.total)}</b> (CK: ${quote.discountPercent.toFixed(1)}%)</span>
            <span>Hiệu lực đến: ${escapeHtml(quote.validUntil || "—")}</span>
        </div>
        <div class="quote-mobile-actions" style="display:flex; gap:6px; margin-top:8px;">
            <a class="crm-btn crm-btn-secondary" style="flex:1; text-align:center; text-decoration:none;" href="quote-editor?id=${encodeURIComponent(quote.id)}">Chi tiết</a>
            <a class="crm-btn crm-btn-secondary" style="flex:1; text-align:center; text-decoration:none;" href="quote-print.html?id=${encodeURIComponent(quote.id)}" target="_blank">In PDF</a>
        </div>
    `;
    mobileList.appendChild(card);
}

function renderPagination() {
    if (!quotePagination) return;
    if (totalItems === 0) {
        quotePagination.style.display = "none";
        return;
    }

    quotePagination.style.display = "flex";

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    if (quotePaginationRange) {
        quotePaginationRange.textContent = `Hiển thị ${start} - ${end} / ${totalItems} báo giá (Trang ${currentPage}/${totalPages})`;
    }

    if (quotePageSizeSelect && quotePageSizeSelect.value !== String(pageSize)) {
        quotePageSizeSelect.value = String(pageSize);
    }

    if (!quotePaginationControls) return;
    quotePaginationControls.innerHTML = "";

    // 1. First «
    const btnFirst = createPageBtn("«", 1, currentPage <= 1, false, "Trang đầu");
    quotePaginationControls.appendChild(btnFirst);

    // 2. Prev ‹
    const btnPrev = createPageBtn("‹", currentPage - 1, currentPage <= 1, false, "Trang trước");
    quotePaginationControls.appendChild(btnPrev);

    // 3. Numbers
    const pageNumbers = getPageRange(currentPage, totalPages);
    pageNumbers.forEach(p => {
        if (p === "...") {
            const ellipsis = document.createElement("span");
            ellipsis.className = "crm-pagination-ellipsis";
            ellipsis.textContent = "…";
            quotePaginationControls.appendChild(ellipsis);
        } else {
            const btn = createPageBtn(String(p), p, false, p === currentPage);
            quotePaginationControls.appendChild(btn);
        }
    });

    // 4. Next ›
    const btnNext = createPageBtn("›", currentPage + 1, currentPage >= totalPages, false, "Trang sau");
    quotePaginationControls.appendChild(btnNext);

    // 5. Last »
    const btnLast = createPageBtn("»", totalPages, currentPage >= totalPages, false, "Trang cuối");
    quotePaginationControls.appendChild(btnLast);
}

function createPageBtn(label, targetPage, disabled, isActive = false, title = "") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `crm-pagination-btn ${isActive ? "active" : ""}`;
    btn.textContent = label;
    if (title) btn.title = title;
    if (disabled) {
        btn.disabled = true;
    } else if (!isActive) {
        btn.addEventListener("click", () => {
            currentPage = targetPage;
            render();
        });
    }
    return btn;
}

function getPageRange(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
}

/* =========================================================
   STORY 2: DUYỆT BÁO GIÁ MODAL & ACTIONS
========================================================= */
window.openApprovalModal = function(quoteId) {
    const q = quotes.find(item => item.id === quoteId);
    if (!q) return;

    activeApprQuoteId = quoteId;
    document.getElementById("apprModalCode").textContent = q.code;
    document.getElementById("apprModalCustomer").textContent = q.customer;
    document.getElementById("apprModalTotal").textContent = money(q.total);
    document.getElementById("apprModalDiscount").textContent = `${q.discountPercent.toFixed(1)}%`;

    const levelBadge = document.getElementById("apprModalLevelBadge");
    if (q.approvalLevel === "DIRECTOR") {
        levelBadge.className = "appr-level-chip appr-level-director";
        levelBadge.textContent = "Giám đốc kinh doanh duyệt";
    } else if (q.approvalLevel === "TEAM_LEAD") {
        levelBadge.className = "appr-level-chip appr-level-team";
        levelBadge.textContent = "Trưởng nhóm kinh doanh duyệt";
    } else {
        levelBadge.className = "appr-level-chip appr-level-none";
        levelBadge.textContent = "Tự động duyệt";
    }

    document.getElementById("apprCommentInput").value = "";
    document.getElementById("apprErrorMsg").style.display = "none";
    document.getElementById("approvalModal").style.display = "flex";
};

window.closeApprovalModal = function() {
    activeApprQuoteId = null;
    document.getElementById("approvalModal").style.display = "none";
};

async function submitApprovalAction(action) {
    if (!activeApprQuoteId) return;
    const comment = document.getElementById("apprCommentInput").value.trim();
    const errorEl = document.getElementById("apprErrorMsg");

    if ((action === "REJECTED" || action === "CHANGES_REQUESTED") && !comment) {
        errorEl.textContent = "Vui lòng nhập lý do / ý kiến chỉ đạo khi Từ chối hoặc Trả lại sửa.";
        errorEl.style.display = "block";
        return;
    }
    errorEl.style.display = "none";

    try {
        await api(`/api/quotes/${activeApprQuoteId}/approval`, {
            method: "POST",
            body: JSON.stringify({ action, comment })
        });

        // Update local quote state
        const q = quotes.find(item => item.id === activeApprQuoteId);
        if (q) {
            if (action === "APPROVED") q.status = "APPROVED";
            else if (action === "REJECTED") { q.status = "REJECTED"; q.rejectionReason = comment; }
            else if (action === "CHANGES_REQUESTED") { q.status = "CHANGES_REQUESTED"; q.rejectionReason = comment; }
            saveQuotesCache();
        }
        closeApprovalModal();
        render();
        alert("Đã cập nhật trạng thái phê duyệt thành công!");
    } catch (err) {
        errorEl.textContent = "Lỗi khi cập nhật duyệt: " + err.message;
        errorEl.style.display = "block";
    }
}

/* =========================================================
   STORY 2: LỊCH SỬ PHÊ DUYỆT BẤT BIẾN
========================================================= */
window.openHistoryModal = async function(quoteId) {
    const q = quotes.find(item => item.id === quoteId);
    if (!q) return;

    document.getElementById("historyModal").style.display = "flex";
    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:16px;">Đang tải lịch sử...</td></tr>';

    try {
        const logs = await api(`/api/quotes/${quoteId}/approval-history`);
        tbody.innerHTML = "";
        if (!Array.isArray(logs) || logs.length === 0) {
            document.getElementById("historyEmpty").style.display = "block";
            return;
        }
        document.getElementById("historyEmpty").style.display = "none";

        logs.forEach(log => {
            const tr = document.createElement("tr");
            let actionChip = '<span class="history-chip chip-approved">Đã duyệt</span>';
            if (log.action === "REJECTED") actionChip = '<span class="history-chip chip-rejected">Từ chối</span>';
            else if (log.action === "CHANGES_REQUESTED") actionChip = '<span class="history-chip chip-changes">Yêu cầu sửa</span>';

            tr.innerHTML = `
                <td>${escapeHtml((log.actionAt || "").replace("T", " "))}</td>
                <td><strong>${escapeHtml(log.approverName || "Hệ thống")}</strong></td>
                <td>${escapeHtml(log.approverRole || "Quản trị viên")}</td>
                <td>${actionChip}</td>
                <td>${log.discountPercent ? log.discountPercent + "%" : "—"}</td>
                <td style="color:#334155;">${escapeHtml(log.comment || "—")}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ef4444; padding:16px;">Không thể tải lịch sử: ${escapeHtml(err.message)}</td></tr>`;
    }
};

window.closeHistoryModal = function() {
    document.getElementById("historyModal").style.display = "none";
};

/* =========================================================
   STORY 3: SO SÁNH 2 PHIÊN BẢN CẠNH NHAU
========================================================= */
window.openCompareModal = async function(quoteId) {
    currentCompareQuoteId = quoteId;
    const modal = document.getElementById("compareModal");
    modal.style.display = "flex";

    const v1Select = document.getElementById("compareSelectV1");
    const v2Select = document.getElementById("compareSelectV2");
    v1Select.innerHTML = "<option>Đang tải...</option>";
    v2Select.innerHTML = "<option>Đang tải...</option>";

    try {
        const versions = await api(`/api/quotes/${quoteId}/versions`);
        compareVersionsList = Array.isArray(versions) ? versions : [];

        if (compareVersionsList.length === 0) {
            const curr = quotes.find(q => q.id === quoteId);
            if (curr) compareVersionsList = [curr];
        }

        v1Select.innerHTML = "";
        v2Select.innerHTML = "";

        compareVersionsList.forEach((v, idx) => {
            const opt1 = document.createElement("option");
            opt1.value = v.version;
            opt1.textContent = `v${v.version} - ${money(v.total || v.totalAmount)} (${(v.createdAt || "").substring(0, 10)})`;
            v1Select.appendChild(opt1);

            const opt2 = document.createElement("option");
            opt2.value = v.version;
            opt2.textContent = `v${v.version} - ${money(v.total || v.totalAmount)} (${(v.createdAt || "").substring(0, 10)})`;
            v2Select.appendChild(opt2);
        });

        if (compareVersionsList.length > 1) {
            v1Select.selectedIndex = 0;
            v2Select.selectedIndex = 1;
        }

        executeCompare();
    } catch (err) {
        console.warn("Could not load versions:", err);
    }
};

window.closeCompareModal = function() {
    document.getElementById("compareModal").style.display = "none";
};

function executeCompare() {
    const v1Val = Number(document.getElementById("compareSelectV1").value);
    const v2Val = Number(document.getElementById("compareSelectV2").value);

    const v1 = compareVersionsList.find(v => v.version === v1Val) || {};
    const v2 = compareVersionsList.find(v => v.version === v2Val) || {};

    document.getElementById("thVer1Title").textContent = `Phiên bản v${v1Val || 1}`;
    document.getElementById("thVer2Title").textContent = `Phiên bản v${v2Val || 2}`;

    // Compare headers
    const headerTbody = document.getElementById("compareHeaderBody");
    headerTbody.innerHTML = "";

    const addRow = (label, val1, val2) => {
        const tr = document.createElement("tr");
        const diff = String(val1) !== String(val2);
        tr.className = diff ? "diff-modified" : "";
        tr.innerHTML = `
            <td><strong>${escapeHtml(label)}</strong></td>
            <td>${escapeHtml(val1)}</td>
            <td>${escapeHtml(val2)}</td>
            <td style="text-align:center;">${diff ? '<span class="diff-chip chip-mod">Thay đổi</span>' : '<span class="diff-chip chip-same">Giống nhau</span>'}</td>
        `;
        headerTbody.appendChild(tr);
    };

    addRow("Tổng tiền", money(v1.total || v1.totalAmount || 0), money(v2.total || v2.totalAmount || 0));
    addRow("Chiết khấu", `${Number(v1.discountPercent || 0).toFixed(1)}%`, `${Number(v2.discountPercent || 0).toFixed(1)}%`);
    addRow("Hiệu lực", v1.validUntil || "—", v2.validUntil || "—");
    addRow("Trạng thái", statusLabel(v1.status), statusLabel(v2.status));

    // Compare lines
    const itemsTbody = document.getElementById("compareItemsBody");
    itemsTbody.innerHTML = "";
    const lines1 = v1.items || v1.lines || [];
    const lines2 = v2.items || v2.lines || [];

    const allProducts = new Set();
    lines1.forEach(l => allProducts.add(l.product || l.productName || "Sản phẩm"));
    lines2.forEach(l => allProducts.add(l.product || l.productName || "Sản phẩm"));

    allProducts.forEach(prod => {
        const item1 = lines1.find(l => (l.product || l.productName) === prod);
        const item2 = lines2.find(l => (l.product || l.productName) === prod);

        const tr = document.createElement("tr");
        let type = "chip-same";
        let typeLabel = "Giữ nguyên";
        if (!item1) { type = "chip-add"; typeLabel = "Thêm mới"; tr.className = "diff-added"; }
        else if (!item2) { type = "chip-del"; typeLabel = "Đã bỏ"; tr.className = "diff-removed"; }
        else if (item1.total !== item2.total || item1.quantity !== item2.quantity || item1.price !== item2.price) {
            type = "chip-mod"; typeLabel = "Điều chỉnh"; tr.className = "diff-modified";
        }

        const fmt = item => item ? `${item.quantity || 1} x ${money(item.price || 0)} = ${money(item.total || 0)}` : "—";
        tr.innerHTML = `
            <td><strong>${escapeHtml(prod)}</strong></td>
            <td style="text-align:center;"><span class="diff-chip ${type}">${typeLabel}</span></td>
            <td>${fmt(item1)}</td>
            <td>${fmt(item2)}</td>
        `;
        itemsTbody.appendChild(tr);
    });
}

/* =========================================================
   STORY 3: GỬI EMAIL BÁO GIÁ KÈM LINK TRỰC TUYẾN
========================================================= */
window.openSendEmailModal = function(quoteId) {
    const q = quotes.find(item => item.id === quoteId);
    if (!q) return;

    activeApprQuoteId = quoteId;
    document.getElementById("sendEmailRecipient").value = q.customerEmail || "";
    const publicUrl = `${window.location.origin}/crm/public-quote.html?token=${q.publicToken || ("pk_" + q.id)}`;
    document.getElementById("sendEmailPublicUrl").value = publicUrl;
    document.getElementById("sendEmailMessage").value = `Kính gửi Quý khách hàng ${q.customer},\n\nChúng tôi trân trọng gửi tới Quý khách Báo giá: ${q.title || q.code} với tổng giá trị ${money(q.total)}.\n\nQuý khách vui lòng kiểm tra chi tiết theo liên kết đính kèm và phản hồi trực tuyến. Trân trọng!`;
    document.getElementById("sendEmailErrorMsg").style.display = "none";
    document.getElementById("sendEmailModal").style.display = "flex";
};

window.closeSendEmailModal = function() {
    activeApprQuoteId = null;
    document.getElementById("sendEmailModal").style.display = "none";
};

window.copyPublicUrl = function() {
    const input = document.getElementById("sendEmailPublicUrl");
    input.select();
    navigator.clipboard.writeText(input.value);
    alert("Đã sao chép liên kết báo giá trực tuyến vào bộ nhớ đệm!");
};

window.submitSendQuoteEmail = async function() {
    if (!activeApprQuoteId) return;
    const recipient = document.getElementById("sendEmailRecipient").value.trim();
    const msg = document.getElementById("sendEmailMessage").value.trim();
    const err = document.getElementById("sendEmailErrorMsg");

    if (!recipient) {
        err.textContent = "Vui lòng nhập email người nhận.";
        err.style.display = "block";
        return;
    }

    try {
        await api(`/api/quotes/${activeApprQuoteId}/send`, {
            method: "POST",
            body: JSON.stringify({ recipient, message: msg })
        });
        const q = quotes.find(item => item.id === activeApprQuoteId);
        if (q) q.status = "SENT";
        saveQuotesCache();
        closeSendEmailModal();
        render();
        alert(`Báo giá đã được gửi thành công tới ${recipient}!`);
    } catch (e) {
        err.textContent = "Lỗi khi gửi email: " + e.message;
        err.style.display = "block";
    }
};

window.handleDeleteQuote = async function(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa báo giá này không?")) return;
    try {
        await api(`/api/quotes/${id}`, { method: "DELETE" });
    } catch (_) {}

    quotes = quotes.filter(q => q.id !== id);
    saveQuotesCache();
    render();
};

/* =========================================================
   UTILS
========================================================= */
function statusLabel(status) {
    switch (String(status || "").toUpperCase()) {
        case "PENDING_APPROVAL":
        case "PENDING":
            return "Chờ duyệt";
        case "APPROVED":
            return "Đã duyệt";
        case "SENT":
            return "Đã gửi khách";
        case "ACCEPTED":
            return "Khách chấp nhận";
        case "REJECTED":
            return "Từ chối";
        case "CHANGES_REQUESTED":
            return "Yêu cầu sửa";
        case "CONVERTED":
            return "Đã tạo hợp đồng";
        case "EXPIRED":
            return "Hết hiệu lực";
        default:
            return "Nháp";
    }
}

function money(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   DOM READY & EVENT BINDINGS
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    if (searchParam && search) {
        search.value = searchParam;
    }

    search?.addEventListener("input", () => {
        currentPage = 1;
        render();
    });

    statusFilter?.addEventListener("change", () => {
        currentPage = 1;
        render();
    });

    quotePageSizeSelect?.addEventListener("change", (e) => {
        pageSize = Number(e.target.value) || 10;
        currentPage = 1;
        render();
    });

    // Handle row action menu dropdown toggle
    document.addEventListener("click", (e) => {
        const toggleBtn = e.target.closest("[data-action-menu]");
        if (toggleBtn) {
            e.stopPropagation();
            const idx = toggleBtn.getAttribute("data-action-menu");
            const menu = document.querySelector(`[data-menu="${idx}"]`);
            const allMenus = document.querySelectorAll(".row-action-menu");
            allMenus.forEach(m => {
                if (m !== menu) m.classList.remove("open");
            });
            menu?.classList.toggle("open");
            return;
        }

        // Close when clicking outside
        if (!e.target.closest(".row-action-menu")) {
            document.querySelectorAll(".row-action-menu").forEach(m => m.classList.remove("open"));
        }
    });

    document.getElementById("btnApprApprove")?.addEventListener("click", () => submitApprovalAction("APPROVED"));
    document.getElementById("btnApprReject")?.addEventListener("click", () => submitApprovalAction("REJECTED"));
    document.getElementById("btnApprRequestChanges")?.addEventListener("click", () => submitApprovalAction("CHANGES_REQUESTED"));
    document.getElementById("btnExecuteCompare")?.addEventListener("click", executeCompare);

    loadQuotes();
});