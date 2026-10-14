"use strict";

const API_BASE = "http://localhost:8080/crm";

let currentCampaigns = [];
let selectedCampaignId = null;

// DOM Elements
const statActiveCampaigns = document.getElementById("statActiveCampaigns");
const statTotalCampaigns = document.getElementById("statTotalCampaigns");
const statTotalBudget = document.getElementById("statTotalBudget");
const statTotalLeads = document.getElementById("statTotalLeads");
const statTotalWonRevenue = document.getElementById("statTotalWonRevenue");
const statWonOpps = document.getElementById("statWonOpps");
const statOverallRoi = document.getElementById("statOverallRoi");

const searchCampaignInput = document.getElementById("searchCampaignInput");
const filterChannel = document.getElementById("filterChannel");
const filterStatus = document.getElementById("filterStatus");
const btnRefresh = document.getElementById("btnRefresh");
const btnNewCampaign = document.getElementById("btnNewCampaign");
const campaignsTbody = document.getElementById("campaignsTbody");

// Modal Elements
const campaignModalOverlay = document.getElementById("campaignModalOverlay");
const campaignForm = document.getElementById("campaignForm");
const modalTitle = document.getElementById("modalTitle");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelModal = document.getElementById("btnCancelModal");
const campaignIdInput = document.getElementById("campaignId");
const campaignNameInput = document.getElementById("campaignName");
const campaignCodeInput = document.getElementById("campaignCode");
const campaignChannelInput = document.getElementById("campaignChannel");
const campaignStatusInput = document.getElementById("campaignStatus");
const campaignBudgetInput = document.getElementById("campaignBudget");
const campaignExpectedRevInput = document.getElementById("campaignExpectedRev");
const campaignActualCostInput = document.getElementById("campaignActualCost");
const campaignStartDateInput = document.getElementById("campaignStartDate");
const campaignEndDateInput = document.getElementById("campaignEndDate");
const campaignDescriptionInput = document.getElementById("campaignDescription");
const btnSaveCampaign = document.getElementById("btnSaveCampaign");

// Detail Modal Elements
const detailModalOverlay = document.getElementById("detailModalOverlay");
const btnCloseDetailModal = document.getElementById("btnCloseDetailModal");
const detailCampaignName = document.getElementById("detailCampaignName");
const detailCampaignCode = document.getElementById("detailCampaignCode");
const dBudget = document.getElementById("dBudget");
const dActualCost = document.getElementById("dActualCost");
const dLeads = document.getElementById("dLeads");
const dCpl = document.getElementById("dCpl");
const dOpps = document.getElementById("dOpps");
const dConvRate = document.getElementById("dConvRate");
const dWonRevenue = document.getElementById("dWonRevenue");
const dWonOpps = document.getElementById("dWonOpps");
const dRoiPercent = document.getElementById("dRoiPercent");
const tabCountLeads = document.getElementById("tabCountLeads");
const tabCountOpps = document.getElementById("tabCountOpps");
const detailLeadsTbody = document.getElementById("detailLeadsTbody");
const detailOppsTbody = document.getElementById("detailOppsTbody");

