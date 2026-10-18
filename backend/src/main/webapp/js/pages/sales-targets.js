"use strict";

const API_BASE = "http://localhost:8080/crm";

let selectedYear = 2026;
let selectedPeriodType = "MONTH"; // "MONTH", "QUARTER", "YEAR"
let selectedPeriodValue = 10;
let activeTypeFilter = "ALL"; // "ALL", "USER", "TEAM"

let targetsList = [];
let metadata = { users: [], teams: [] };

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
   INITIALIZATION & DATA LOADING
========================================================= */
async function loadMetadata() {
    try {
        const data = await api("/api/sales-targets/meta");
        if (data) {
            metadata = data;
            populateFormDropdowns();
        }
    } catch (err) {
        console.warn("Could not load targets metadata:", err);
    }
}

function populateFormDropdowns() {
    const userSelect = document.getElementById("formUserId");
    if (userSelect && metadata.users) {
        userSelect.innerHTML = `<option value="">-- Chọn nhân viên kinh doanh --</option>` +
            metadata.users.map(u => `
                <option value="${u.id}">${escapeHtml(u.fullName)} (${escapeHtml(u.email || '')}${u.teamName ? ' - ' + escapeHtml(u.teamName) : ''})</option>
            `).join("");
    }

    const teamSelect = document.getElementById("formTeamId");
    if (teamSelect && metadata.teams) {
        teamSelect.innerHTML = `<option value="">-- Chọn nhóm kinh doanh --</option>` +
            metadata.teams.map(t => `
                <option value="${t.id}">${escapeHtml(t.name)} (${t.memberCount || 0} thành viên)</option>
            `).join("");
    }
}

function buildQueryParams() {
    let q = `year=${selectedYear}`;
    if (selectedPeriodType === "MONTH" && selectedPeriodValue != null) {
        q += `&month=${selectedPeriodValue}`;
    } else if (selectedPeriodType === "QUARTER" && selectedPeriodValue != null) {
        q += `&quarter=${selectedPeriodValue}`;
    }
    return q;
}

async function loadTargetsSummary() {
    try {
        const q = buildQueryParams();
        const summary = await api(`/api/sales-targets/summary?${q}`);
        if (!summary) return;

        document.getElementById("kpiTargetAmount").textContent = formatMoney(summary.totalTargetAmount);
        document.getElementById("kpiTargetDeals").textContent = summary.totalTargetDeals || 0;

        document.getElementById("kpiActualAmount").textContent = formatMoney(summary.totalActualAmount);
        document.getElementById("kpiActualDeals").textContent = summary.totalActualDeals || 0;

        const rate = Number(summary.overallAchievementRate || 0);
        const rateEl = document.getElementById("kpiOverallRate");
        rateEl.textContent = `${rate}%`;
        if (rate >= 100) rateEl.style.color = "#059669";
        else if (rate >= 70) rateEl.style.color = "#2563eb";
        else rateEl.style.color = "#dc2626";

        const variance = Number(summary.totalVariance || 0);
        const varEl = document.getElementById("kpiVarianceText");
        varEl.textContent = (variance >= 0 ? "+" : "") + formatMoney(variance);
        varEl.style.color = variance >= 0 ? "#059669" : "#dc2626";

        document.getElementById("kpiAchievedCount").textContent = `${summary.completedCount || 0} / ${summary.totalTargetsCount || 0}`;
        document.getElementById("kpiCountCompleted").textContent = summary.completedCount || 0;
        document.getElementById("kpiCountOnTrack").textContent = summary.onTrackCount || 0;
        document.getElementById("kpiCountBehind").textContent = summary.behindCount || 0;
    } catch (err) {
        console.error("Failed to load targets summary:", err);
    }
}

