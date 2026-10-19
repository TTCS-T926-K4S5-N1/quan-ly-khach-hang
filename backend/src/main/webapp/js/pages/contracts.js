"use strict";

const API_BASE = "http://localhost:8080/crm";

let contractsList = [];
let activeFilter = "ALL";
let currentThreshold = 30;
let searchKeyword = "";

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
   FORMATTERS
========================================================= */
function formatMoney(amount) {
    if (amount == null) return "0 ₫";
    return Number(amount).toLocaleString("vi-VN") + " ₫";
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("vi-VN");
    } catch (_) {
        return dateStr;
    }
}

function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   DATA LOADING
========================================================= */
async function loadContractSettings() {
    try {
        const data = await api("/api/contracts/settings");
        if (data && data.expiringThresholdDays) {
            currentThreshold = Number(data.expiringThresholdDays);
            updateThresholdDisplays(currentThreshold);
        }
    } catch (err) {
        console.warn("Could not load threshold settings:", err);
    }
}

function updateThresholdDisplays(days) {
    document.querySelectorAll(".threshold-display").forEach(el => el.textContent = days);
    const badge = document.getElementById("lblThresholdBadge");
    if (badge) badge.textContent = `${days} ngày`;
    const input = document.getElementById("inputThresholdDays");
    if (input) input.value = days;
}

async function loadContractSummary() {
    try {
        const summary = await api(`/api/contracts/summary?threshold=${currentThreshold}`);
        if (!summary) return;

        document.getElementById("kpiTotalCount").textContent = summary.totalCount || 0;
        document.getElementById("kpiTotalValue").textContent = formatMoney(summary.totalContractValue);
        document.getElementById("kpiActiveCount").textContent = summary.activeCount || 0;
        document.getElementById("kpiExpiringCount").textContent = summary.expiringSoonCount || 0;
        document.getElementById("kpiExpiringAmount").textContent = formatMoney(summary.expiringSoonAmount);
        document.getElementById("kpiExpiredCount").textContent = summary.expiredCount || 0;
        document.getElementById("kpiRenewedCount").textContent = summary.renewedCount || 0;

        document.getElementById("badgeAll").textContent = summary.totalCount || 0;
        document.getElementById("badgeExpiringSoon").textContent = summary.expiringSoonCount || 0;
        document.getElementById("badgeExpired").textContent = summary.expiredCount || 0;
        document.getElementById("badgeActive").textContent = summary.activeCount || 0;
        document.getElementById("badgeRenewed").textContent = summary.renewedCount || 0;
    } catch (err) {
        console.error("Failed to load contract summary:", err);
    }
}

