"use strict";

/* =========================================================
   CONTRACTS CONTROLLER (SCRUM-93 / SCRUM-237 [FE])
   Quản lý danh sách Hợp đồng kinh tế chuyển đổi từ Báo giá
========================================================= */

const STORAGE_KEY_CONTRACTS = "crm_ui_contracts";

let contracts = [];

const tableBody = document.getElementById("contractsTableBody");
const emptyState = document.getElementById("contractsEmpty");
const searchInput = document.getElementById("contractSearch");
const statusFilter = document.getElementById("contractStatusFilter");
const resetBtn = document.getElementById("btnResetFilter");

const detailDrawer = document.getElementById("contractDetailDrawer");
const detailOverlay = document.getElementById("contractDetailOverlay");
const closeDetailBtn = document.getElementById("btnCloseDetailDrawer");

/* =========================================================
   SAMPLE SEED DATA IF EMPTY
========================================================= */
function ensureSeedContracts() {
    let saved = [];
    try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY_CONTRACTS)) || [];
    } catch (_) {
        saved = [];
    }

    if (!Array.isArray(saved) || saved.length === 0) {
        saved = [
            {
                id: "contract_1729500001",
                contractNumber: "HD-20261021-001",
                signedDate: "2026-10-21",
                effectiveDate: "2026-10-21",
                expiryDate: "2027-10-20",
                paymentTerms: "Đợt 1: Tạm ứng 50% ngay sau khi ký hợp đồng. Đợt 2: Thanh toán 50% còn lại trong vòng 7 ngày sau khi nghiệm thu bàn giao.",
                notes: "Bao gồm gói bảo hành tiêu chuẩn 12 tháng tại 3 nhà máy KCN Quế Võ và Đình Trám.",
                quoteId: 101,
                quoteCode: "BG-2026-001",
                customer: "Tập đoàn Công nghiệp Foxconn VN",
                customerId: 1,
                opportunity: "Triển khai ERP Foxconn Đình Trám & Quế Võ",
                opportunityId: 1001,
                total: 850000000,
                status: "ACTIVE",
                lines: [
                    { product: "Gói giải pháp Quản trị Sản xuất ERP Cloud (License 100 User)", quantity: 1, price: 500000000, discount: 5, vat: 10, total: 475000000 },
                    { product: "Dịch vụ Tích hợp API Dây chuyền Tự động hóa & Barcode", quantity: 1, price: 250000000, discount: 0, vat: 10, total: 250000000 },
                    { product: "Đào tạo & Chuyển giao Vận hành hệ thống (3 tháng)", quantity: 1, price: 150000000, discount: 10, vat: 10, total: 135000000 }
                ],
                createdAt: "2026-10-21T08:30:00.000Z"
            },
            {
                id: "contract_1729500002",
                contractNumber: "HD-20261019-002",
                signedDate: "2026-10-19",
                effectiveDate: "2026-10-20",
                expiryDate: "2027-10-19",
                paymentTerms: "Thanh toán 100% giá trị hợp đồng trong vòng 7 ngày làm việc kể từ ngày ký.",
                notes: "Hỗ trợ kỹ thuật 24/7 trong suốt mùa cao điểm du lịch.",
                quoteId: 102,
                quoteCode: "BG-2026-002",
                customer: "Công ty TNHH Dịch vụ & Du lịch Viettravel Sun",
                customerId: 2,
                opportunity: "Số hóa quy trình Booking Tour Viettravel",
                opportunityId: 1002,
                total: 320000000,
                status: "ACTIVE",
                lines: [
                    { product: "Module Đặt Tour & Thanh toán Trực tuyến Đa kênh", quantity: 1, price: 200000000, discount: 10, vat: 8, total: 180000000 },
                    { product: "Tổng đài Chăm sóc Khách hàng IP Call Center Cloud", quantity: 1, price: 150000000, discount: 5, vat: 8, total: 140000000 }
                ],
                createdAt: "2026-10-19T14:00:00.000Z"
            }
        ];
        localStorage.setItem(STORAGE_KEY_CONTRACTS, JSON.stringify(saved));
    }
}

/* =========================================================
   LOAD & RENDER
========================================================= */
function loadContracts() {
    ensureSeedContracts();
    try {
        contracts = JSON.parse(localStorage.getItem(STORAGE_KEY_CONTRACTS)) || [];
    } catch (_) {
        contracts = [];
    }
    render();
}