async function loadTargets() {
    const tbody = document.getElementById("targetsTableBody");
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; color: #94a3b8;">⏳ Đang tải dữ liệu chỉ tiêu doanh số...</td></tr>`;

    try {
        const q = buildQueryParams() + `&type=${activeTypeFilter}`;
        const data = await api(`/api/sales-targets?${q}`);
        targetsList = Array.isArray(data) ? data : [];

        if (targetsList.length > 0 && targetsList[0].startDate && targetsList[0].endDate) {
            const s = new Date(targetsList[0].startDate).toLocaleDateString("vi-VN");
            const e = new Date(targetsList[0].endDate).toLocaleDateString("vi-VN");
            document.getElementById("periodDateRangeLabel").textContent = `(${s} ~ ${e})`;
        }

        renderTargetsTable();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; color: #ef4444;">❌ Lỗi tải dữ liệu chỉ tiêu: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderTargetsTable() {
    const tbody = document.getElementById("targetsTableBody");
    if (!targetsList || targetsList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
                    <div style="font-weight: 600; font-size: 15px; color: #475569;">Chưa có chỉ tiêu nào được khai báo cho kỳ này</div>
                    <div style="font-size: 13px; margin-top: 4px;">Bấm "+ Khai báo chỉ tiêu" để thiết lập chỉ tiêu doanh số đầu kỳ.</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = targetsList.map(t => {
        const isUser = t.targetType === "USER";
        const displayName = isUser ? (t.userName || "Chưa rõ") : (t.teamName || "Chưa rõ");
        const subInfo = isUser ? (t.userEmail || "") : "Nhóm kinh doanh";
        const initial = displayName.charAt(0).toUpperCase();

        // Rate & Progress bar
        const rate = Number(t.achievementRate || 0);
        const clampedRate = Math.min(100, Math.max(0, rate));
        let barClass = "bar-red";
        let statusTag = `<span class="target-status-badge status-behind">⚠️ Nguy cơ</span>`;

        if (rate >= 100) {
            barClass = "bar-green";
            statusTag = `<span class="target-status-badge status-completed">🏆 Đạt / Vượt</span>`;
        } else if (rate >= 70) {
            barClass = "bar-amber";
            statusTag = `<span class="target-status-badge status-on-track">⚡ Đang tiến độ</span>`;
        }

        // Variance
        const variance = Number(t.variance || 0);
        const varianceFormatted = (variance >= 0 ? "+" : "") + formatMoney(variance);
        const varianceColor = variance >= 0 ? "#059669" : "#dc2626";

        return `
            <tr data-id="${t.id}">
                <td>
                    <div class="entity-cell">
                        <div class="entity-avatar ${isUser ? '' : 'team-avatar'}">
                            ${isUser ? initial : '👥'}
                        </div>
                        <div>
                            <div class="entity-info-name">${escapeHtml(displayName)}</div>
                            <div class="entity-info-sub">${escapeHtml(subInfo)}</div>
                        </div>
                    </div>
                </td>
                <td style="font-size: 12.5px; color: #475569;">
                    ${escapeHtml(t.teamName || "—")}
                </td>
                <td style="font-weight: 600; font-size: 12.5px; color: #334155; white-space: nowrap;">
                    ${escapeHtml(t.periodLabel || "")}
                </td>
                <td style="text-align: right; font-weight: 700; color: #0f172a; white-space: nowrap;">
                    ${formatMoney(t.targetAmount)}
                    ${t.targetDeals > 0 ? `<div style="font-size: 11px; color: #64748b; font-weight: normal;">(Mục tiêu: ${t.targetDeals} deal)</div>` : ''}
                </td>
                <td style="text-align: right; font-weight: 700; color: #059669; white-space: nowrap;">
                    ${formatMoney(t.actualAmount)}
                    <div style="font-size: 11px; color: #059669; font-weight: normal;">(${t.actualDeals || 0} deal WON)</div>
                </td>
                <td>
                    <div class="achievement-progress-wrapper">
                        <div class="achievement-progress-track">
                            <div class="achievement-progress-bar ${barClass}" style="width: ${clampedRate}%;"></div>
                        </div>
                        <div class="achievement-rate-text">
                            <span style="color: ${rate >= 100 ? '#059669' : (rate >= 70 ? '#2563eb' : '#dc2626')}">${rate}%</span>
                            <span style="font-size: 11px; color: #64748b; font-weight: normal;">${t.actualDeals || 0}/${t.targetDeals || 0} deal</span>
                        </div>
                    </div>
                </td>
                <td style="text-align: right; font-weight: 700; color: ${varianceColor}; white-space: nowrap;">
                    ${varianceFormatted}
                </td>
                <td style="text-align: center;">
                    ${statusTag}
                </td>
                <td style="font-size: 12px; color: #64748b; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(t.notes || '')}">
                    ${escapeHtml(t.notes || "—")}
                </td>
                <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="target-action-btn" onclick="openEditTargetModal(${t.id})" title="Chỉnh sửa chỉ tiêu">
                        ✏️ Sửa
                    </button>
                    <button type="button" class="target-action-btn btn-delete" onclick="deleteTarget(${t.id})" title="Xóa chỉ tiêu">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

/* =========================================================
   PERIOD CONTROLS HANDLERS
========================================================= */
function updatePeriodDropdownOptions() {
    const select = document.getElementById("selectTargetPeriodValue");
    if (!select) return;

    if (selectedPeriodType === "MONTH") {
        select.style.display = "inline-block";
        select.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1).map(m => `
            <option value="${m}" ${m === selectedPeriodValue ? 'selected' : ''}>Tháng ${m}</option>
        `).join("");
    } else if (selectedPeriodType === "QUARTER") {
        select.style.display = "inline-block";
        select.innerHTML = Array.from({ length: 4 }, (_, i) => i + 1).map(q => `
            <option value="${q}" ${q === selectedPeriodValue ? 'selected' : ''}>Quý ${q}</option>
        `).join("");
    } else {
        // Whole year
        select.style.display = "none";
        document.getElementById("periodDateRangeLabel").textContent = `(01/01/${selectedYear} ~ 31/12/${selectedYear})`;
    }
}

/* =========================================================
   MODAL: KHAI BÁO / CHỈNH SỬA CHỈ TIÊU (Story 2 AC)
========================================================= */
function openCreateTargetModal() {
    document.getElementById("targetModalTitle").textContent = "🎯 Khai báo Chỉ tiêu Doanh số Mới";
    document.getElementById("formTargetId").value = "";
    document.querySelector("input[name='targetEntityType'][value='USER']").checked = true;
    onTargetTypeChange();

    document.getElementById("formUserId").value = "";
    document.getElementById("formTeamId").value = "";
    document.getElementById("formYear").value = selectedYear;
    document.getElementById("formPeriodType").value = selectedPeriodType;
    onFormPeriodTypeChange();

    if (selectedPeriodType !== "YEAR") {
        document.getElementById("formPeriodValue").value = selectedPeriodValue || (selectedPeriodType === "MONTH" ? 10 : 4);
    }

    document.getElementById("formTargetAmount").value = "";
    document.getElementById("formAmountFormatted").textContent = "";
    document.getElementById("formTargetDeals").value = "";
    document.getElementById("formNotes").value = "";

    document.getElementById("modalTargetForm").classList.add("active");
}

function openEditTargetModal(id) {
    const target = targetsList.find(t => t.id === id);
    if (!target) return;

    document.getElementById("targetModalTitle").textContent = "✏️ Cập nhật Chỉ tiêu Doanh số";
    document.getElementById("formTargetId").value = target.id;

    const isUser = target.userId != null;
    document.querySelector(`input[name='targetEntityType'][value='${isUser ? 'USER' : 'TEAM'}']`).checked = true;
    onTargetTypeChange();

    if (isUser) {
        document.getElementById("formUserId").value = target.userId;
    } else {
        document.getElementById("formTeamId").value = target.teamId;
    }

    document.getElementById("formYear").value = target.periodYear;

    let pType = "YEAR";
    if (target.periodMonth != null) pType = "MONTH";
    else if (target.periodQuarter != null) pType = "QUARTER";

    document.getElementById("formPeriodType").value = pType;
    onFormPeriodTypeChange();

    if (pType === "MONTH") {
        document.getElementById("formPeriodValue").value = target.periodMonth;
    } else if (pType === "QUARTER") {
        document.getElementById("formPeriodValue").value = target.periodQuarter;
    }

    document.getElementById("formTargetAmount").value = target.targetAmount || 0;
    document.getElementById("formAmountFormatted").textContent = formatMoney(target.targetAmount);
    document.getElementById("formTargetDeals").value = target.targetDeals || "";
    document.getElementById("formNotes").value = target.notes || "";

    document.getElementById("modalTargetForm").classList.add("active");
}

function closeTargetModal() {
    document.getElementById("modalTargetForm").classList.remove("active");
}

function onTargetTypeChange() {
    const type = document.querySelector("input[name='targetEntityType']:checked")?.value || "USER";
    const groupUser = document.getElementById("groupSelectUser");
    const groupTeam = document.getElementById("groupSelectTeam");

    if (type === "USER") {
        groupUser.style.display = "block";
        groupTeam.style.display = "none";
        document.getElementById("formUserId").required = true;
        document.getElementById("formTeamId").required = false;
    } else {
        groupUser.style.display = "none";
        groupTeam.style.display = "block";
        document.getElementById("formUserId").required = false;
        document.getElementById("formTeamId").required = true;
    }
}

function onFormPeriodTypeChange() {
    const pType = document.getElementById("formPeriodType").value;
    const valueGroup = document.getElementById("formPeriodValueGroup");
    const valSelect = document.getElementById("formPeriodValue");
    const valLabel = document.getElementById("formPeriodValueLabel");

    if (pType === "MONTH") {
        valueGroup.style.display = "block";
        valLabel.innerHTML = `Tháng <span style="color:#ef4444;">*</span>`;
        valSelect.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1).map(m => `
            <option value="${m}">Tháng ${m}</option>
        `).join("");
    } else if (pType === "QUARTER") {
        valueGroup.style.display = "block";
        valLabel.innerHTML = `Quý <span style="color:#ef4444;">*</span>`;
        valSelect.innerHTML = Array.from({ length: 4 }, (_, i) => i + 1).map(q => `
            <option value="${q}">Quý ${q}</option>
        `).join("");
    } else {
        valueGroup.style.display = "none";
    }
}

async function submitTargetForm() {
    const idVal = document.getElementById("formTargetId").value;
    const entityType = document.querySelector("input[name='targetEntityType']:checked").value;
    const userId = entityType === "USER" ? Number(document.getElementById("formUserId").value) : null;
    const teamId = entityType === "TEAM" ? Number(document.getElementById("formTeamId").value) : null;

    if (entityType === "USER" && (!userId || isNaN(userId))) {
        alert("Vui lòng chọn nhân viên kinh doanh.");
        return;
    }
    if (entityType === "TEAM" && (!teamId || isNaN(teamId))) {
        alert("Vui lòng chọn nhóm kinh doanh.");
        return;
    }

    const year = Number(document.getElementById("formYear").value);
    const pType = document.getElementById("formPeriodType").value;
    let month = null;
    let quarter = null;

    if (pType === "MONTH") {
        month = Number(document.getElementById("formPeriodValue").value);
        quarter = Math.floor((month - 1) / 3) + 1;
    } else if (pType === "QUARTER") {
        quarter = Number(document.getElementById("formPeriodValue").value);
    }

    const amount = Number(document.getElementById("formTargetAmount").value);
    if (isNaN(amount) || amount < 0) {
        alert("Vui lòng nhập chỉ tiêu doanh số hợp lệ (>= 0).");
        return;
    }

    const deals = Number(document.getElementById("formTargetDeals").value) || 0;
    const notes = document.getElementById("formNotes").value.trim();

    const payload = {
        id: idVal ? Number(idVal) : null,
        userId: userId,
        teamId: teamId,
        periodYear: year,
        periodMonth: month,
        periodQuarter: quarter,
        targetAmount: amount,
        targetDeals: deals,
        notes: notes
    };

    const btn = document.getElementById("btnSaveTarget");
    btn.disabled = true;
    btn.textContent = "⏳ Đang lưu...";

    try {
        await api("/api/sales-targets", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        closeTargetModal();
        alert(idVal ? "✅ Đã cập nhật chỉ tiêu doanh số thành công!" : "✅ Đã khai báo chỉ tiêu doanh số mới thành công!");

        await loadTargetsSummary();
        await loadTargets();
    } catch (err) {
        alert("Lỗi lưu chỉ tiêu: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "💾 Lưu chỉ tiêu";
    }
}

async function deleteTarget(id) {
    if (!confirm(`Bạn có chắc chắn muốn xóa chỉ tiêu doanh số này không?`)) {
        return;
    }

    try {
        await api(`/api/sales-targets/${id}`, { method: "DELETE" });
        alert("✅ Đã xóa chỉ tiêu thành công.");
        await loadTargetsSummary();
        await loadTargets();
    } catch (err) {
        alert("Lỗi xóa chỉ tiêu: " + err.message);
    }
}

/* =========================================================
   EVENT LISTENERS & INIT
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Load Metadata
    await loadMetadata();

    // 2. Setup Period Controls
    updatePeriodDropdownOptions();

    // 3. Load Summary & Targets
    await loadTargetsSummary();
    await loadTargets();

    // Year Change
    document.getElementById("selectTargetYear")?.addEventListener("change", (e) => {
        selectedYear = Number(e.target.value);
        loadTargetsSummary();
        loadTargets();
    });

    // Period Type Pills Change
    document.querySelectorAll(".period-pill-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".period-pill-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedPeriodType = btn.dataset.periodType || "MONTH";
            if (selectedPeriodType === "MONTH") selectedPeriodValue = 10;
            else if (selectedPeriodType === "QUARTER") selectedPeriodValue = 4;
            else selectedPeriodValue = null;

            updatePeriodDropdownOptions();
            loadTargetsSummary();
            loadTargets();
        });
    });

    // Month/Quarter dropdown Change
    document.getElementById("selectTargetPeriodValue")?.addEventListener("change", (e) => {
        selectedPeriodValue = Number(e.target.value);
        loadTargetsSummary();
        loadTargets();
    });

    // Target View Tabs (ALL, USER, TEAM)
    document.querySelectorAll(".target-view-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".target-view-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            activeTypeFilter = tab.dataset.type || "ALL";
            loadTargets();
        });
    });

    // Header buttons
    document.getElementById("btnRefreshTargets")?.addEventListener("click", () => {
        loadTargetsSummary();
        loadTargets();
    });

    document.getElementById("btnOpenCreateTargetModal")?.addEventListener("click", openCreateTargetModal);
    document.getElementById("btnSaveTarget")?.addEventListener("click", submitTargetForm);

    // Live amount formatted helper
    document.getElementById("formTargetAmount")?.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        document.getElementById("formAmountFormatted").textContent = val ? formatMoney(val) : "";
    });
});