async function loadContracts() {
    const tbody = document.getElementById("contractsTableBody");
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #94a3b8;">⏳ Đang tải dữ liệu hợp đồng...</td></tr>`;

    try {
        let url = `/api/contracts?status=${encodeURIComponent(activeFilter)}&threshold=${currentThreshold}`;
        if (searchKeyword.trim()) {
            url += `&keyword=${encodeURIComponent(searchKeyword.trim())}`;
        }

        const data = await api(url);
        contractsList = Array.isArray(data) ? data : [];
        renderContractsTable();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #ef4444;">❌ Lỗi tải hợp đồng: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderContractsTable() {
    const tbody = document.getElementById("contractsTableBody");
    if (!contractsList || contractsList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <div style="font-size: 32px; margin-bottom: 8px;">📜</div>
                    <div style="font-weight: 600; font-size: 15px; color: #475569;">Không tìm thấy hợp đồng nào</div>
                    <div style="font-size: 13px; margin-top: 4px;">Thử thay đổi bộ lọc hoặc tạo hợp đồng mới từ báo giá.</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = contractsList.map(c => {
        // Expiry & Days remaining badge
        let daysBadge = "";
        const days = c.daysRemaining;
        if (days == null) {
            daysBadge = `<span class="days-remaining-badge" style="background:#f1f5f9; color:#64748b;">Vô thời hạn</span>`;
        } else if (days < 0) {
            daysBadge = `<span class="days-remaining-badge badge-danger">🚨 Quá hạn ${Math.abs(days)} ngày</span>`;
        } else if (days <= currentThreshold) {
            daysBadge = `<span class="days-remaining-badge badge-warning">⚠️ Còn ${days} ngày</span>`;
        } else {
            daysBadge = `<span class="days-remaining-badge badge-safe">Còn ${days} ngày</span>`;
        }

        // Status badge
        let statusBadge = "";
        const st = c.status || "ACTIVE";
        if (st === "EXPIRING_SOON") {
            statusBadge = `<span class="contract-status-tag status-expiring">⚠️ Sắp hết hạn</span>`;
        } else if (st === "EXPIRED") {
            statusBadge = `<span class="contract-status-tag status-expired">🚨 Đã hết hạn</span>`;
        } else if (st === "RENEWED") {
            statusBadge = `<span class="contract-status-tag status-renewed">🔄 Đã gia hạn</span>`;
        } else if (st === "TERMINATED") {
            statusBadge = `<span class="contract-status-tag" style="background:#f1f5f9; color:#64748b;">Đã thanh lý</span>`;
        } else {
            statusBadge = `<span class="contract-status-tag status-active">✅ Đang hiệu lực</span>`;
        }

        // Renewal Action
        let renewAction = "";
        if (c.renewalOpportunityId) {
            renewAction = `
                <a href="pipeline" class="contract-action-btn btn-renewed" title="Xem cơ hội gia hạn trên Pipeline: ${escapeHtml(c.renewalOpportunityName || '')}">
                    🔗 Cơ hội #${c.renewalOpportunityId}
                </a>
            `;
        } else {
            renewAction = `
                <button type="button" class="contract-action-btn btn-renew" onclick="openRenewModal(${c.id})" title="Tạo cơ hội gia hạn từ hợp đồng này">
                    🔄 Gia hạn
                </button>
            `;
        }

        return `
            <tr data-id="${c.id}">
                <td>
                    <a href="javascript:void(0)" onclick="openDetailModal(${c.id})" style="font-weight: 700; color: var(--primary, #2563eb); text-decoration: none;">
                        ${escapeHtml(c.contractNumber)}
                    </a>
                </td>
                <td>
                    <div style="font-weight: 600; color: #0f172a;">${escapeHtml(c.customerName || "—")}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${escapeHtml(c.title || "—")}</div>
                </td>
                <td style="font-weight: 700; color: #059669; white-space: nowrap;">
                    ${formatMoney(c.totalAmount)}
                </td>
                <td style="font-size: 12.5px; white-space: nowrap;">
                    <div>Ký: ${formatDate(c.signedDate)}</div>
                    <div style="color: #64748b;">Hiệu lực: ${formatDate(c.effectiveDate)}</div>
                </td>
                <td style="white-space: nowrap;">
                    <div style="font-weight: 600; margin-bottom: 3px;">${formatDate(c.expiryDate)}</div>
                    ${daysBadge}
                </td>
                <td>${statusBadge}</td>
                <td style="font-size: 12.5px; color: #475569; white-space: nowrap;">
                    ${escapeHtml(c.ownerName || "Hệ thống")}
                </td>
                <td style="text-align: right; white-space: nowrap;">
                    <div class="contract-actions" style="justify-content: flex-end;">
                        ${renewAction}
                        <a href="contract-print.html?id=${c.id}" target="_blank" class="contract-action-btn" title="In / Xuất PDF Hợp đồng">
                            🖨️ In
                        </a>
                        <button type="button" class="contract-action-btn" onclick="openDetailModal(${c.id})" title="Xem chi tiết">
                            👁️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

/* =========================================================
   MODAL: TẠO CƠ HỘI GIA HẠN (Story 1 AC)
========================================================= */
function openRenewModal(contractId) {
    const contract = contractsList.find(c => c.id === contractId);
    if (!contract) return;

    document.getElementById("renewContractId").value = contract.id;
    document.getElementById("renewContractNumber").textContent = contract.contractNumber;
    document.getElementById("renewCustomerName").textContent = contract.customerName || "—";
    document.getElementById("renewContractTotal").textContent = formatMoney(contract.totalAmount);
    document.getElementById("renewExpiryDate").textContent = formatDate(contract.expiryDate);

    // Pre-fill Title & Amount
    document.getElementById("renewOppTitle").value = `Gia hạn HĐ ${contract.contractNumber} - ${contract.customerName || ''}`;
    document.getElementById("renewOppAmount").value = contract.totalAmount || 0;
    document.getElementById("renewNotes").value = "";

    document.getElementById("modalRenewContract").classList.add("active");
}

function closeRenewModal() {
    document.getElementById("modalRenewContract").classList.remove("active");
}

async function submitRenewForm() {
    const contractId = document.getElementById("renewContractId").value;
    const title = document.getElementById("renewOppTitle").value.trim();
    const amount = document.getElementById("renewOppAmount").value;
    const notes = document.getElementById("renewNotes").value.trim();

    if (!title) {
        alert("Vui lòng nhập tiêu đề cho Cơ hội gia hạn.");
        return;
    }

    const btn = document.getElementById("btnSubmitRenew");
    btn.disabled = true;
    btn.textContent = "⏳ Đang tạo cơ hội gia hạn...";

    try {
        const result = await api(`/api/contracts/${contractId}/renew`, {
            method: "POST",
            body: JSON.stringify({
                title: title,
                amount: amount ? Number(amount) : null,
                notes: notes
            })
        });

        closeRenewModal();
        alert(`✅ Đã tạo thành công Cơ hội gia hạn #${result.opportunityId} ("${result.opportunityName}")!\nToàn bộ sản phẩm đã được kế thừa vào cơ hội.`);

        // Reload data
        await loadContractSummary();
        await loadContracts();
    } catch (err) {
        alert("Lỗi tạo cơ hội gia hạn: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "🚀 Xác nhận tạo Cơ hội Gia hạn";
    }
}

/* =========================================================
   MODAL: CẤU HÌNH NGƯỠNG CẢNH BÁO (Story 1 AC)
========================================================= */
function openThresholdModal() {
    document.getElementById("inputThresholdDays").value = currentThreshold;
    updateChipSelection(currentThreshold);
    document.getElementById("modalThresholdSettings").classList.add("active");
}

function closeThresholdModal() {
    document.getElementById("modalThresholdSettings").classList.remove("active");
}

function setPresetThreshold(days) {
    document.getElementById("inputThresholdDays").value = days;
    updateChipSelection(days);
}

function updateChipSelection(days) {
    document.querySelectorAll(".preset-chip-btn").forEach(btn => {
        btn.classList.toggle("active", btn.textContent.includes(String(days)));
    });
}

async function saveThresholdSettings() {
    const val = Number(document.getElementById("inputThresholdDays").value);
    if (!val || val < 1 || val > 365) {
        alert("Ngưỡng cảnh báo phải là số ngày từ 1 đến 365.");
        return;
    }

    const btn = document.getElementById("btnSaveThreshold");
    btn.disabled = true;
    btn.textContent = "⏳ Đang lưu...";

    try {
        const updated = await api("/api/contracts/settings", {
            method: "POST",
            body: JSON.stringify({ expiringThresholdDays: val })
        });

        currentThreshold = Number(updated.expiringThresholdDays);
        updateThresholdDisplays(currentThreshold);
        closeThresholdModal();

        // Refresh list and summary with new threshold
        await loadContractSummary();
        await loadContracts();
    } catch (err) {
        alert("Lỗi lưu cấu hình: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "💾 Lưu cấu hình";
    }
}

/* =========================================================
   MODAL: CHI TIẾT HỢP ĐỒNG
========================================================= */
async function openDetailModal(contractId) {
    const modal = document.getElementById("modalContractDetail");
    const body = document.getElementById("detailModalBody");
    const printBtn = document.getElementById("btnDetailPrint");
    printBtn.href = `contract-print.html?id=${contractId}`;

    modal.classList.add("active");
    body.innerHTML = `⏳ Đang tải thông tin chi tiết hợp đồng...`;

    try {
        const c = await api(`/api/contracts/${contractId}`);
        document.getElementById("detailContractTitle").textContent = `Hợp đồng #${c.contractNumber}`;

        const itemsHtml = (c.items && c.items.length > 0) ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
                <thead>
                    <tr style="background: #f1f5f9; text-align: left;">
                        <th style="padding: 8px 10px; border-bottom: 1px solid #cbd5e1;">Sản phẩm / Dịch vụ</th>
                        <th style="padding: 8px 10px; border-bottom: 1px solid #cbd5e1; text-align: right;">SL</th>
                        <th style="padding: 8px 10px; border-bottom: 1px solid #cbd5e1; text-align: right;">Đơn giá</th>
                        <th style="padding: 8px 10px; border-bottom: 1px solid #cbd5e1; text-align: right;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${c.items.map(it => `
                        <tr>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9;">
                                <strong>${escapeHtml(it.productName)}</strong>
                                <span style="font-size: 11px; color: #64748b; margin-left: 4px;">(${escapeHtml(it.productCode)})</span>
                            </td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right;">${it.quantity}</td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right;">${formatMoney(it.unitPrice)}</td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #059669;">${formatMoney(it.amount)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        ` : `<p style="color: #64748b; font-size: 13px;">Không có dòng sản phẩm chi tiết.</p>`;

        body.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; font-size: 13px;">
                <div>
                    <div style="color: #64748b;">Khách hàng:</div>
                    <div style="font-weight: 700; font-size: 14px; color: #0f172a;">${escapeHtml(c.customerName || "—")}</div>
                    <div style="color: #475569; font-size: 12px; margin-top: 2px;">MST: ${escapeHtml(c.customerTaxCode || "—")}</div>
                    <div style="color: #475569; font-size: 12px;">Đ/c: ${escapeHtml(c.customerAddress || "—")}</div>
                </div>
                <div>
                    <div style="color: #64748b;">Thời hạn hiệu lực:</div>
                    <div>Ngày ký: <strong>${formatDate(c.signedDate)}</strong></div>
                    <div>Hiệu lực: <strong>${formatDate(c.effectiveDate)}</strong></div>
                    <div>Hết hạn: <strong style="color: #b45309;">${formatDate(c.expiryDate)}</strong></div>
                    <div style="margin-top: 4px;">Số ngày còn lại: <strong>${c.daysRemaining != null ? c.daysRemaining + ' ngày' : 'Vô thời hạn'}</strong></div>
                </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 14px;">Tổng giá trị hợp đồng:</span>
                    <span style="font-weight: 800; font-size: 18px; color: #059669;">${formatMoney(c.totalAmount)}</span>
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                    Bằng chữ: <em>${escapeHtml(c.totalAmountInWords || "")}</em>
                </div>
            </div>

            <h4 style="margin: 16px 0 8px 0; font-size: 14px; font-weight: 700;">Danh mục sản phẩm & Dịch vụ:</h4>
            ${itemsHtml}

            ${c.paymentTerms ? `
                <h4 style="margin: 16px 0 6px 0; font-size: 14px; font-weight: 700;">Điều khoản thanh toán:</h4>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 12.5px; color: #334155; white-space: pre-wrap;">${escapeHtml(c.paymentTerms)}</div>
            ` : ""}
        `;
    } catch (err) {
        body.innerHTML = `<div style="color: #ef4444; padding: 20px;">Lỗi tải chi tiết: ${escapeHtml(err.message)}</div>`;
    }
}

function closeDetailModal() {
    document.getElementById("modalContractDetail").classList.remove("active");
}

/* =========================================================
   EVENT LISTENERS & INIT
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Load Settings
    await loadContractSettings();

    // 2. Load Summary & Contracts
    await loadContractSummary();
    await loadContracts();

    // 3. Tab filter buttons
    document.querySelectorAll(".contract-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".contract-tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeFilter = btn.dataset.filter || "ALL";
            loadContracts();
        });
    });

    // 4. Search input with debounce
    let searchTimer = null;
    const searchInput = document.getElementById("contractSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                searchKeyword = e.target.value;
                loadContracts();
            }, 300);
        });
    }

    // 5. Header buttons
    document.getElementById("btnRefreshContracts")?.addEventListener("click", () => {
        loadContractSummary();
        loadContracts();
    });

    document.getElementById("btnConfigureThreshold")?.addEventListener("click", openThresholdModal);
    document.getElementById("btnSaveThreshold")?.addEventListener("click", saveThresholdSettings);
    document.getElementById("btnSubmitRenew")?.addEventListener("click", submitRenewForm);
});