function render() {
    const query = (searchInput?.value || "").toLowerCase().trim();
    const stFilter = statusFilter?.value || "";

    const filtered = contracts.filter(c => {
        const text = `${c.contractNumber || ""} ${c.customer || ""} ${c.opportunity || ""} ${c.quoteCode || ""}`.toLowerCase();
        if (query && !text.includes(query)) return false;
        if (stFilter && (c.status || "").toUpperCase() !== stFilter.toUpperCase()) return false;
        return true;
    });

    // Update KPI Stats
    updateSummaryStats(contracts);

    // Render Table Rows
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = "flex";
        return;
    }

    if (emptyState) emptyState.style.display = "none";

    filtered.forEach(c => {
        const tr = document.createElement("tr");

        const statusLabel = getStatusLabel(c.status);
        const statusClass = (c.status || "ACTIVE").toLowerCase();

        tr.innerHTML = `
            <td>
                <span class="contract-num-text">
                    📑 ${escapeHtml(c.contractNumber)}
                </span>
            </td>
            <td>
                <strong>${escapeHtml(c.customer || "—")}</strong>
            </td>
            <td>
                <span style="color:var(--crm-muted); font-size:12px;">
                    ${escapeHtml(c.opportunity || "—")}
                </span>
            </td>
            <td style="text-align:right; font-weight:700; color:var(--crm-primary);">
                ${money(c.total)}
            </td>
            <td>
                <span>📅 ${c.signedDate || "—"}</span>
            </td>
            <td>
                <span style="font-size:12px;">
                    ${c.effectiveDate || "—"} 
                    ${c.expiryDate ? `<span style="color:var(--crm-muted);">đến</span> ${c.expiryDate}` : ""}
                </span>
            </td>
            <td>
                <a href="quotations.html?search=${encodeURIComponent(c.quoteCode || '')}" class="quote-link-badge" title="Xem báo giá gốc">
                    ▤ ${escapeHtml(c.quoteCode || "BG-000")}
                </a>
            </td>
            <td>
                <span class="contract-status-badge ${statusClass}">
                    ${statusLabel}
                </span>
            </td>
            <td style="text-align:right;">
                <button type="button" class="crm-btn crm-btn-secondary" style="min-height:26px; padding:2px 8px; font-size:11.5px;" data-view-contract="${c.id}">
                    Chi tiết
                </button>
            </td>
        `;

        tableBody.appendChild(tr);
    });
}

function updateSummaryStats(all) {
    const totalCount = all.length;
    const totalVal = all.reduce((sum, c) => sum + Number(c.total || 0), 0);
    const activeCount = all.filter(c => (c.status || "ACTIVE").toUpperCase() === "ACTIVE").length;
    const expiredCount = all.filter(c => (c.status || "").toUpperCase() === "EXPIRED").length;

    setText("statTotalContracts", totalCount);
    setText("statTotalValue", money(totalVal));
    setText("statActiveContracts", activeCount);
    setText("statExpiredContracts", expiredCount);
}

function getStatusLabel(st) {
    switch ((st || "ACTIVE").toUpperCase()) {
        case "ACTIVE": return "Đang hiệu lực";
        case "EXPIRED": return "Đã hết hạn";
        case "TERMINATED": return "Đã thanh lý";
        default: return "Đang hiệu lực";
    }
}

/* =========================================================
   DETAIL DRAWER
========================================================= */
function openDetail(contract) {
    if (!contract) return;

    setText("drawerContractNumber", `Hợp đồng: ${contract.contractNumber}`);
    setText("drawerCustomerName", contract.customer || "Khách hàng");

    setText("detailCustomer", contract.customer || "—");
    setText("detailOpportunity", contract.opportunity || "—");
    setText("detailQuoteCode", contract.quoteCode || "—");
    setText("detailTotal", money(contract.total));
    setText("detailSignedDate", contract.signedDate || "—");
    setText("detailEffectiveDate", contract.effectiveDate || "—");
    setText("detailExpiryDate", contract.expiryDate || "Không xác định");
    setText("detailStatus", getStatusLabel(contract.status));

    setText("detailPaymentTerms", contract.paymentTerms || "Chưa có thông tin điều khoản thanh toán.");
    setText("detailNotes", contract.notes || "Không có ghi chú thêm.");

    // Render Lines
    const linesBody = document.getElementById("detailLinesBody");
    if (linesBody) {
        linesBody.innerHTML = "";
        const lines = contract.lines || [];
        if (lines.length === 0) {
            linesBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:14px; color:var(--crm-muted);">Dịch vụ trọn gói theo báo giá</td></tr>`;
        } else {
            lines.forEach(line => {
                const tr = document.createElement("tr");
                const qty = Number(line.quantity || 1);
                const price = Number(line.price || 0);
                const discount = Number(line.discount || 0);
                const vat = Number(line.vat || 10);
                const total = line.total || (qty * price * (1 - discount / 100));

                tr.innerHTML = `
                    <td><strong>${escapeHtml(line.product || "Sản phẩm")}</strong></td>
                    <td style="text-align:center;">${qty}</td>
                    <td style="text-align:right;">${money(price)}</td>
                    <td style="text-align:center;">${discount > 0 ? `${discount}%` : "—"}</td>
                    <td style="text-align:center;">${vat}%</td>
                    <td style="text-align:right; font-weight:700; color:var(--crm-primary);">${money(total)}</td>
                `;
                linesBody.appendChild(tr);
            });
        }
    }

    detailDrawer?.classList.add("open");
    detailOverlay?.classList.add("open");
}

function closeDetail() {
    detailDrawer?.classList.remove("open");
    detailOverlay?.classList.remove("open");
}

/* =========================================================
   HELPERS & EVENT LISTENERS
========================================================= */
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "";
}

function money(val) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(val) || 0);
}

function escapeHtml(val) {
    return String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
    loadContracts();

    searchInput?.addEventListener("input", render);
    statusFilter?.addEventListener("change", render);

    resetBtn?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (statusFilter) statusFilter.value = "";
        render();
    });

    closeDetailBtn?.addEventListener("click", closeDetail);
    detailOverlay?.addEventListener("click", closeDetail);

    document.addEventListener("click", event => {
        const btn = event.target.closest("[data-view-contract]");
        if (btn) {
            const id = btn.dataset.viewContract;
            const item = contracts.find(c => String(c.id) === String(id));
            if (item) openDetail(item);
        }
    });
});
