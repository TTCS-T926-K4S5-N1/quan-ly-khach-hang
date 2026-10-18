"use strict";

const API_BASE = "http://localhost:8080/crm";

let quotes = [];
let activeApprQuoteId = null;
let currentCompareQuoteId = null;
let compareVersionsList = [];

const quoteTableBody = document.getElementById("quoteTableBody");
const quoteEmpty = document.getElementById("quoteEmpty");
const mobileList = document.getElementById("quoteMobileList");
const search = document.getElementById("quoteSearch");
const statusFilter = document.getElementById("quoteStatusFilter");

/* =========================================================
   API CLIENT
========================================================= */
async function api(path, options = {}) {
    const config = {
        credentials: "include",
        headers: {
            "Accept": "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
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
   INITIALIZATION & DATA LOADING
========================================================= */
async function loadQuotes() {
    try {
        const data = await api("/api/quotes");
        if (Array.isArray(data)) {
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
        customerId: q.customerId,
        opportunityName: q.opportunityName || "",
        opportunityId: q.opportunityId,
        total: Number(q.totalAmount || q.total || 0),
        subtotal: Number(q.subtotal || 0),
        discountPercent: Number(q.discountPercent || 0),
        status: st,
        requiresApproval: !!q.requiresApproval,
        approvalLevel: q.approvalLevel || "NONE",
        validUntil: q.validUntil || (q.createdAt ? q.createdAt.split("T")[0] : "—"),
        version: Number(q.version || 1),
        isActiveVersion: !!q.isActiveVersion,
        sentToCustomerAt: q.sentToCustomerAt || null,
        rejectionReason: q.rejectionReason || null,
        lines: q.items || []
    };
}

function saveQuotesCache() {
    try {
        localStorage.setItem("crm_ui_quotes", JSON.stringify(quotes));
    } catch (_) {}
}

/* =========================================================
   RENDER QUOTES TABLE & CARDS
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

    if (quoteTableBody) quoteTableBody.innerHTML = "";
    if (mobileList) mobileList.innerHTML = "";

    if (quoteEmpty) {
        quoteEmpty.style.display = filtered.length ? "none" : "flex";
    }

    for (const quote of filtered) {
        if (quoteTableBody) {
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

            // Can send to customer check: only APPROVED quotes can be sent (Story 2)
            const canSend = quote.status === "APPROVED";

            tr.innerHTML = `
                <td class="quote-code">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span>${escapeHtml(quote.code)}</span>
                        ${verHtml}
                    </div>
                    <div style="font-size:11px; color:#64748b; font-weight:normal; margin-top:2px;">
                        ${escapeHtml(quote.title || "")}
                    </div>
                </td>
                <td>
                    <div style="font-weight:600;">${escapeHtml(quote.customer || "—")}</div>
                    ${quote.opportunityName ? `<div style="font-size:11px; color:#2563eb;">🎯 ${escapeHtml(quote.opportunityName)}</div>` : ''}
                </td>
                <td>
                    <div style="font-weight:700; color:#15803d;">${money(quote.total)}</div>
                    <div style="font-size:11px; color:#64748b;">Gốc: ${money(quote.subtotal)}</div>
                </td>
                <td>
                    <div style="font-weight:600; color:#dc2626;">-${quote.discountPercent.toFixed(1)}%</div>
                    ${levelBadge}
                </td>
                <td>
                    <span class="quote-status ${quote.status.toLowerCase()}">
                        ${statusLabel(quote.status)}
                    </span>
                    ${quote.rejectionReason ? `<div style="font-size:10.5px; color:#ef4444; max-width:140px; margin-top:2px;" title="${escapeHtml(quote.rejectionReason)}">Lý do: ${escapeHtml(quote.rejectionReason)}</div>` : ''}
                </td>
                <td>
                    ${escapeHtml(quote.validUntil || "—")}
                </td>
                <td>
                    <div class="quote-actions" style="flex-wrap: wrap;">
                        <a class="quote-action" href="quote-editor?id=${encodeURIComponent(quote.id)}" title="Chỉnh sửa thông tin">
                            Xem / Sửa
                        </a>

                        ${
                            quote.status === "PENDING_APPROVAL" || quote.status === "CHANGES_REQUESTED"
                            ? `<button type="button" class="quote-action" style="color:#10b981; font-weight:700;" onclick="openApprovalModal(${quote.id})">⚖️ Duyệt</button>`
                            : ""
                        }

                        <button type="button" class="quote-action" style="${canSend ? 'color:#2563eb; font-weight:600;' : 'color:#94a3b8; cursor:not-allowed;'}" 
                                onclick="handleSendToCustomer(${quote.id}, '${quote.status}')" title="${canSend ? 'Gửi báo giá chính thức cho khách' : 'Chỉ báo giá đã duyệt mới gửi được cho khách'}">
                            ✉️ Gửi khách
                        </button>

                        <button type="button" class="quote-action" style="color:#6366f1;" onclick="openHistoryModal(${quote.id})" title="Xem lịch sử phê duyệt bất biến">
                            📜 Lịch sử
                        </button>

                        <button type="button" class="quote-action" style="color:#0284c7;" onclick="openCompareModal(${quote.id})" title="So sánh các phiên bản cạnh nhau">
                            ⚖️ So sánh
                        </button>

                        <button type="button" class="quote-action" style="color:#ef4444;" onclick="handleDeleteQuote(${quote.id})">
                            Xóa
                        </button>
                    </div>
                </td>
            `;
            quoteTableBody.appendChild(tr);
        }

        if (mobileList) {
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
                    <span>Tổng tiền: <b>${money(quote.total)}</b> (CK: ${quote.discountPercent.toFixed(1)}%)</span>
                    <span>Hiệu lực đến: ${escapeHtml(quote.validUntil || "—")}</span>
                </div>
                <div class="quote-mobile-actions">
                    <a class="crm-btn crm-btn-secondary" href="quote-editor?id=${encodeURIComponent(quote.id)}">Xem / Sửa</a>
                    ${
                        quote.status === "PENDING_APPROVAL"
                        ? `<button type="button" class="crm-btn crm-btn-primary" onclick="openApprovalModal(${quote.id})">Duyệt</button>`
                        : ""
                    }
                    <button type="button" class="crm-btn crm-btn-secondary" onclick="handleSendToCustomer(${quote.id}, '${quote.status}')">Gửi khách</button>
                    <button type="button" class="crm-btn crm-btn-secondary" onclick="openCompareModal(${quote.id})">So sánh</button>
                </div>
            `;
            mobileList.appendChild(card);
        }
    }
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
    document.getElementById("approvalModal").style.display = "none";
    activeApprQuoteId = null;
};

// 3 Actions: Approve, Reject, Request Changes (Comment is mandatory for Reject and Request Changes)
document.getElementById("btnApprApprove")?.addEventListener("click", async () => {
    if (!activeApprQuoteId) return;
    const comment = document.getElementById("apprCommentInput")?.value?.trim() || "Đã phê duyệt";
    try {
        await api(`/api/quotes/${activeApprQuoteId}/approve`, {
            method: "POST",
            body: JSON.stringify({ comment })
        });
        alert("Duyệt báo giá thành công!");
        closeApprovalModal();
        await loadQuotes();
    } catch (err) {
        showApprError("Lỗi duyệt báo giá: " + err.message);
    }
});

document.getElementById("btnApprReject")?.addEventListener("click", async () => {
    if (!activeApprQuoteId) return;
    const comment = document.getElementById("apprCommentInput")?.value?.trim();
    if (!comment) {
        showApprError("Bắt buộc nhập ý kiến / lý do khi từ chối báo giá.");
        document.getElementById("apprCommentInput")?.focus();
        return;
    }
    try {
        await api(`/api/quotes/${activeApprQuoteId}/reject`, {
            method: "POST",
            body: JSON.stringify({ comment })
        });
        alert("Đã từ chối báo giá!");
        closeApprovalModal();
        await loadQuotes();
    } catch (err) {
        showApprError("Lỗi từ chối báo giá: " + err.message);
    }
});

document.getElementById("btnApprRequestChanges")?.addEventListener("click", async () => {
    if (!activeApprQuoteId) return;
    const comment = document.getElementById("apprCommentInput")?.value?.trim();
    if (!comment) {
        showApprError("Bắt buộc nhập ý kiến / yêu cầu chỉnh sửa khi trả lại báo giá.");
        document.getElementById("apprCommentInput")?.focus();
        return;
    }
    try {
        await api(`/api/quotes/${activeApprQuoteId}/request-changes`, {
            method: "POST",
            body: JSON.stringify({ comment })
        });
        alert("Đã gửi yêu cầu chỉnh sửa báo giá!");
        closeApprovalModal();
        await loadQuotes();
    } catch (err) {
        showApprError("Lỗi gửi yêu cầu sửa: " + err.message);
    }
});

function showApprError(msg) {
    const el = document.getElementById("apprErrorMsg");
    if (el) {
        el.textContent = msg;
        el.style.display = "block";
    }
}

/* =========================================================
   STORY 2: GỬI BÁO GIÁ CHO KHÁCH (CHỈ GỬI KHI ĐÃ DUYỆT)
========================================================= */
window.handleSendToCustomer = async function(quoteId, status) {
    if (status !== "APPROVED") {
        alert("Chỉ báo giá ở trạng thái ĐÃ DUYỆT (APPROVED) mới được phép gửi cho khách hàng.");
        return;
    }

    if (!confirm("Xác nhận gửi báo giá chính thức này cho khách hàng? Báo giá sẽ được chuyển sang trạng thái ĐÃ GỬI (SENT).")) {
        return;
    }

    try {
        const res = await api(`/api/quotes/${quoteId}/send`, { method: "POST" });
        alert(`Báo giá ${res.quoteNumber || ""} đã được gửi cho khách hàng thành công!`);
        await loadQuotes();
    } catch (err) {
        alert("Lỗi khi gửi báo giá: " + err.message);
    }
};

/* =========================================================
   STORY 2: LỊCH SỬ DUYỆT BẤT BIẾN MODAL
========================================================= */
window.openHistoryModal = async function(quoteId) {
    try {
        const history = await api(`/api/quotes/${quoteId}/approvals`);
        const tbody = document.getElementById("historyTableBody");
        const empty = document.getElementById("historyEmpty");
        tbody.innerHTML = "";

        if (Array.isArray(history) && history.length) {
            empty.style.display = "none";
            history.forEach(h => {
                const tr = document.createElement("tr");
                let actionLabel = h.action;
                let actionColor = "#1e293b";

                if (h.action === "APPROVE") {
                    actionLabel = "✅ Duyệt";
                    actionColor = "#15803d";
                } else if (h.action === "REJECT") {
                    actionLabel = "❌ Từ chối";
                    actionColor = "#b91c1c";
                } else if (h.action === "REQUEST_CHANGES") {
                    actionLabel = "🔄 Yêu cầu sửa";
                    actionColor = "#c2410c";
                }

                const d = h.createdAt ? new Date(h.createdAt).toLocaleString("vi-VN") : "—";

                tr.innerHTML = `
                    <td style="white-space: nowrap;">${d}</td>
                    <td><strong>${escapeHtml(h.approverName || "")}</strong></td>
                    <td><span class="version-chip history">${escapeHtml(h.approverRole || "USER")}</span></td>
                    <td style="color:${actionColor}; font-weight:700;">${actionLabel}</td>
                    <td>${Number(h.discountPercent || 0).toFixed(1)}%</td>
                    <td style="max-width: 260px;">${escapeHtml(h.comment || "—")}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            empty.style.display = "block";
        }

        document.getElementById("historyModal").style.display = "flex";
    } catch (err) {
        alert("Lỗi tải lịch sử duyệt: " + err.message);
    }
};

window.closeHistoryModal = function() {
    document.getElementById("historyModal").style.display = "none";
};

/* =========================================================
   STORY 3: SO SÁNH 2 PHIÊN BẢN CẠNH NHAU (SIDE-BY-SIDE)
========================================================= */
window.openCompareModal = async function(quoteId) {
    currentCompareQuoteId = quoteId;
    try {
        // Fetch quote versions chain
        const versions = await api(`/api/quotes/${quoteId}/versions`);
        compareVersionsList = versions || [];

        const sel1 = document.getElementById("compareSelectV1");
        const sel2 = document.getElementById("compareSelectV2");
        sel1.innerHTML = "";
        sel2.innerHTML = "";

        if (compareVersionsList.length < 2) {
            // If only 1 version, still display it and offer auto comparison or notice
            compareVersionsList.forEach(v => {
                const opt = new Option(`v${v.version} - ${v.quoteNumber} (${statusLabel(v.status)})`, v.id);
                sel1.appendChild(opt.cloneNode(true));
                sel2.appendChild(opt);
            });
        } else {
            compareVersionsList.forEach((v, idx) => {
                const label = `v${v.version} - ${v.quoteNumber} (${statusLabel(v.status)})${v.isActiveVersion ? ' [Hiệu lực]' : ''}`;
                const opt1 = new Option(label, v.id);
                const opt2 = new Option(label, v.id);
                sel1.appendChild(opt1);
                sel2.appendChild(opt2);
            });
            // Default select v1 = earliest, v2 = latest
            sel1.selectedIndex = compareVersionsList.length - 1;
            sel2.selectedIndex = 0;
        }

        document.getElementById("compareModal").style.display = "flex";
        await executeComparison();
    } catch (err) {
        alert("Lỗi khi mở so sánh phiên bản: " + err.message);
    }
};

window.closeCompareModal = function() {
    document.getElementById("compareModal").style.display = "none";
};

document.getElementById("btnExecuteCompare")?.addEventListener("click", () => {
    executeComparison();
});

async function executeComparison() {
    const v1Id = document.getElementById("compareSelectV1")?.value;
    const v2Id = document.getElementById("compareSelectV2")?.value;

    if (!v1Id || !v2Id) return;

    try {
        const diffData = await api(`/api/quotes/compare?v1=${v1Id}&v2=${v2Id}`);
        renderComparisonResult(diffData);
    } catch (err) {
        alert("Lỗi khi so sánh hai phiên bản: " + err.message);
    }
}

function renderComparisonResult(data) {
    const q1 = data.quote1;
    const q2 = data.quote2;

    document.getElementById("thVer1Title").innerHTML = `v${q1.version} (${escapeHtml(q1.quoteNumber)}) ${q1.isActiveVersion ? '<span class="version-chip active">Hiệu lực</span>' : ''}`;
    document.getElementById("thVer2Title").innerHTML = `v${q2.version} (${escapeHtml(q2.quoteNumber)}) ${q2.isActiveVersion ? '<span class="version-chip active">Hiệu lực</span>' : ''}`;
    document.getElementById("thItemVer1Title").innerHTML = `v${q1.version} (${escapeHtml(q1.quoteNumber)})`;
    document.getElementById("thItemVer2Title").innerHTML = `v${q2.version} (${escapeHtml(q2.quoteNumber)})`;

    // 1. Header differences
    const headerBody = document.getElementById("compareHeaderBody");
    headerBody.innerHTML = "";

    const headers = data.headerDiff || {};
    for (const [key, field] of Object.entries(headers)) {
        const tr = document.createElement("tr");
        if (field.changed) tr.className = "diff-row-changed";

        let val1 = field.v1 ?? "—";
        let val2 = field.v2 ?? "—";

        if (key === "totalAmount" || key === "subtotal") {
            val1 = money(val1);
            val2 = money(val2);
        } else if (key === "discountPercent") {
            val1 = `${Number(val1).toFixed(1)}%`;
            val2 = `${Number(val2).toFixed(1)}%`;
        } else if (key === "status") {
            val1 = statusLabel(val1);
            val2 = statusLabel(val2);
        }

        tr.innerHTML = `
            <td style="font-weight:600;">${escapeHtml(field.label)}</td>
            <td>${escapeHtml(val1)}</td>
            <td style="${field.changed ? 'font-weight:700; color:#b45309;' : ''}">${escapeHtml(val2)}</td>
            <td style="text-align: center;">
                <span class="diff-tag ${field.changed ? 'mod' : 'same'}">
                    ${field.changed ? '✏️ Đổi' : 'Giống'}
                </span>
            </td>
        `;
        headerBody.appendChild(tr);
    }

    // 2. Item differences
    const itemsBody = document.getElementById("compareItemsBody");
    itemsBody.innerHTML = "";

    const itemDiffs = data.itemDiffs || [];
    itemDiffs.forEach(row => {
        const tr = document.createElement("tr");
        let tagClass = "same";
        let tagLabel = "Không đổi";

        if (row.diffType === "ADDED") {
            tr.className = "diff-row-added";
            tagClass = "add";
            tagLabel = "+ Mới thêm";
        } else if (row.diffType === "REMOVED") {
            tr.className = "diff-row-removed";
            tagClass = "del";
            tagLabel = "- Đã xóa";
        } else if (row.diffType === "MODIFIED") {
            tr.className = "diff-row-changed";
            tagClass = "mod";
            tagLabel = "✏️ Sửa";
        }

        const i1 = row.item1;
        const i2 = row.item2;

        const str1 = i1 ? `${i1.quantity} × ${money(i1.unitPrice)} | CK: ${Number(i1.discountPercent || 0)}% ➔ <b>${money(i1.amount)}</b>` : '—';
        const str2 = i2 ? `${i2.quantity} × ${money(i2.unitPrice)} | CK: ${Number(i2.discountPercent || 0)}% ➔ <b>${money(i2.amount)}</b>` : '—';

        tr.innerHTML = `
            <td><strong>${escapeHtml(row.productName || "Sản phẩm")}</strong></td>
            <td style="text-align: center;"><span class="diff-tag ${tagClass}">${tagLabel}</span></td>
            <td>${str1}</td>
            <td style="${row.diffType === 'MODIFIED' || row.diffType === 'ADDED' ? 'font-weight:600;' : ''}">${str2}</td>
        `;
        itemsBody.appendChild(tr);
    });

    // Summary badge
    const amtDiff = Number(data.amountDiff || 0);
    const badgeEl = document.getElementById("compareDiffSummaryBadge");
    if (badgeEl) {
        badgeEl.textContent = `Chênh lệch thanh toán (v2 - v1): ${amtDiff >= 0 ? '+' : ''}${money(amtDiff)}`;
        badgeEl.style.color = amtDiff >= 0 ? '#15803d' : '#dc2626';
    }

    // Bind "Set active version" button
    const btnActive = document.getElementById("btnSetActiveVersion");
    if (btnActive) {
        btnActive.onclick = async () => {
            if (confirm(`Đặt phiên bản v${q2.version} (${q2.quoteNumber}) làm phiên bản HIỆU LỰC DUY NHẤT của chuỗi báo giá này?`)) {
                try {
                    await api(`/api/quotes/${q2.id}/set-active`, { method: "POST" });
                    alert(`Đã kích hoạt phiên bản v${q2.version} làm hiệu lực thành công!`);
                    closeCompareModal();
                    await loadQuotes();
                } catch (err) {
                    alert("Lỗi kích hoạt phiên bản: " + err.message);
                }
            }
        };
    }
}

/* =========================================================
   DELETE QUOTE
========================================================= */
window.handleDeleteQuote = async function(id) {
    if (confirm("Bạn có chắc chắn muốn xóa báo giá này không?")) {
        try {
            await api(`/api/quotes/${id}`, { method: "DELETE" });
            quotes = quotes.filter(q => q.id !== id);
            saveQuotesCache();
            render();
        } catch (err) {
            alert("Lỗi khi xóa báo giá: " + err.message);
        }
    }
};

/* =========================================================
   SEARCH & FILTERS
========================================================= */
search?.addEventListener("input", render);
statusFilter?.addEventListener("change", render);

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
        case "REJECTED":
            return "Từ chối";
        case "CHANGES_REQUESTED":
            return "Yêu cầu sửa";
        case "SENT":
            return "Đã gửi khách";
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
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

// Start
loadQuotes();