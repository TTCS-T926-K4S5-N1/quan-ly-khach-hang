"use strict";

const API_BASE = "http://localhost:8080/crm";

let currentRoleView = null; // "DIRECTOR", "TEAM_LEAD", "STAFF"
let selectedYear = 2026;
let selectedMonth = 10;
let selectedTeamId = null;

let dashboardMeta = null;

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
   DASHBOARD DATA LOADER (< 2s Performance Constraint)
========================================================= */
async function loadDashboardData() {
    const perfBadge = document.getElementById("dashPerfBadge");
    if (perfBadge) {
        perfBadge.textContent = "⏳ Đang tải...";
        perfBadge.style.color = "#475569";
        perfBadge.style.background = "#f1f5f9";
    }

    const startTime = performance.now();

    try {
        let q = `year=${selectedYear}&month=${selectedMonth}`;
        if (currentRoleView) {
            q += `&role=${currentRoleView}`;
        }
        if (selectedTeamId) {
            q += `&teamId=${selectedTeamId}`;
        }

        const res = await api(`/api/dashboard?${q}`);
        const clientElapsed = Math.round(performance.now() - startTime);

        if (!res) return;
        dashboardMeta = res;

        // Cập nhật performance badge (< 2 giây)
        if (perfBadge) {
            const timeReported = res.executionTimeMs != null ? res.executionTimeMs : clientElapsed;
            perfBadge.textContent = `⚡ ${timeReported}ms (< 2.0s)`;
            if (timeReported < 2000) {
                perfBadge.style.background = "#ecfdf5";
                perfBadge.style.color = "#047857";
                perfBadge.style.borderColor = "#a7f3d0";
            } else {
                perfBadge.style.background = "#fef2f2";
                perfBadge.style.color = "#dc2626";
            }
        }

        currentRoleView = res.activeRoleView;
        setupRoleControls(res);
        renderCurrentRoleView(res);

    } catch (err) {
        console.error("Failed to load dashboard data:", err);
        if (perfBadge) {
            perfBadge.textContent = "❌ Lỗi tải dữ liệu";
            perfBadge.style.background = "#fef2f2";
            perfBadge.style.color = "#dc2626";
        }
    }
}

/* =========================================================
   ROLE CONTROLS & SWITCHER SETUP
========================================================= */
function setupRoleControls(res) {
    const available = res.availableRoleViews || ["STAFF"];
    const active = res.activeRoleView || "STAFF";

    // 1. Role switcher buttons state & visibility
    const btnDirector = document.getElementById("roleBtnDirector");
    const btnTeamLead = document.getElementById("roleBtnTeamLead");
    const btnStaff = document.getElementById("roleBtnStaff");

    if (btnDirector) {
        btnDirector.style.display = available.includes("DIRECTOR") ? "inline-flex" : "none";
        btnDirector.classList.toggle("active", active === "DIRECTOR");
    }
    if (btnTeamLead) {
        btnTeamLead.style.display = available.includes("TEAM_LEAD") ? "inline-flex" : "none";
        btnTeamLead.classList.toggle("active", active === "TEAM_LEAD");
    }
    if (btnStaff) {
        btnStaff.style.display = available.includes("STAFF") ? "inline-flex" : "none";
        btnStaff.classList.toggle("active", active === "STAFF");
    }

    // 2. Subtitle & current role badge
    const labelEl = document.getElementById("currentRoleViewLabel");
    if (labelEl) {
        if (active === "DIRECTOR") labelEl.innerHTML = "👑 Giám đốc kinh doanh (Toàn khối)";
        else if (active === "TEAM_LEAD") labelEl.innerHTML = "👥 Trưởng nhóm kinh doanh";
        else labelEl.innerHTML = "👤 Nhân viên kinh doanh";
    }

    const teamBadge = document.getElementById("currentTeamBadge");
    if (teamBadge) {
        if (active === "TEAM_LEAD" && res.teamName) {
            teamBadge.style.display = "inline-block";
            teamBadge.textContent = "Nhóm: " + res.teamName;
        } else {
            teamBadge.style.display = "none";
        }
    }

    // 3. Team dropdown (visible when Admin/Director switches to TEAM_LEAD view)
    const teamSelect = document.getElementById("dashTeamSelect");
    if (teamSelect) {
        if (active === "TEAM_LEAD" && res.teamOptions && res.teamOptions.length > 0) {
            teamSelect.style.display = "inline-block";
            teamSelect.innerHTML = `<option value="">-- Chọn nhóm để xem --</option>` +
                res.teamOptions.map(t => `
                    <option value="${t.id}" ${t.id === res.teamId ? 'selected' : ''}>${escapeHtml(t.name)}</option>
                `).join("");
        } else {
            teamSelect.style.display = "none";
        }
    }
}

