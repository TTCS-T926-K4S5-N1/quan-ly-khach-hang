/**
 * Forecast & Quota Attainment Report Controller
 * Báo cáo dự báo doanh số, tiến độ chỉ tiêu & phân tích lý do thua
 */
(function () {
    "use strict";

    const API_BASE = "http://localhost:8080/crm";

    let state = {
        period: "THIS_MONTH",
        scope: "USER",
        teamId: "",
        data: null,
        teams: []
    };

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        bindEvents();
        loadTeams();
        loadReport();
    }

    function bindEvents() {
        // Period Segmented Control
        const periodContainer = document.getElementById("periodSegmented");
        if (periodContainer) {
            periodContainer.querySelectorAll(".preset-chip").forEach(btn => {
                btn.addEventListener("click", () => {
                    periodContainer.querySelectorAll(".preset-chip").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    state.period = btn.dataset.period || "THIS_MONTH";
                    loadReport();
                });
            });
        }

        // Scope Segmented Control (ALL / TEAM / USER)
        const scopeContainer = document.getElementById("scopeSegmented");
        if (scopeContainer) {
            scopeContainer.querySelectorAll(".scope-chip").forEach(btn => {
                btn.addEventListener("click", () => {
                    scopeContainer.querySelectorAll(".scope-chip").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    state.scope = btn.dataset.scope || "USER";

                    // Ẩn/hiện lọc nhóm khi xem theo nhân viên
                    const teamBox = document.getElementById("teamFilterBox");
                    if (teamBox) {
                        teamBox.style.display = (state.scope === "USER") ? "inline-flex" : "none";
                    }

                    // Đổi nhãn tiêu đề bảng
                    const tableTitle = document.getElementById("tableTitle");
                    const thName = document.getElementById("thName");
                    if (state.scope === "TEAM") {
                        if (tableTitle) tableTitle.textContent = "Bảng số liệu chi tiết theo Nhóm / Phòng ban";
                        if (thName) thName.textContent = "Tên Nhóm kinh doanh";
                    } else if (state.scope === "ALL") {
                        if (tableTitle) tableTitle.textContent = "Bảng số liệu toàn khối (Đóng góp từng đơn vị)";
                        if (thName) thName.textContent = "Đơn vị / Phòng ban";
                    } else {
                        if (tableTitle) tableTitle.textContent = "Bảng số liệu chi tiết theo Nhân viên kinh doanh";
                        if (thName) thName.textContent = "Họ tên nhân viên";
                    }

                    loadReport();
                });
            });
        }

        // Team filter dropdown
        const selectTeam = document.getElementById("selectTeamFilter");
        if (selectTeam) {
            selectTeam.addEventListener("change", (e) => {
                state.teamId = e.target.value;
                loadReport();
            });
        }

        // Refresh Button
        const btnRefresh = document.getElementById("btnRefresh");
        if (btnRefresh) {
            btnRefresh.addEventListener("click", loadReport);
        }

        // Export Excel Button
        const btnExport = document.getElementById("btnExportExcel");
        if (btnExport) {
            btnExport.addEventListener("click", exportExcel);
        }
    }

    async function loadTeams() {
        try {
            const res = await fetch(`${API_BASE}/api/reports/team-productivity?period=THIS_MONTH`, {
                credentials: "include"
            });
            const json = await res.json();
            if (json.success && json.data && json.data.availableTeams) {
                state.teams = json.data.availableTeams;
                const selectTeam = document.getElementById("selectTeamFilter");
                if (selectTeam) {
                    selectTeam.innerHTML = `<option value="">-- Tất cả nhóm kinh doanh --</option>` +
                        state.teams.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("");
                }
            }
        } catch (e) {
            console.warn("Could not load teams dropdown:", e);
        }
    }

    async function loadReport() {
        setTableLoading();
        try {
            let url = `${API_BASE}/api/forecasts?period=${encodeURIComponent(state.period)}&groupBy=${encodeURIComponent(state.scope)}`;
            if (state.teamId && state.scope === "USER") {
                url += `&teamId=${encodeURIComponent(state.teamId)}`;
            }

            const res = await fetch(url, { credentials: "include" });
            if (res.status === 401 || res.status === 403) {
                window.location.href = "login";
                return;
            }
            const json = await res.json();
            if (!json.success) {
                throw new Error(json.message || "Lỗi tải báo cáo dự báo");
            }

            state.data = json.data;
            renderAll();
        } catch (err) {
            console.error("Forecast report load error:", err);
            renderError(err.message);
        }
    }

    function renderAll() {
        if (!state.data) return;
        renderSummary();
        renderBreakdown();
        renderLossAnalysis();
    }

    function renderSummary() {
        const sum = state.data.summary || {};
        const periodLabel = state.data.periodLabel || "";

        // Format values
        const target = sum.targetAmount || 0;
        const won = sum.wonAmount || 0;
        const wonDeals = sum.wonDealsCount || 0;
        const weighted = sum.weightedForecastAmount || 0;
        const openDeals = sum.openDealsCount || 0;
        const projected = sum.totalProjectedAmount || 0;
        const achievement = sum.achievementPercent || 0;
        const status = sum.overallStatus || "KHẢ THI ĐẠT";

        // Top Cards
        document.getElementById("kpiTargetAmount").textContent = formatVND(target);
        document.getElementById("kpiWonAmount").textContent = formatVND(won);
        document.getElementById("kpiWonSub").textContent = `${wonDeals} hợp đồng chốt thực tế`;

        document.getElementById("kpiWeightedAmount").textContent = formatVND(weighted);
        document.getElementById("kpiWeightedSub").textContent = `${openDeals} cơ hội pipeline mở`;

        document.getElementById("kpiProjectedAmount").textContent = formatVND(projected);
        document.getElementById("kpiProjectedSub").textContent = `Tiến độ kỳ: ${achievement.toFixed(1)}% so với chỉ tiêu`;

        const statusBadge = document.getElementById("kpiStatusBadge");
        if (statusBadge) {
            statusBadge.textContent = status;
            statusBadge.className = "status-pill " + getStatusClass(status);
        }

        // Visual Comparison Section
        document.getElementById("visualPeriodLabel").textContent = periodLabel;
        document.getElementById("legendWonVal").textContent = formatVND(won);
        document.getElementById("legendWeightedVal").textContent = formatVND(weighted);

        const gap = Math.max(0, target - projected);
        document.getElementById("legendGapVal").textContent = formatVND(gap);
        document.getElementById("visualTargetVal").textContent = formatVND(target);

        // Progress bar calculation
        let wonPct = 0;
        let weightedPct = 0;
        if (target > 0) {
            wonPct = Math.min(100, (won / target) * 100);
            weightedPct = Math.min(Math.max(0, 100 - wonPct), (weighted / target) * 100);
        }

        const barWon = document.getElementById("barWon");
        const barWeighted = document.getElementById("barWeighted");

        if (barWon) {
            barWon.style.width = wonPct.toFixed(1) + "%";
            barWon.textContent = wonPct > 8 ? `${wonPct.toFixed(0)}% Đã chốt` : (wonPct > 0 ? `${wonPct.toFixed(0)}%` : "");
        }
        if (barWeighted) {
            barWeighted.style.width = weightedPct.toFixed(1) + "%";
            barWeighted.textContent = weightedPct > 8 ? `${weightedPct.toFixed(0)}% Dự báo` : (weightedPct > 0 ? `${weightedPct.toFixed(0)}%` : "");
        }

        const statusText = document.getElementById("visualStatusText");
        if (statusText) {
            statusText.innerHTML = `Tổng dự kiến đạt: <strong style="color:var(--crm-primary);">${achievement.toFixed(1)}%</strong> (${status})`;
        }
    }

    function renderBreakdown() {
        const tbody = document.getElementById("breakdownTbody");
        const tfoot = document.getElementById("breakdownTfoot");
        const items = state.data.breakdown || [];

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:35px; color:var(--crm-muted);">Không có dữ liệu cho kỳ hoặc bộ lọc đã chọn.</td></tr>`;
            if (tfoot) tfoot.innerHTML = "";
            return;
        }

        let html = "";
        let sumTarget = 0;
        let sumWon = 0;
        let sumWonDeals = 0;
        let sumPipe = 0;
        let sumWeighted = 0;
        let sumProjected = 0;

        items.forEach((row, idx) => {
            const isZebra = idx % 2 === 1;
            const target = row.targetAmount || 0;
            const won = row.wonAmount || 0;
            const wonDeals = row.wonDealsCount || 0;
            const pipeline = row.pipelineAmount || 0;
            const weighted = row.weightedForecastAmount || 0;
            const projected = row.totalProjectedAmount || 0;
            const pct = row.achievementPercent || 0;
            const status = row.statusEvaluation || "CẦN TĂNG TỐC";

            sumTarget += target;
            sumWon += won;
            sumWonDeals += wonDeals;
            sumPipe += pipeline;
            sumWeighted += weighted;
            sumProjected += projected;

            const progressWidth = Math.min(100, pct);
            const progressColor = pct >= 100 ? "#10b981" : (pct >= 80 ? "#0284c7" : (pct >= 50 ? "#f59e0b" : "#ef4444"));

            html += `
                <tr class="${isZebra ? 'zebra' : ''}">
                    <td style="text-align: center; color: var(--crm-muted);">${idx + 1}</td>
                    <td style="font-weight: 600;">${escapeHtml(row.name || "—")}</td>
                    <td style="color: var(--crm-muted);">${escapeHtml(row.teamName || "—")}</td>
                    <td class="num-cell" style="font-weight: 600;">${formatVND(target)}</td>
                    <td class="num-cell" style="color: #059669; font-weight: 600;">${formatVND(won)}</td>
                    <td class="num-cell">${wonDeals}</td>
                    <td class="num-cell" style="color: var(--crm-muted);">${formatVND(pipeline)}</td>
                    <td class="num-cell" style="color: #d97706; font-weight: 600;">${formatVND(weighted)}</td>
                    <td class="num-cell" style="font-weight: 700; color: #0284c7;">${formatVND(projected)}</td>
                    <td>
                        <div class="table-progress-mini">
                            <span style="min-width: 42px; font-weight: 600; font-size: 12px;">${pct.toFixed(1)}%</span>
                            <div class="mini-bar-track">
                                <div class="mini-bar-fill" style="width: ${progressWidth}%; background: ${progressColor};"></div>
                            </div>
                        </div>
                    </td>
                    <td style="text-align: center;">
                        <span class="status-pill ${getStatusClass(status)}">${escapeHtml(status)}</span>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // Render Total row in tfoot
        if (tfoot) {
            const totalPct = sumTarget > 0 ? (sumProjected * 100.0 / sumTarget) : 0;
            tfoot.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: right; padding-right: 16px;">TỔNG CỘNG TOÀN KHỐI:</td>
                    <td class="num-cell">${formatVND(sumTarget)}</td>
                    <td class="num-cell" style="color:#059669;">${formatVND(sumWon)}</td>
                    <td class="num-cell">${sumWonDeals}</td>
                    <td class="num-cell">${formatVND(sumPipe)}</td>
                    <td class="num-cell" style="color:#d97706;">${formatVND(sumWeighted)}</td>
                    <td class="num-cell" style="color:#0284c7;">${formatVND(sumProjected)}</td>
                    <td style="font-weight: 700;">${totalPct.toFixed(1)}% chỉ tiêu</td>
                    <td style="text-align: center;">
                        <span class="status-pill ${getStatusClass(evaluateStatus(totalPct))}">${evaluateStatus(totalPct)}</span>
                    </td>
                </tr>
            `;
        }
    }

    function renderLossAnalysis() {
        const loss = state.data.lossAnalysis || {};
        const byCat = loss.byCategory || [];
        const byComp = loss.byCompetitor || [];

        // 1. Loss by Category
        const catContainer = document.getElementById("lossCategoryContainer");
        const catBadge = document.getElementById("badgeLossCatTotal");
        if (catBadge) {
            catBadge.textContent = `${loss.totalLostDeals || 0} deal thua | ${formatVND(loss.totalLostAmount || 0)}`;
        }

        if (catContainer) {
            if (byCat.length === 0) {
                catContainer.innerHTML = `<div style="text-align:center; padding:25px; color:var(--crm-muted);">Không có cơ hội thua trong kỳ này.</div>`;
            } else {
                let catHtml = "";
                byCat.forEach(item => {
                    const pctAmt = item.percentAmount || 0;
                    const amt = item.totalLostAmount || 0;
                    const count = item.dealCount || 0;
                    catHtml += `
                        <div class="loss-item-row">
                            <div class="loss-item-info">
                                <span class="loss-item-name" title="${escapeHtml(item.reasonName)}">${escapeHtml(item.reasonName)}</span>
                                <span class="loss-item-stats">
                                    <strong>${formatVND(amt)}</strong> (${count} deal - ${pctAmt.toFixed(1)}%)
                                </span>
                            </div>
                            <div class="loss-bar-track">
                                <div class="loss-bar-fill loss-fill-cat" style="width: ${Math.min(100, Math.max(4, pctAmt))}%;"></div>
                            </div>
                        </div>
                    `;
                });
                catContainer.innerHTML = catHtml;
            }
        }

        // 2. Loss by Competitor
        const compContainer = document.getElementById("lossCompetitorContainer");
        const compBadge = document.getElementById("badgeLossCompTotal");
        if (compBadge) {
            compBadge.textContent = `${byComp.length} đối thủ cạnh tranh`;
        }

        if (compContainer) {
            if (byComp.length === 0) {
                compContainer.innerHTML = `<div style="text-align:center; padding:25px; color:var(--crm-muted);">Không phát hiện đối thủ trực tiếp trong kỳ.</div>`;
            } else {
                let compHtml = "";
                byComp.forEach(item => {
                    const pctAmt = item.percentAmount || 0;
                    const amt = item.totalLostAmount || 0;
                    const count = item.dealCount || 0;
                    compHtml += `
                        <div class="loss-item-row">
                            <div class="loss-item-info">
                                <span class="loss-item-name" title="${escapeHtml(item.competitorName)}">${escapeHtml(item.competitorName)}</span>
                                <span class="loss-item-stats">
                                    <strong>${formatVND(amt)}</strong> (${count} deal - ${pctAmt.toFixed(1)}%)
                                </span>
                            </div>
                            <div class="loss-bar-track">
                                <div class="loss-bar-fill loss-fill-comp" style="width: ${Math.min(100, Math.max(4, pctAmt))}%;"></div>
                            </div>
                        </div>
                    `;
                });
                compContainer.innerHTML = compHtml;
            }
        }
    }

    function exportExcel() {
        let url = `${API_BASE}/api/forecasts/export?period=${encodeURIComponent(state.period)}&groupBy=${encodeURIComponent(state.scope)}`;
        if (state.teamId && state.scope === "USER") {
            url += `&teamId=${encodeURIComponent(state.teamId)}`;
        }
        window.location.href = url;
    }

    function setTableLoading() {
        const tbody = document.getElementById("breakdownTbody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 35px; color: var(--crm-muted);">Đang tính toán số liệu dự báo & tiến độ...</td></tr>`;
        }
    }

    function renderError(msg) {
        const tbody = document.getElementById("breakdownTbody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 35px; color: #dc2626;">Lỗi tải dữ liệu: ${escapeHtml(msg)}</td></tr>`;
        }
    }

    function formatVND(num) {
        if (num === null || num === undefined || isNaN(num)) return "0 ₫";
        return new Intl.NumberFormat("vi-VN").format(Math.round(num)) + " ₫";
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

    function getStatusClass(status) {
        if (!status) return "can-tang-toc";
        const upper = status.toUpperCase();
        if (upper.includes("VƯỢT") || upper.includes("VUOT")) return "vuot-chi-tieu";
        if (upper.includes("KHẢ THI") || upper.includes("KHA THI")) return "kha-thi-dat";
        if (upper.includes("TĂNG TỐC") || upper.includes("TANG TOC")) return "can-tang-toc";
        return "nguy-co";
    }

    function evaluateStatus(pct) {
        if (pct >= 100.0) return "VƯỢT CHỈ TIÊU";
        if (pct >= 80.0) return "KHẢ THI ĐẠT";
        if (pct >= 50.0) return "CẦN TĂNG TỐC";
        return "NGUY CƠ KHÔNG ĐẠT";
    }

})();