/* =========================================================
   INITIALIZATION
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    loadOverviewStats();
    loadCampaigns();
});

function bindEvents() {
    btnRefresh?.addEventListener("click", () => {
        loadOverviewStats();
        loadCampaigns();
    });

    btnNewCampaign?.addEventListener("click", openCreateModal);
    btnCloseModal?.addEventListener("click", closeModal);
    btnCancelModal?.addEventListener("click", closeModal);
    campaignForm?.addEventListener("submit", handleSaveCampaign);

    campaignModalOverlay?.addEventListener("click", (e) => {
        if (e.target === campaignModalOverlay) closeModal();
    });

    btnCloseDetailModal?.addEventListener("click", closeDetailModal);
    detailModalOverlay?.addEventListener("click", (e) => {
        if (e.target === detailModalOverlay) closeDetailModal();
    });

    // Search & Filter change
    let debounceTimer;
    searchCampaignInput?.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(loadCampaigns, 300);
    });

    filterChannel?.addEventListener("change", loadCampaigns);
    filterStatus?.addEventListener("change", loadCampaigns);

    // Detail tabs
    document.querySelectorAll(".detail-tabs .tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".detail-tabs .tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            const tabName = btn.dataset.tab;
            if (tabName === "leads") {
                document.getElementById("tabContentLeads")?.classList.add("active");
            } else {
                document.getElementById("tabContentOpps")?.classList.add("active");
            }
        });
    });
}

/* =========================================================
   DATA FETCHING & RENDERING
========================================================= */
async function loadOverviewStats() {
    try {
        const res = await fetch(`${API_BASE}/api/campaigns/overview`, { credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data) {
            const d = json.data;
            if (statActiveCampaigns) statActiveCampaigns.textContent = d.activeCampaigns || 0;
            if (statTotalCampaigns) statTotalCampaigns.textContent = d.totalCampaigns || 0;
            if (statTotalBudget) statTotalBudget.textContent = formatCurrency(d.totalBudget);
            if (statTotalLeads) statTotalLeads.textContent = d.totalLeads || 0;
            if (statTotalWonRevenue) statTotalWonRevenue.textContent = formatCurrency(d.totalWonRevenue);
            if (statWonOpps) statWonOpps.textContent = d.totalWonOpps || 0;
            
            const roi = parseFloat(d.overallRoi || 0);
            if (statOverallRoi) {
                statOverallRoi.textContent = (roi > 0 ? "+" : "") + roi.toFixed(1) + "%";
                statOverallRoi.className = "stat-value " + (roi >= 0 ? "text-emerald" : "text-danger");
            }
        }
    } catch (e) {
        console.warn("Could not load campaign overview stats", e);
    }
}

async function loadCampaigns() {
    const search = searchCampaignInput?.value.trim() || "";
    const channel = filterChannel?.value || "ALL";
    const status = filterStatus?.value || "ALL";

    campaignsTbody.innerHTML = `
        <tr>
            <td colspan="10" style="text-align: center; padding: 36px; color: var(--crm-muted);">
                ⏳ Đang tải dữ liệu chiến dịch...
            </td>
        </tr>
    `;

    try {
        const url = new URL(`${API_BASE}/api/campaigns`);
        if (search) url.searchParams.set("search", search);
        if (channel && channel !== "ALL") url.searchParams.set("channel", channel);
        if (status && status !== "ALL") url.searchParams.set("status", status);

        const res = await fetch(url.toString(), { credentials: "include" });
        const json = await res.json();

        if (!res.ok || !json.success) {
            throw new Error(json.message || "Không thể tải danh sách chiến dịch");
        }

        currentCampaigns = json.data || [];
        renderCampaignsTable(currentCampaigns);
    } catch (e) {
        campaignsTbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 36px; color: #dc2626;">
                    ❌ Lỗi khi tải danh sách: ${escapeHtml(e.message)}
                </td>
            </tr>
        `;
    }
}

function renderCampaignsTable(list) {
    if (!list || list.length === 0) {
        campaignsTbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 48px; color: var(--crm-muted);">
                    Không tìm thấy chiến dịch nào phù hợp với bộ lọc.
                </td>
            </tr>
        `;
        return;
    }

    campaignsTbody.innerHTML = list.map(c => {
        const roi = parseFloat(c.roiPercent || 0);
        let roiBadgeClass = "roi-neutral";
        let roiPrefix = "";
        if (roi > 0) {
            roiBadgeClass = "roi-positive";
            roiPrefix = "+";
        } else if (roi < 0) {
            roiBadgeClass = "roi-negative";
        }

        const dateRange = formatDateRange(c.startDate, c.endDate);

        return `
            <tr>
                <td>
                    <div style="font-weight: 700; color: var(--crm-text); margin-bottom: 2px;">
                        ${escapeHtml(c.name)}
                    </div>
                    <span class="badge-code">${escapeHtml(c.code)}</span>
                </td>
                <td>
                    ${renderChannelBadge(c.channel)}
                </td>
                <td style="font-size: 12.5px; color: var(--crm-muted);">
                    ${dateRange}
                </td>
                <td style="text-align: right; font-weight: 600;">
                    ${formatCurrency(c.budget)}
                </td>
                <td style="text-align: center;">
                    <button class="crm-btn crm-btn-secondary" style="padding: 3px 8px; font-size: 12px; font-weight: 700;" onclick="viewCampaignDetail(${c.id}, 'leads')">
                        ${c.totalLeads}
                    </button>
                </td>
                <td style="text-align: center;">
                    <button class="crm-btn crm-btn-secondary" style="padding: 3px 8px; font-size: 12px; font-weight: 700;" onclick="viewCampaignDetail(${c.id}, 'opps')">
                        ${c.totalOpportunities}
                    </button>
                </td>
                <td style="text-align: right; font-weight: 700; color: #059669;">
                    ${formatCurrency(c.wonRevenue)}
                </td>
                <td style="text-align: center;">
                    <span class="badge-roi ${roiBadgeClass}">
                        ${roiPrefix}${roi.toFixed(1)}%
                    </span>
                </td>
                <td style="text-align: center;">
                    ${renderStatusBadge(c.status)}
                </td>
                <td style="text-align: center;">
                    <div style="display: inline-flex; gap: 6px;">
                        <button class="crm-btn crm-btn-primary" style="padding: 4px 10px; font-size: 12px;" onclick="viewCampaignDetail(${c.id})">
                            📊 Đo lường
                        </button>
                        <button class="crm-icon-btn" title="Chỉnh sửa" onclick="openEditModal(${c.id})">
                            ✏️
                        </button>
                        <button class="crm-icon-btn" title="Xóa" onclick="handleDeleteCampaign(${c.id})">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

/* =========================================================
   CAMPAIGN MODAL (CREATE / EDIT)
========================================================= */
function openCreateModal() {
    selectedCampaignId = null;
    modalTitle.textContent = "➕ Khai báo chiến dịch Marketing mới";
    campaignForm.reset();
    campaignIdInput.value = "";
    campaignStatusInput.value = "ACTIVE";
    campaignChannelInput.value = "HOI_THAO";
    campaignModalOverlay.style.display = "flex";
}

function openEditModal(id) {
    const campaign = currentCampaigns.find(c => c.id === id);
    if (!campaign) return;

    selectedCampaignId = id;
    modalTitle.textContent = "✏️ Chỉnh sửa chiến dịch Marketing";
    campaignIdInput.value = campaign.id;
    campaignNameInput.value = campaign.name || "";
    campaignCodeInput.value = campaign.code || "";
    campaignChannelInput.value = campaign.channel || "HOI_THAO";
    campaignStatusInput.value = campaign.status || "ACTIVE";
    campaignBudgetInput.value = campaign.budget || 0;
    campaignExpectedRevInput.value = campaign.expectedRevenue || 0;
    campaignActualCostInput.value = campaign.actualCost || 0;
    campaignStartDateInput.value = campaign.startDate || "";
    campaignEndDateInput.value = campaign.endDate || "";
    campaignDescriptionInput.value = campaign.description || "";

    campaignModalOverlay.style.display = "flex";
}

function closeModal() {
    campaignModalOverlay.style.display = "none";
}

async function handleSaveCampaign(e) {
    e.preventDefault();
    const isEdit = Boolean(selectedCampaignId);

    const payload = {
        name: campaignNameInput.value.trim(),
        code: campaignCodeInput.value.trim().toUpperCase(),
        channel: campaignChannelInput.value,
        status: campaignStatusInput.value,
        budget: parseFloat(campaignBudgetInput.value) || 0,
        expectedRevenue: parseFloat(campaignExpectedRevInput.value) || 0,
        actualCost: parseFloat(campaignActualCostInput.value) || 0,
        startDate: campaignStartDateInput.value || null,
        endDate: campaignEndDateInput.value || null,
        description: campaignDescriptionInput.value.trim()
    };

    if (!payload.name || !payload.code) {
        alert("Vui lòng nhập đầy đủ tên và mã chiến dịch!");
        return;
    }

    btnSaveCampaign.disabled = true;
    btnSaveCampaign.textContent = "⏳ Đang lưu...";

    try {
        const url = isEdit
                ? `${API_BASE}/api/campaigns/${selectedCampaignId}`
                : `${API_BASE}/api/campaigns`;
        const method = isEdit ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include"
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message || "Không thể lưu chiến dịch");
        }

        alert(isEdit ? "✓ Đã cập nhật chiến dịch thành công!" : "✓ Đã tạo mới chiến dịch thành công!");
        closeModal();
        loadOverviewStats();
        loadCampaigns();
    } catch (err) {
        alert("Lỗi: " + err.message);
    } finally {
        btnSaveCampaign.disabled = false;
        btnSaveCampaign.textContent = "💾 Lưu chiến dịch";
    }
}

async function handleDeleteCampaign(id) {
    const campaign = currentCampaigns.find(c => c.id === id);
    const name = campaign ? campaign.name : `#${id}`;
    if (!confirm(`Bạn có chắc chắn muốn xóa chiến dịch "${name}"?`)) return;

    try {
        const res = await fetch(`${API_BASE}/api/campaigns/${id}`, {
            method: "DELETE",
            credentials: "include"
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message || "Không thể xóa chiến dịch");
        }
        alert("✓ Đã xóa chiến dịch thành công!");
        loadOverviewStats();
        loadCampaigns();
    } catch (e) {
        alert("Lỗi khi xóa: " + e.message);
    }
}

/* =========================================================
   DETAIL & MEASUREMENT DRAWER / MODAL
========================================================= */
window.viewCampaignDetail = async function(id, defaultTab = "leads") {
    const campaign = currentCampaigns.find(c => c.id === id);
    if (!campaign) return;

    detailCampaignName.textContent = campaign.name;
    detailCampaignCode.textContent = campaign.code;
    dBudget.textContent = formatCurrency(campaign.budget);
    dActualCost.textContent = formatCurrency(campaign.actualCost || 0);
    dLeads.textContent = campaign.totalLeads;
    dCpl.textContent = campaign.costPerLead ? formatCurrency(campaign.costPerLead) + "/lead" : "—";
    dOpps.textContent = campaign.totalOpportunities;
    dConvRate.textContent = (campaign.conversionRate || 0) + "%";
    dWonRevenue.textContent = formatCurrency(campaign.wonRevenue);
    dWonOpps.textContent = campaign.wonOpportunities;

    const roi = parseFloat(campaign.roiPercent || 0);
    dRoiPercent.textContent = (roi > 0 ? "+" : "") + roi.toFixed(1) + "%";
    dRoiPercent.className = "funnel-value " + (roi >= 0 ? "text-emerald" : "text-danger");

    // Activate default tab
    document.querySelectorAll(".detail-tabs .tab-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.tab === defaultTab);
    });
    document.getElementById("tabContentLeads")?.classList.toggle("active", defaultTab === "leads");
    document.getElementById("tabContentOpps")?.classList.toggle("active", defaultTab === "opps");

    detailModalOverlay.style.display = "flex";

    // Load Leads
    loadCampaignLeads(id);
    // Load Opps
    loadCampaignOpportunities(id);
};

function closeDetailModal() {
    detailModalOverlay.style.display = "none";
}

async function loadCampaignLeads(campaignId) {
    detailLeadsTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">⏳ Đang tải danh sách lead...</td></tr>`;
    try {
        const res = await fetch(`${API_BASE}/api/campaigns/${campaignId}/leads`, { credentials: "include" });
        const json = await res.json();
        const leads = json.data || [];
        tabCountLeads.textContent = leads.length;

        if (leads.length === 0) {
            detailLeadsTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--crm-muted);">Chưa có lead nào liên kết với chiến dịch này.</td></tr>`;
            return;
        }

        detailLeadsTbody.innerHTML = leads.map(l => `
            <tr>
                <td style="font-weight:600;">${escapeHtml(l.name)}</td>
                <td>${escapeHtml(l.phone || "—")}</td>
                <td>${escapeHtml(l.email || "—")}</td>
                <td><span class="badge-code">${escapeHtml(l.leadSource || "Không rõ")}</span></td>
                <td style="text-align:center; font-weight:700;">${l.oppsCount || 0}</td>
                <td style="font-weight:700; color:#059669;">${formatCurrency(l.wonValue)}</td>
                <td>${escapeHtml(l.ownerName || "Chưa phân bổ")}</td>
            </tr>
        `).join("");
    } catch (e) {
        detailLeadsTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#dc2626;">Lỗi tải lead: ${escapeHtml(e.message)}</td></tr>`;
    }
}

async function loadCampaignOpportunities(campaignId) {
    detailOppsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">⏳ Đang tải danh sách cơ hội...</td></tr>`;
    try {
        const res = await fetch(`${API_BASE}/api/campaigns/${campaignId}/opportunities`, { credentials: "include" });
        const json = await res.json();
        const opps = json.data || [];
        tabCountOpps.textContent = opps.length;

        if (opps.length === 0) {
            detailOppsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--crm-muted);">Chưa có cơ hội bán hàng nào phát sinh từ chiến dịch này.</td></tr>`;
            return;
        }

        detailOppsTbody.innerHTML = opps.map(o => `
            <tr>
                <td style="font-weight:600;">${escapeHtml(o.name)}</td>
                <td>${escapeHtml(o.customerName || "—")}</td>
                <td style="text-align:right; font-weight:700; color:${o.stageId == 5 ? '#059669' : 'inherit'};">
                    ${formatCurrency(o.amount)}
                </td>
                <td style="text-align:center;">
                    ${o.stageId == 5 ? '<span class="badge-status status-active">🏆 Đã chốt (Won)</span>' : '<span class="badge-status status-planning">Đang đàm phán</span>'}
                </td>
                <td style="font-size:12.5px; color:var(--crm-muted);">${o.expectedCloseDate || "—"}</td>
                <td>${escapeHtml(o.ownerName || "—")}</td>
            </tr>
        `).join("");
    } catch (e) {
        detailOppsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#dc2626;">Lỗi tải cơ hội: ${escapeHtml(e.message)}</td></tr>`;
    }
}

