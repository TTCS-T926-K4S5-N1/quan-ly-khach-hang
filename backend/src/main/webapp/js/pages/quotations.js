"use strict";

const API_BASE = "http://localhost:8080/crm";

let quotes = [];

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
        window.location.href = "login.html";
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
                opportunity: "Triển khai ERP Foxconn Đình Trám & Quế Võ",
                opportunityId: 1001,
                total: 850000000,
                subtotal: 900000000,
                discountPercent: 5.5,
                vatPercent: 10,
                status: "approved",
                validUntil: "2026-11-15",
                paymentTerms: "Đợt 1: Tạm ứng 50% ngay sau khi ký hợp đồng. Đợt 2: Thanh toán 50% còn lại trong vòng 7 ngày sau khi nghiệm thu bàn giao.",
                lines: [
                    { product: "Gói giải pháp Quản trị Sản xuất ERP Cloud (License 100 User)", quantity: 1, price: 500000000, discount: 5, vat: 10, total: 475000000 },
                    { product: "Dịch vụ Tích hợp API Dây chuyền Tự động hóa & Barcode", quantity: 1, price: 250000000, discount: 0, vat: 10, total: 250000000 },
                    { product: "Đào tạo & Chuyển giao Vận hành hệ thống (3 tháng)", quantity: 1, price: 150000000, discount: 10, vat: 10, total: 135000000 }
                ]
            },
            {
                id: 102,
                code: "BG-2026-002",
                title: "Báo giá Nâng cấp Hạ tầng & Phần mềm Du lịch",
                customer: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun",
                customerId: 2,
                opportunity: "Số hóa quy trình Booking Tour Viettravel",
                opportunityId: 1002,
                total: 320000000,
                subtotal: 350000000,
                discountPercent: 8.5,
                vatPercent: 8,
                status: "approved",
                validUntil: "2026-11-30",
                paymentTerms: "Thanh toán 100% giá trị hợp đồng trong vòng 7 ngày làm việc kể từ ngày ký.",
                lines: [
                    { product: "Module Đặt Tour & Thanh toán Trực tuyến Đa kênh", quantity: 1, price: 200000000, discount: 10, vat: 8, total: 180000000 },
                    { product: "Tổng đài Chăm sóc Khách hàng IP Call Center Cloud", quantity: 1, price: 150000000, discount: 5, vat: 8, total: 140000000 }
                ]
            },
            {
                id: 103,
                code: "BG-2026-003",
                title: "Báo giá Triển khai Phần mềm Khách hàng Thân thiết",
                customer: "Chuỗi Bán lẻ Thời trang NEM Fashion",
                customerId: 3,
                opportunity: "Tích hợp Loyalty System 50 Showroom NEM",
                opportunityId: 1003,
                total: 185000000,
                subtotal: 185000000,
                discountPercent: 0,
                vatPercent: 8,
                status: "pending",
                validUntil: "2026-11-10",
                paymentTerms: "Đợt 1: Tạm ứng 50% khi ký. Đợt 2: 50% khi nghiệm thu.",
                lines: [
                    { product: "Phần mềm Tích điểm & Thẻ thành viên NEM Fashion App", quantity: 1, price: 185000000, discount: 0, vat: 8, total: 185000000 }
                ]
            },
            {
                id: 104,
                code: "BG-2026-004",
                title: "Báo giá Cung cấp Giải pháp Core Banking API",
                customer: "Ngân hàng TMCP VPBank - CN Thăng Long",
                customerId: 4,
                opportunity: "Gói giải pháp API Gateway VPBank",
                opportunityId: 1004,
                total: 620000000,
                subtotal: 650000000,
                discountPercent: 4.6,
                vatPercent: 10,
                status: "converted",
                contractNumber: "HD-20261019-001",
                validUntil: "2026-10-31",
                paymentTerms: "Thanh toán theo tiến độ 3 đợt: 40 - 30 - 30.",
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
    let st = (q.status || "DRAFT").toLowerCase();
    if (st === "pending_approval") st = "pending";

    return {
        id: q.id,
        code: q.quoteNumber || q.code || `BG-${q.id}`,
        title: q.title || "",
        customer: q.customerName || q.customer || "Khách hàng",
        customerId: q.customerId,
        opportunity: q.opportunityName || q.opportunity || "Cơ hội kinh doanh",
        opportunityId: q.opportunityId,
        total: Number(q.totalAmount || q.total || 0),
        subtotal: Number(q.subtotal || 0),
        discountPercent: Number(q.discountPercent || 0),
        status: st,
        requiresApproval: !!q.requiresApproval,
        validUntil: q.validUntil || (q.createdAt ? q.createdAt.split("T")[0] : "—"),
        lines: q.items || q.lines || []
    };
}

function saveQuotesCache() {
    try {
        localStorage.setItem("crm_ui_quotes", JSON.stringify(quotes));
    } catch (_) {}
}