function renderCurrentRoleView(res) {
    const active = res.activeRoleView;
    const viewDirector = document.getElementById("viewDirector");
    const viewTeamLead = document.getElementById("viewTeamLead");
    const viewStaff = document.getElementById("viewStaff");

    if (viewDirector) viewDirector.style.display = active === "DIRECTOR" ? "flex" : "none";
    if (viewTeamLead) viewTeamLead.style.display = active === "TEAM_LEAD" ? "flex" : "none";
    if (viewStaff) viewStaff.style.display = active === "STAFF" ? "flex" : "none";

    const data = res.data || {};

    if (active === "DIRECTOR") {
        renderDirectorView(data, res);
    } else if (active === "TEAM_LEAD") {
        renderTeamLeadView(data, res);
    } else {
        renderStaffView(data, res);
    }
}

/* =========================================================
   1. GIÁM ĐỐC KINH DOANH VIEW
   - Dự báo so với chỉ tiêu (Forecast vs Quota)
   - Giá trị pipeline theo giai đoạn (Pipeline by Stage)
   - Doanh số đã chốt theo 12 tháng (Closed-Won Sales by Month)
========================================================= */
function renderDirectorView(data, res) {
    const f = data.forecastVsTarget || {};
    const p = data.pipelineByStage || {};
    const m = data.monthlyClosedSales || {};

    // 1. Forecast vs Quota KPIs
    document.getElementById("dirPeriodLabel").textContent = `Tháng ${res.month}/${res.year}`;
    document.getElementById("dirKpiTarget").textContent = formatMoney(f.targetAmount);
    document.getElementById("dirKpiTargetDeals").textContent = `Mục tiêu: ${f.targetDeals || 0} hợp đồng`;

    document.getElementById("dirKpiWon").textContent = formatMoney(f.actualWonAmount);
    document.getElementById("dirKpiWonDeals").textContent = `${f.actualWonDeals || 0} hợp đồng đã chốt thành công`;

    document.getElementById("dirKpiWeighted").textContent = formatMoney(f.weightedPipelineAmount);
    document.getElementById("dirKpiWeightedSub").textContent = `Dự báo đạt ${f.forecastAchievementRate || 0}% chỉ tiêu`;

    document.getElementById("dirKpiBestCase").textContent = formatMoney(f.bestCaseTotalAmount);
    document.getElementById("dirKpiBestCaseSub").textContent = `Kỳ vọng tối đa nếu chốt 100% deal mở`;

    // Visual multi-layer bar
    const wonRate = Number(f.wonAchievementRate || 0);
    const forecastRate = Number(f.forecastAchievementRate || 0);
    document.getElementById("dirWonRateText").textContent = `${wonRate}%`;
    document.getElementById("dirForecastRateText").textContent = `${forecastRate}%`;

    const variance = Number(f.varianceAmount || 0);
    const varEl = document.getElementById("dirVarianceText");
    if (variance >= 0) {
        varEl.textContent = `Vượt chỉ tiêu: +${formatMoney(variance)}`;
        varEl.style.color = "#059669";
    } else {
        varEl.textContent = `Còn thiếu: ${formatMoney(Math.abs(variance))}`;
        varEl.style.color = "#dc2626";
    }

    const clampedWon = Math.min(100, Math.max(0, wonRate));
    document.getElementById("dirBarWon").style.width = `${clampedWon}%`;

    const remainingForForecast = Math.max(0, 100 - clampedWon);
    const weightedExtraRate = Math.max(0, forecastRate - wonRate);
    const clampedWeighted = Math.min(remainingForForecast, weightedExtraRate);
    document.getElementById("dirBarWeighted").style.width = `${clampedWeighted}%`;

    document.getElementById("dirBarTargetLabel").textContent = formatMoney(f.targetAmount);

    // 2. Pipeline by Stage
    document.getElementById("dirTotalPipelineValue").textContent = `Tổng: ${formatMoney(p.totalPipelineValue)}`;
    const stagesBody = document.getElementById("dirPipelineStagesBody");
    const stages = p.stages || [];

    if (stages.length === 0) {
        stagesBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Chưa có cơ hội mở trong pipeline.</td></tr>`;
    } else {
        stagesBody.innerHTML = stages.map(st => {
            const pct = Number(st.percentage || 0);
            return `
                <tr>
                    <td>
                        <strong style="color:#0f172a;">${escapeHtml(st.name)}</strong>
                    </td>
                    <td style="text-align: center;">
                        <span class="dash-tag dash-tag-blue">${st.probability || 0}%</span>
                    </td>
                    <td style="text-align: center; font-weight:700;">
                        ${st.oppCount || 0}
                    </td>
                    <td style="text-align: right; font-weight: 700; color: #1e293b; white-space: nowrap;">
                        ${formatMoney(st.totalAmount)}
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div class="mini-prog-track" style="flex:1;">
                                <div class="mini-prog-fill prog-blue" style="width:${Math.min(100, pct)}%;"></div>
                            </div>
                            <span style="font-size:12px; font-weight:600; color:#475569; width:40px; text-align:right;">${pct}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // 3. Closed-Won Sales Revenue by 12 Months
    document.getElementById("dirYtdWon").textContent = formatMoney(m.ytdWonAmount);
    document.getElementById("dirYtdTarget").textContent = formatMoney(m.ytdTargetAmount);

    const monthlyBody = document.getElementById("dirMonthlySalesBody");
    const months = m.months || [];

    if (months.length === 0) {
        monthlyBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Chưa có dữ liệu 12 tháng.</td></tr>`;
    } else {
        monthlyBody.innerHTML = months.map(mn => {
            const isCurrent = mn.month === res.month;
            const rate = Number(mn.achievementRate || 0);
            let rateBadge = `<span class="dash-tag dash-tag-red">${rate}%</span>`;
            if (rate >= 100) rateBadge = `<span class="dash-tag dash-tag-green">✔ ${rate}%</span>`;
            else if (rate >= 70) rateBadge = `<span class="dash-tag dash-tag-blue">⚡ ${rate}%</span>`;

            return `
                <tr style="${isCurrent ? 'background:#eff6ff; font-weight:600;' : ''}">
                    <td>
                        ${escapeHtml(mn.label || `Tháng ${mn.month}`)}
                        ${isCurrent ? '<span style="font-size:10px; color:#2563eb; margin-left:4px;">(Kỳ này)</span>' : ''}
                    </td>
                    <td style="text-align: right; color:#64748b;">
                        ${formatMoney(mn.targetAmount)}
                    </td>
                    <td style="text-align: right; font-weight:700; color:#059669;">
                        ${formatMoney(mn.wonAmount)}
                    </td>
                    <td style="text-align: center;">
                        ${rateBadge}
                    </td>
                    <td style="text-align: center; color:#475569;">
                        ${mn.dealsCount || 0}
                    </td>
                </tr>
            `;
        }).join("");
    }
}

/* =========================================================
   2. TRƯỞNG NHÓM KINH DOANH VIEW
   - Xếp hạng thành viên (Member Leaderboard)
   - Cơ hội đình trệ của nhóm (Team Stagnant Opportunities)
   - Việc quá hạn của nhóm (Team Overdue Tasks)
========================================================= */
function renderTeamLeadView(data, res) {
    if (res.teamName) {
        document.getElementById("tlTeamHeaderTitle").textContent = `👥 Bảng Điều Khiển: ${res.teamName}`;
    }

    const tp = data.targetProgress || {};
    document.getElementById("tlLeadTargetAmount").textContent = formatMoney(tp.targetAmount);
    document.getElementById("tlLeadWonAmount").textContent = formatMoney(tp.actualWonAmount);

    // 1. Leaderboard Ranking
    const ranking = data.memberRanking || [];
    document.getElementById("tlMemberCountBadge").textContent = `${ranking.length} thành viên`;
    const rankBody = document.getElementById("tlLeaderboardBody");

    if (ranking.length === 0) {
        rankBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#94a3b8;">Không có dữ liệu thành viên trong nhóm.</td></tr>`;
    } else {
        rankBody.innerHTML = ranking.map(m => {
            const rank = m.rank || 1;
            let rankClass = "rank-other";
            let rankIcon = `#${rank}`;
            if (rank === 1) { rankClass = "rank-1"; rankIcon = "🥇"; }
            else if (rank === 2) { rankClass = "rank-2"; rankIcon = "🥈"; }
            else if (rank === 3) { rankClass = "rank-3"; rankIcon = "🥉"; }

            const rate = Number(m.achievementRate || 0);
            let barColor = "prog-red";
            let evalTag = `<span class="dash-tag dash-tag-red">⚠️ Nguy cơ</span>`;
            if (rate >= 100) {
                barColor = "prog-green";
                evalTag = `<span class="dash-tag dash-tag-green">🏆 Đạt chỉ tiêu</span>`;
            } else if (rate >= 70) {
                barColor = "prog-blue";
                evalTag = `<span class="dash-tag dash-tag-blue">⚡ Tiến độ tốt</span>`;
            }

            return `
                <tr>
                    <td style="text-align: center;">
                        <span class="rank-badge ${rankClass}">${rankIcon}</span>
                    </td>
                    <td>
                        <strong style="color:#0f172a; font-size:13.5px;">${escapeHtml(m.fullName)}</strong>
                        <div style="font-size:11.5px; color:#64748b;">${escapeHtml(m.email || '')}</div>
                    </td>
                    <td style="text-align: right; color:#475569; white-space: nowrap;">
                        ${formatMoney(m.targetAmount)}
                    </td>
                    <td style="text-align: right; font-weight:700; color:#059669; white-space: nowrap;">
                        ${formatMoney(m.wonAmount)}
                    </td>
                    <td>
                        <div style="display:flex; justify-content:space-between; font-size:11.5px; margin-bottom:2px;">
                            <span style="font-weight:700; color:${rate >= 100 ? '#059669' : '#2563eb'}">${rate}%</span>
                            <span style="color:#64748b;">${m.wonDeals || 0}/${m.targetDeals || 0} deal</span>
                        </div>
                        <div class="mini-prog-track">
                            <div class="mini-prog-fill ${barColor}" style="width:${Math.min(100, rate)}%;"></div>
                        </div>
                    </td>
                    <td style="text-align: center; font-weight:700; color:#059669;">
                        ${m.wonDeals || 0}
                    </td>
                    <td style="text-align: center;">
                        ${evalTag}
                    </td>
                </tr>
            `;
        }).join("");
    }

    // 2. Team Stagnant Opportunities
    const stag = data.teamStagnantOpportunities || {};
    const stagItems = stag.items || [];
    document.getElementById("tlStagnantCountBadge").textContent = `${stag.totalCount || 0} cơ hội`;

    const alertBox = document.getElementById("tlStagnantAlert");
    if (stag.totalAmountAtRisk && Number(stag.totalAmountAtRisk) > 0) {
        alertBox.style.display = "flex";
        document.getElementById("tlStagnantTotalAmount").textContent = formatMoney(stag.totalAmountAtRisk);
    } else {
        alertBox.style.display = "none";
    }

    const stagBody = document.getElementById("tlStagnantBody");
    if (stagItems.length === 0) {
        stagBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Không có cơ hội nào bị đình trệ. Tốt lắm! 👍</td></tr>`;
    } else {
        stagBody.innerHTML = stagItems.map(s => `
            <tr>
                <td>
                    <strong style="color:#0f172a;">${escapeHtml(s.name)}</strong>
                    <div style="font-size:11.5px; color:#64748b;">${escapeHtml(s.customerName || '')}</div>
                </td>
                <td style="font-size:12.5px; color:#334155; font-weight:500;">
                    ${escapeHtml(s.ownerName || '—')}
                </td>
                <td>
                    <span class="dash-tag dash-tag-amber">${escapeHtml(s.stageName || '')}</span>
                </td>
                <td style="text-align: right; font-weight:700; color:#dc2626; white-space:nowrap;">
                    ${formatMoney(s.amount)}
                </td>
                <td style="text-align: center;">
                    <span class="dash-tag dash-tag-red">⏰ ${s.daysInStage || 0} ngày</span>
                </td>
            </tr>
        `).join("");
    }

    // 3. Team Overdue Tasks
    const overdue = data.teamOverdueTasks || {};
    const overdueItems = overdue.items || [];
    const memberSummary = overdue.memberSummary || [];
    document.getElementById("tlOverdueTotalBadge").textContent = `${overdue.totalCount || 0} việc quá hạn`;

    // Overdue breakdown chips
    const chipsContainer = document.getElementById("tlOverdueMemberChips");
    if (memberSummary.length > 0) {
        chipsContainer.innerHTML = memberSummary.map(ms => `
            <span class="dash-tag dash-tag-amber" style="padding:4px 10px;">
                👤 ${escapeHtml(ms.fullName)}: <strong>${ms.overdueCount} việc</strong>
            </span>
        `).join("");
    } else {
        chipsContainer.innerHTML = `<span style="font-size:12.5px; color:#059669;">✔ Toàn bộ thành viên không có việc quá hạn.</span>`;
    }

    const overdueBody = document.getElementById("tlOverdueBody");
    if (overdueItems.length === 0) {
        overdueBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#94a3b8;">Không có công việc nào bị quá hạn.</td></tr>`;
    } else {
        overdueBody.innerHTML = overdueItems.map(ov => `
            <tr>
                <td>
                    <strong style="color:#b91c1c;">${escapeHtml(ov.subject)}</strong>
                    ${ov.opportunityName ? `<div style="font-size:11.5px; color:#64748b;">Deal: ${escapeHtml(ov.opportunityName)}</div>` : ''}
                </td>
                <td style="font-size:12.5px; font-weight:600; color:#334155;">
                    ${escapeHtml(ov.ownerName || '—')}
                </td>
                <td style="color:#dc2626; font-size:12px; font-weight:600;">
                    ${escapeHtml(ov.dueDate || '')}
                </td>
                <td style="font-size:12px; color:#475569;">
                    ${escapeHtml(ov.customerName || '—')}
                </td>
            </tr>
        `).join("");
    }
}

/* =========================================================
   3. NHÂN VIÊN KINH DOANH VIEW
   - Chỉ tiêu và tiến độ của mình
   - Cơ hội đang mở
   - Việc hôm nay
   - Lead chưa liên hệ
========================================================= */
function renderStaffView(data, res) {
    document.getElementById("staffPeriodLabel").textContent = `Tháng ${res.month}/${res.year}`;

    // 1. Chỉ tiêu & Tiến độ cá nhân
    const tp = data.targetProgress || {};
    document.getElementById("staffKpiTarget").textContent = formatMoney(tp.targetAmount);
    document.getElementById("staffKpiTargetDeals").textContent = `Mục tiêu: ${tp.targetDeals || 0} deal`;

    document.getElementById("staffKpiWon").textContent = formatMoney(tp.actualWonAmount);
    document.getElementById("staffKpiWonDeals").textContent = `${tp.actualWonDeals || 0} deal thành công`;

    const rate = Number(tp.achievementRate || 0);
    const rateEl = document.getElementById("staffKpiRate");
    rateEl.textContent = `${rate}%`;
    const rateStatusEl = document.getElementById("staffKpiRateStatus");

    let barColor = "prog-red";
    if (rate >= 100) {
        rateEl.style.color = "#059669";
        rateStatusEl.textContent = "🏆 Hoàn thành xuất sắc!";
        barColor = "prog-green";
    } else if (rate >= 70) {
        rateEl.style.color = "#2563eb";
        rateStatusEl.textContent = "⚡ Tiến độ đạt cam kết";
        barColor = "prog-blue";
    } else {
        rateEl.style.color = "#dc2626";
        rateStatusEl.textContent = "⚠️ Cần tăng tốc chốt đơn";
    }

    document.getElementById("staffKpiRemaining").textContent = formatMoney(tp.remainingAmount);
    document.getElementById("staffProgressText").textContent = `${rate}%`;
    document.getElementById("staffRemainingDetail").textContent = `Đã chốt: ${formatMoney(tp.actualWonAmount)} / ${formatMoney(tp.targetAmount)}`;

    const barEl = document.getElementById("staffProgressBar");
    barEl.className = `mini-prog-fill ${barColor}`;
    barEl.style.width = `${Math.min(100, Math.max(0, rate))}%`;

    // 2. Cơ hội đang mở
    const opps = data.openOpportunities || {};
    document.getElementById("staffOpenOppsSub").textContent = `Đang phụ trách ${opps.totalCount || 0} cơ hội - Tổng giá trị ${formatMoney(opps.totalValue)}`;
    const oppsBody = document.getElementById("staffOpenOppsBody");
    const oppsItems = opps.items || [];

    if (oppsItems.length === 0) {
        oppsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Bạn chưa có cơ hội mở nào. Hãy tạo cơ hội mới!</td></tr>`;
    } else {
        oppsBody.innerHTML = oppsItems.map(o => `
            <tr>
                <td>
                    <strong style="color:#0f172a;">${escapeHtml(o.name)}</strong>
                </td>
                <td style="font-size:12.5px; color:#475569;">
                    ${escapeHtml(o.customerName || '—')}
                </td>
                <td style="text-align: right; font-weight:700; color:#059669; white-space:nowrap;">
                    ${formatMoney(o.amount)}
                </td>
                <td>
                    <span class="dash-tag dash-tag-blue">${escapeHtml(o.stageName || '')}</span>
                    <span style="font-size:11px; color:#64748b; margin-left:2px;">(${o.probability || 0}%)</span>
                </td>
                <td style="text-align: center; font-size:12px; color:#64748b; white-space:nowrap;">
                    ${escapeHtml(o.expectedCloseDate || '—')}
                </td>
            </tr>
        `).join("");
    }

    // 3. Việc hôm nay
    const tasks = data.todayTasks || {};
    document.getElementById("staffTasksSub").textContent = `${tasks.totalCount || 0} việc cần xử lý (${tasks.pendingCount || 0} chưa hoàn thành)`;
    const tasksBody = document.getElementById("staffTasksBody");
    const taskItems = tasks.items || [];

    if (taskItems.length === 0) {
        tasksBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Hôm nay bạn không có công việc nào tồn đọng! 🎉</td></tr>`;
    } else {
        tasksBody.innerHTML = taskItems.map(t => {
            const isCompleted = t.status === "COMPLETED";
            let prioTag = `<span class="dash-tag dash-tag-gray">${escapeHtml(t.priority || 'NORMAL')}</span>`;
            if (t.priority === "URGENT" || t.priority === "HIGH") prioTag = `<span class="dash-tag dash-tag-red">Khẩn cấp</span>`;

            return `
                <tr style="${isCompleted ? 'opacity:0.6;' : ''}">
                    <td>
                        <strong style="color:#0f172a;">${escapeHtml(t.subject)}</strong>
                        <div style="font-size:11px; color:#64748b;">Hạn: ${escapeHtml(t.dueDate || 'Hôm nay')}</div>
                    </td>
                    <td>
                        <span class="dash-tag dash-tag-blue">${escapeHtml(t.type || 'TASK')}</span>
                    </td>
                    <td>
                        ${prioTag}
                    </td>
                    <td style="font-size:12.5px; color:#475569;">
                        ${escapeHtml(t.customerName || '—')}
                    </td>
                    <td style="text-align: center;">
                        <span class="dash-tag ${isCompleted ? 'dash-tag-green' : 'dash-tag-amber'}">
                            ${isCompleted ? '✔ Hoàn thành' : '⏳ Cần làm'}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // 4. Lead chưa liên hệ
    const leads = data.untouchedLeads || {};
    document.getElementById("staffUntouchedBadge").textContent = `${leads.totalCount || 0} lead chưa liên hệ`;
    const leadsBody = document.getElementById("staffUntouchedLeadsBody");
    const leadItems = leads.items || [];

    if (leadItems.length === 0) {
        leadsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">Tuyệt vời! Bạn không để sót lead nào chưa liên hệ. 👍</td></tr>`;
    } else {
        leadsBody.innerHTML = leadItems.map(l => `
            <tr>
                <td>
                    <strong style="color:#0f172a; font-size:13.5px;">${escapeHtml(l.name)}</strong>
                </td>
                <td style="font-size:12.5px; font-weight:600; color:#2563eb;">
                    ${escapeHtml(l.phone || '—')}
                </td>
                <td style="font-size:12px; color:#64748b;">
                    ${escapeHtml(l.email || '—')}
                </td>
                <td>
                    <span class="dash-tag dash-tag-amber">${escapeHtml(l.status || 'MOI')}</span>
                </td>
                <td style="font-size:12px; color:#64748b; white-space:nowrap;">
                    ${escapeHtml(l.createdAt || '—')}
                </td>
                <td style="text-align: right; white-space:nowrap;">
                    <a href="customers" class="crm-btn crm-btn-primary" style="font-size:12px; padding:4px 10px; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                        📞 Gọi & CSKH
                    </a>
                </td>
            </tr>
        `).join("");
    }

    // 5. Bảng xếp hạng doanh số nhóm (Team Leaderboard cho nhân viên)
    const lb = data.teamLeaderboard || {};
    const lbCard = document.getElementById("staffLeaderboardCard");
    const lbAlert = document.getElementById("staffLeaderboardDisabledAlert");
    const lbTableWrap = document.getElementById("staffLeaderboardTableWrap");
    const lbMotivation = document.getElementById("staffLeaderboardMotivation");
    const myRankBadge = document.getElementById("staffMyRankBadge");
    const teamNameBadge = document.getElementById("staffTeamNameBadge");
    const lbBody = document.getElementById("staffLeaderboardBody");

    if (lbCard) {
        if (lb.enabled === false) {
            // Tắt theo cấu hình hệ thống
            if (lbAlert) {
                lbAlert.style.display = "block";
                lbAlert.textContent = "🔒 " + (lb.message || "Tính năng bảng xếp hạng doanh số nhóm hiện đang tạm tắt theo cấu hình quản trị.");
            }
            if (lbTableWrap) lbTableWrap.style.display = "none";
            if (lbMotivation) lbMotivation.style.display = "none";
            if (myRankBadge) myRankBadge.style.display = "none";
            if (teamNameBadge) teamNameBadge.style.display = "none";
        } else {
            if (lbAlert) lbAlert.style.display = "none";
            if (lbTableWrap) lbTableWrap.style.display = "block";
            if (teamNameBadge) {
                teamNameBadge.style.display = "inline-block";
                teamNameBadge.textContent = lb.teamName ? `Nhóm: ${lb.teamName}` : "Nhóm của bạn";
            }

            const ranking = lb.ranking || [];
            if (myRankBadge) {
                myRankBadge.style.display = "inline-block";
                if (lb.myRank && lb.myRank > 0) {
                    myRankBadge.innerHTML = `Vị trí của bạn: <strong>Hạng #${lb.myRank} / ${ranking.length}</strong>`;
                } else {
                    myRankBadge.textContent = "Chưa có xếp hạng";
                }
            }

            if (ranking.length === 0) {
                lbBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">Nhóm chưa có dữ liệu thành viên trong kỳ này.</td></tr>`;
                if (lbMotivation) lbMotivation.style.display = "none";
            } else {
                lbBody.innerHTML = ranking.map(m => {
                    let medal = `<span style="font-weight:700; color:#64748b;">#${m.rank}</span>`;
                    if (m.rank === 1) medal = `<span style="font-size:18px;" title="Hạng 1 - Dẫn đầu nhóm">🥇</span>`;
                    else if (m.rank === 2) medal = `<span style="font-size:18px;" title="Hạng 2">🥈</span>`;
                    else if (m.rank === 3) medal = `<span style="font-size:18px;" title="Hạng 3">🥉</span>`;

                    const isCurrent = m.isCurrentUser;
                    const rowStyle = isCurrent ? "background: rgba(37, 99, 235, 0.06); font-weight: 600;" : "";
                    const attRate = Number(m.attainmentRate || 0);

                    let attColor = "#dc2626";
                    let attBar = "prog-red";
                    if (attRate >= 100) { attColor = "#059669"; attBar = "prog-green"; }
                    else if (attRate >= 70) { attColor = "#2563eb"; attBar = "prog-blue"; }

                    return `
                        <tr style="${rowStyle}">
                            <td style="text-align: center;">${medal}</td>
                            <td>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div style="width:28px; height:28px; border-radius:50%; background:${isCurrent ? '#2563eb' : '#64748b'}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700;">
                                        ${escapeHtml(m.fullName ? m.fullName.charAt(0) : 'U')}
                                    </div>
                                    <div>
                                        <div style="font-size:13px; color:#0f172a; font-weight:600;">
                                            ${escapeHtml(m.fullName)}
                                            ${isCurrent ? '<span class="dash-tag dash-tag-blue" style="margin-left:6px; padding:1px 6px; font-size:10.5px;">Bạn</span>' : ''}
                                        </div>
                                        <div style="font-size:11px; color:#94a3b8;">${escapeHtml(m.email)}</div>
                                    </div>
                                </div>
                            </td>
                            <td style="text-align: right; font-weight:700; color:#059669; white-space:nowrap;">
                                ${formatMoney(m.wonAmount)}
                            </td>
                            <td style="text-align: center; font-weight:600;">
                                ${m.wonDeals || 0}
                            </td>
                            <td style="text-align: right; color:#475569; white-space:nowrap;">
                                ${formatMoney(m.targetAmount)}
                            </td>
                            <td>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div class="mini-prog-track" style="flex:1; height:8px;">
                                        <div class="mini-prog-fill ${attBar}" style="width: ${Math.min(100, attRate)}%;"></div>
                                    </div>
                                    <span style="font-size:12px; font-weight:700; color:${attColor}; min-width:42px; text-align:right;">${attRate}%</span>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join("");

                if (lbMotivation) {
                    if (lb.myRank === 1) {
                        lbMotivation.style.display = "flex";
                        document.getElementById("staffMotivationText").innerHTML = "👑 <strong>Chúc mừng! Bạn đang dẫn đầu nhóm về doanh số đã chốt trong kỳ! Hãy tiếp tục duy trì phong độ!</strong>";
                    } else if (lb.gapToNext && Number(lb.gapToNext) > 0) {
                        lbMotivation.style.display = "flex";
                        document.getElementById("staffMotivationText").innerHTML = `🔥 Bạn chỉ cần thêm <strong>${formatMoney(lb.gapToNext)}</strong> để vượt lên thứ hạng cao hơn so với đồng đội!`;
                    } else {
                        lbMotivation.style.display = "none";
                    }
                }
            }
        }
    }
}

/* =========================================================
   INITIALIZATION & EVENT LISTENERS
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initial Load
    await loadDashboardData();

    // 2. Role Switcher Buttons Click
    document.querySelectorAll(".role-pill-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const requestedRole = btn.dataset.role;
            if (requestedRole && requestedRole !== currentRoleView) {
                currentRoleView = requestedRole;
                loadDashboardData();
            }
        });
    });

    // 3. Year Select Change
    document.getElementById("dashYearSelect")?.addEventListener("change", (e) => {
        selectedYear = Number(e.target.value);
        loadDashboardData();
    });

    // 4. Month Select Change
    document.getElementById("dashMonthSelect")?.addEventListener("change", (e) => {
        selectedMonth = Number(e.target.value);
        loadDashboardData();
    });

    // 5. Team Select Change (when viewing team lead view as Admin/Director)
    document.getElementById("dashTeamSelect")?.addEventListener("change", (e) => {
        selectedTeamId = e.target.value ? Number(e.target.value) : null;
        loadDashboardData();
    });

    // 6. Refresh Button
    document.getElementById("btnRefreshDashboard")?.addEventListener("click", () => {
        loadDashboardData();
    });
});