/* =========================================================
   HELPERS & FORMATTERS
========================================================= */
function formatCurrency(val) {
    if (val === null || val === undefined || isNaN(val)) return "0 đ";
    return Number(val).toLocaleString("vi-VN") + " đ";
}

function formatDateRange(start, end) {
    if (!start && !end) return "Chưa ấn định";
    if (start && !end) return `Từ ${formatDate(start)}`;
    if (!start && end) return `Đến ${formatDate(end)}`;
    return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatDate(dStr) {
    if (!dStr) return "";
    const parts = dStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dStr;
}

function renderChannelBadge(channel) {
    switch (channel) {
        case "HOI_THAO": return `<span class="badge-channel channel-hoithao">🎪 Hội thảo / Sự kiện</span>`;
        case "FACEBOOK": return `<span class="badge-channel channel-facebook">📘 Facebook Ads</span>`;
        case "GOOGLE_ADS": return `<span class="badge-channel channel-google">🔍 Google Search</span>`;
        case "EMAIL": return `<span class="badge-channel channel-email">✉️ Email Marketing</span>`;
        case "TIKTOK": return `<span class="badge-channel channel-tiktok">🎵 TikTok Ads</span>`;
        case "LINKEDIN": return `<span class="badge-channel channel-linkedin">💼 LinkedIn B2B</span>`;
        default: return `<span class="badge-channel channel-other">🌐 Kênh khác</span>`;
    }
}

function renderStatusBadge(status) {
    switch (status) {
        case "ACTIVE": return `<span class="badge-status status-active">🟢 Đang chạy</span>`;
        case "PLANNING": return `<span class="badge-status status-planning">🔵 Lên kế hoạch</span>`;
        case "PAUSED": return `<span class="badge-status status-paused">🟡 Tạm dừng</span>`;
        case "COMPLETED": return `<span class="badge-status status-completed">⚪ Đã kết thúc</span>`;
        case "CANCELLED": return `<span class="badge-status status-cancelled">🔴 Đã hủy</span>`;
        default: return `<span class="badge-status">${escapeHtml(status || "")}</span>`;
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