/* =========================================================
   RENDER
========================================================= */
function render() {
    const query = search ? search.value.trim().toLowerCase() : "";
    const status = statusFilter ? statusFilter.value : "";

    const filtered = quotes.filter(quote => {
        const text = `${quote.code || ""} ${quote.customer || ""} ${quote.title || ""} ${quote.opportunity || ""}`.toLowerCase();
        const searchOk = !query || text.includes(query);
        const statusOk = !status || quote.status === status;
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
            tr.innerHTML = `
                <td class="quote-code">
                    ${escapeHtml(quote.code)}
                </td>
                <td>
                    <strong>${escapeHtml(quote.customer || "—")}</strong>
                    ${quote.opportunity ? `<div style="font-size:11px; color:var(--crm-muted);">${escapeHtml(quote.opportunity)}</div>` : ''}
                </td>
                <td style="font-weight:700; color:var(--crm-primary);">
                    ${money(quote.total)}
                </td>
                <td>
                    ${Number(quote.discountPercent || 0).toFixed(1)}%
                </td>
                <td>
                    <span class="quote-status ${quote.status}">
                        ${statusLabel(quote.status)}
                    </span>
                    ${quote.requiresApproval ? '<span style="font-size:10px;color:#ef4444;display:block;">(Cần duyệt giá sàn)</span>' : ''}
                </td>
                <td>
                    ${escapeHtml(quote.validUntil || "—")}
                </td>
                <td>
                    <div class="quote-actions">
                        <a class="quote-action" href="quote-editor.html?id=${encodeURIComponent(quote.id)}">
                            Xem / Sửa
                        </a>
                        ${
                            quote.status === "pending" || (quote.status === "draft" && quote.requiresApproval)
                            ? `<button type="button" class="quote-action" style="color:#10b981;cursor:pointer;" data-approve-quote="${quote.id}">Duyệt</button>`
                            : ""
                        }
                        ${
                            quote.status === "approved"
                            ? `<a class="quote-action contract" href="contract-create.html?id=${encodeURIComponent(quote.id)}" title="Chuyển báo giá đã duyệt thành Hợp đồng kinh tế">✓ Tạo HĐ</a>`
                            : ""
                        }
                        ${
                            quote.status === "converted"
                            ? `<a class="quote-action view-contract" href="contracts.html?search=${encodeURIComponent(quote.code || '')}" title="Xem Hợp đồng đã tạo">📑 Xem HĐ</a>`
                            : ""
                        }
                        <button type="button" class="quote-action" style="color:#ef4444;cursor:pointer;" data-delete-quote="${quote.id}">
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
                        <strong>${escapeHtml(quote.code)}</strong>
                        <div style="margin-top:5px"><strong>${escapeHtml(quote.customer || "—")}</strong></div>
                    </div>
                    <span class="quote-status ${quote.status}">
                        ${statusLabel(quote.status)}
                    </span>
                </div>
                <div class="quote-mobile-info">
                    <span>Tổng: <strong style="color:var(--crm-primary);">${money(quote.total)}</strong></span>
                    <span>Chiết khấu: ${Number(quote.discountPercent || 0).toFixed(1)}%</span>
                    <span>Hiệu lực: ${escapeHtml(quote.validUntil || "—")}</span>
                </div>
                <div class="quote-mobile-actions">
                    <a class="crm-btn crm-btn-secondary" style="text-decoration:none" href="quote-editor.html?id=${encodeURIComponent(quote.id)}">
                        Xem / Sửa
                    </a>
                    ${
                        quote.status === "pending" || (quote.status === "draft" && quote.requiresApproval)
                        ? `<button type="button" class="crm-btn crm-btn-secondary" style="color:#10b981" data-approve-quote="${quote.id}">Duyệt</button>`
                        : ""
                    }
                    ${
                        quote.status === "approved"
                        ? `<a class="crm-btn crm-btn-primary" style="text-decoration:none" href="contract-create.html?id=${encodeURIComponent(quote.id)}">✓ Tạo Hợp đồng</a>`
                        : ""
                    }
                    ${
                        quote.status === "converted"
                        ? `<a class="crm-btn crm-btn-secondary" style="text-decoration:none; color:#6d28d9;" href="contracts.html?search=${encodeURIComponent(quote.code || '')}">📑 Xem HĐ</a>`
                        : ""
                    }
                    <button type="button" class="crm-btn crm-btn-secondary" style="color:#ef4444" data-delete-quote="${quote.id}">Xóa</button>
                </div>
            `;
            mobileList.appendChild(card);
        }
    }
}

/* =========================================================
   ACTIONS
========================================================= */
document.addEventListener("click", async event => {
    const delBtn = event.target.closest("[data-delete-quote]");
    if (delBtn) {
        const id = delBtn.dataset.deleteQuote;
        if (confirm("Bạn có chắc chắn muốn xóa báo giá này không?")) {
            try {
                if (typeof Number(id) === "number" && !isNaN(Number(id))) {
                    await api(`/api/quotes/${id}`, { method: "DELETE" });
                }
                quotes = quotes.filter(q => String(q.id) !== String(id));
                saveQuotesCache();
                render();
            } catch (err) {
                alert("Lỗi khi xóa báo giá: " + err.message);
            }
        }
        return;
    }

    const appBtn = event.target.closest("[data-approve-quote]");
    if (appBtn) {
        const id = appBtn.dataset.approveQuote;
        if (confirm("Xác nhận phê duyệt báo giá này? Báo giá sau khi duyệt sẽ sẵn sàng để Kế toán chuyển thành Hợp đồng.")) {
            try {
                if (typeof Number(id) === "number" && !isNaN(Number(id))) {
                    await api(`/api/quotes/${id}/status`, {
                        method: "POST",
                        body: JSON.stringify({ status: "APPROVED" })
                    });
                }
            } catch (e) {
                console.warn("Backend API not reachable, updating locally:", e);
            }

            const qIndex = quotes.findIndex(q => String(q.id) === String(id));
            if (qIndex !== -1) {
                quotes[qIndex].status = "approved";
                saveQuotesCache();
                render();
            }
        }
    }
});

function statusLabel(status) {
    switch (status) {
        case "pending":
            return "Chờ duyệt";
        case "approved":
            return "Đã duyệt";
        case "converted":
            return "Đã tạo Hợp đồng";
        case "rejected":
            return "Từ chối";
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
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    if (searchParam && search) {
        search.value = searchParam;
    }

    search?.addEventListener("input", render);
    statusFilter?.addEventListener("change", render);

    loadQuotes();
});