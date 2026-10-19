/**
 * Team Activity & Productivity Report Controller
 * Báo cáo hoạt động, năng suất & tỷ lệ SLA lead theo từng thành viên và tuần
 */
(function () {
    "use strict";

    const API_BASE = "http://localhost:8080/crm";

    let state = {
        period: "THIS_MONTH",
        teamId: "",
        data: null
    };

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        bindEvents();
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

    async function loadReport() {
        setTableLoading();
        try {
            let url = `${API_BASE}/api/reports/team-productivity?period=${encodeURIComponent(state.period)}`;
            if (state.teamId) {
                url += `&teamId=${encodeURIComponent(state.teamId)}`;
            }

            const res = await fetch(url, { credentials: "include" });
            if (res.status === 401 || res.status === 403) {
                window.location.href = "login";
                return;
            }
            const json = await res.json();
            if (!json.success) {
                throw new Error(json.message || "Lỗi tải báo cáo năng suất nhóm");
            }

            state.data = json.data;

            // Populate teams dropdown if not done yet
            populateTeamsDropdown(state.data.availableTeams);

            renderAll();
        } catch (err) {
            console.error("Team productivity report load error:", err);
            renderError(err.message);
        }
    }

    function populateTeamsDropdown(teams) {
        if (!teams || !Array.isArray(teams)) return;
        const selectTeam = document.getElementById("selectTeamFilter");
        if (!selectTeam || selectTeam.options.length > 1) return;

        selectTeam.innerHTML = `<option value="">-- Tất cả nhóm kinh doanh --</option>` +
            teams.map(t => `<option value="${t.id}" ${state.teamId == t.id ? 'selected' : ''}>${escapeHtml(t.name)} (${t.memberCount} thành viên)</option>`).join("");
    }

    function renderAll() {
        if (!state.data) return;
        renderSummary();
        renderMatrix();
        renderCoachingCenter();
    }

    function renderSummary() {
        const sum = state.data.summary || {};
        const periodLabel = state.data.periodLabel || "";

        document.getElementById("matrixPeriodLabel").textContent = periodLabel;

        document.getElementById("kpiTotalCalls").textContent = formatNumber(sum.totalCalls || 0);
        document.getElementById("kpiTotalMeetings").textContent = formatNumber(sum.totalMeetings || 0);
        document.getElementById("kpiTotalQuotes").textContent = formatNumber(sum.totalQuotes || 0);

        const avgSla = sum.averageSlaRate !== undefined ? sum.averageSlaRate : 100.0;
        document.getElementById("kpiAvgSlaRate").textContent = avgSla.toFixed(1) + "%";
        document.getElementById("kpiSlaSub").textContent = `${sum.totalLeads || 0} lead được giao chăm sóc`;

        const needsCoaching = sum.needsCoachingCount || 0;
        document.getElementById("kpiNeedsCoaching").textContent = needsCoaching;
        document.getElementById("kpiCoachingSub").textContent = needsCoaching > 0
            ? `${needsCoaching} nhân viên cần hỗ trợ thêm`
            : "Tất cả nhân sự đạt yêu cầu";
    }

    function renderMatrix() {
        const weeks = state.data.weeks || [];
        const members = state.data.members || [];
        const thWeeksGroup = document.getElementById("thWeeksGroup");
        const trSubHeaders = document.getElementById("trSubHeaders");
        const tbody = document.getElementById("productivityTbody");
        const tfoot = document.getElementById("productivityTfoot");

        // 1. Setup dynamic table headers based on weeks
        if (thWeeksGroup) {
            thWeeksGroup.colSpan = weeks.length * 3;
            thWeeksGroup.textContent = `Hoạt động theo tuần (${weeks.length} tuần trong kỳ)`;
        }

        if (trSubHeaders) {
            let weekSubCols = "";
            weeks.forEach(w => {
                weekSubCols += `
                    <th style="min-width:40px; font-size:11px; background:#f0f9ff;" title="${escapeHtml(w.label)}: Cuộc gọi">Gọi</th>
                    <th style="min-width:40px; font-size:11px; background:#f0f9ff;" title="${escapeHtml(w.label)}: Cuộc gặp">Gặp</th>
                    <th style="min-width:40px; font-size:11px; background:#f0f9ff;" title="${escapeHtml(w.label)}: Báo giá gửi đi">BG</th>
                `;
            });
            trSubHeaders.innerHTML = weekSubCols + `
                <th style="min-width:50px;">Tổng Gọi</th>
                <th style="min-width:50px;">Tổng Gặp</th>
                <th style="min-width:50px;">Tổng BG</th>
                <th style="min-width:55px; font-weight:700; color:var(--crm-primary);">Tổng HĐ</th>
                <th style="min-width:60px;">Lead giao</th>
                <th style="min-width:60px; color:#059669;">Đạt SLA</th>
                <th style="min-width:60px; color:#dc2626;">Quá hạn</th>
                <th style="min-width:130px;">Tỷ lệ SLA (%)</th>
            `;
        }

        // 2. Render table body rows
        if (members.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${13 + weeks.length * 3}" style="text-align:center; padding:35px; color:var(--crm-muted);">Không có thành viên trong nhóm đã chọn.</td></tr>`;
            if (tfoot) tfoot.innerHTML = "";
            return;
        }

        let html = "";
        let totCalls = 0;
        let totMeetings = 0;
        let totQuotes = 0;
        let totActivities = 0;
        let totLeads = 0;
        let totInSla = 0;
        let totBreached = 0;

        members.forEach((m, idx) => {
            const isZebra = idx % 2 === 1;
            const weeklyStats = m.weeklyStats || {};

            totCalls += (m.totalCalls || 0);
            totMeetings += (m.totalMeetings || 0);
            totQuotes += (m.totalQuotes || 0);
            totActivities += (m.totalActivities || 0);
            totLeads += (m.totalLeads || 0);
            totInSla += (m.leadsInSla || 0);
            totBreached += (m.leadsBreached || 0);

            const slaRate = m.slaRate !== undefined ? m.slaRate : 100.0;
            const slaColor = slaRate >= 90 ? "#10b981" : (slaRate >= 80 ? "#0284c7" : "#ef4444");

            let weeklyCells = "";
            weeks.forEach(w => {
                const ws = weeklyStats[w.weekCode] || { calls: 0, meetings: 0, quotes: 0 };
                weeklyCells += `
                    <td style="text-align:center; font-weight:500;">${ws.calls > 0 ? `<span class="activity-sub-badge sub-call">${ws.calls}</span>` : '<span style="color:#cbd5e1;">0</span>'}</td>
                    <td style="text-align:center; font-weight:500;">${ws.meetings > 0 ? `<span class="activity-sub-badge sub-meeting">${ws.meetings}</span>` : '<span style="color:#cbd5e1;">0</span>'}</td>
                    <td style="text-align:center; font-weight:500;">${ws.quotes > 0 ? `<span class="activity-sub-badge sub-quote">${ws.quotes}</span>` : '<span style="color:#cbd5e1;">0</span>'}</td>
                `;
            });

            const needsCoaching = m.needsCoaching;
            const coachingReason = m.coachingReason || "";
            const rating = m.productivityRating || "ĐẠT YÊU CẦU";

            let badgeHtml = "";
            if (needsCoaching) {
                badgeHtml = `<span class="coaching-badge needs-coaching" title="${escapeHtml(coachingReason)}">⚠️ Cần kèm thêm</span>`;
            } else if (rating === "XUẤT SẮC") {
                badgeHtml = `<span class="coaching-badge good"> Xuất sắc</span>`;
            } else {
                badgeHtml = `<span class="coaching-badge ok"> Đạt yêu cầu</span>`;
            }

            html += `
                <tr class="${isZebra ? 'zebra' : ''}">
                    <td style="text-align:center; color:var(--crm-muted);">${idx + 1}</td>
                    <td style="font-weight:600; text-align:left;">
                        ${escapeHtml(m.fullName)}
                        ${needsCoaching ? `<div style="font-size:11px; color:#dc2626; font-weight:400;">${escapeHtml(coachingReason)}</div>` : ''}
                    </td>
                    <td style="color:var(--crm-muted); text-align:left;">${escapeHtml(m.teamName)}</td>
                    ${weeklyCells}
                    <td style="text-align:center; font-weight:600;">${m.totalCalls || 0}</td>
                    <td style="text-align:center; font-weight:600;">${m.totalMeetings || 0}</td>
                    <td style="text-align:center; font-weight:600;">${m.totalQuotes || 0}</td>
                    <td style="text-align:center; font-weight:700; color:var(--crm-primary);">${m.totalActivities || 0}</td>
                    <td style="text-align:center;">${m.totalLeads || 0}</td>
                    <td style="text-align:center; color:#059669; font-weight:600;">${m.leadsInSla || 0}</td>
                    <td style="text-align:center; color:#dc2626; font-weight:600;">${m.leadsBreached || 0}</td>
                    <td>
                        <div style="display:inline-flex; align-items:center; gap:6px; min-width:110px;">
                            <span style="font-weight:600; font-size:12px; min-width:38px;">${slaRate.toFixed(1)}%</span>
                            <div style="flex:1; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;">
                                <div style="width:${Math.min(100, slaRate)}%; height:100%; background:${slaColor}; border-radius:3px;"></div>
                            </div>
                        </div>
                    </td>
                    <td style="text-align:center;">${badgeHtml}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // 3. Render Total row in tfoot
        if (tfoot) {
            const avgSla = totLeads > 0 ? (totInSla * 100.0 / totLeads) : 100.0;
            tfoot.innerHTML = `
                <tr>
                    <td colspan="${3 + weeks.length * 3}" style="text-align:right; padding-right:16px;">TỔNG CỘNG TOÀN NHÓM:</td>
                    <td style="text-align:center; font-weight:700;">${totCalls}</td>
                    <td style="text-align:center; font-weight:700;">${totMeetings}</td>
                    <td style="text-align:center; font-weight:700;">${totQuotes}</td>
                    <td style="text-align:center; font-weight:700; color:var(--crm-primary);">${totActivities}</td>
                    <td style="text-align:center; font-weight:700;">${totLeads}</td>
                    <td style="text-align:center; font-weight:700; color:#059669;">${totInSla}</td>
                    <td style="text-align:center; font-weight:700; color:#dc2626;">${totBreached}</td>
                    <td style="font-weight:700;">${avgSla.toFixed(1)}% trung bình</td>
                    <td style="text-align:center;">${state.data.summary?.needsCoachingCount || 0} cần kèm</td>
                </tr>
            `;
        }
    }

    function renderCoachingCenter() {
        const grid = document.getElementById("coachingCardsGrid");
        if (!grid) return;

        const members = state.data.members || [];
        const needsCoachingList = members.filter(m => m.needsCoaching);

        if (needsCoachingList.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px; text-align:center; color:#15803d;">
                    <div style="font-size:24px; margin-bottom:6px;">🎉</div>
                    <div style="font-weight:700; font-size:15px; margin-bottom:4px;">Hiệu suất nhóm xuất sắc!</div>
                    <div style="font-size:13px; color:#166534;">Tất cả thành viên trong nhóm đều đáp ứng tiêu chuẩn phản hồi SLA và chỉ tiêu hoạt động gọi điện, gặp mặt khách hàng.</div>
                </div>
            `;
            return;
        }

        let html = "";
        needsCoachingList.forEach(m => {
            const slaRate = m.slaRate !== undefined ? m.slaRate : 0;
            const calls = m.totalCalls || 0;
            const meetings = m.totalMeetings || 0;
            const quotes = m.totalQuotes || 0;
            const breached = m.leadsBreached || 0;

            let diagnosisDetails = [];
            let advice = "";

            if (m.totalLeads > 0 && slaRate < 80) {
                diagnosisDetails.push(`Tỷ lệ phản hồi SLA chỉ đạt <strong>${slaRate.toFixed(1)}%</strong> (${breached}/${m.totalLeads} lead bị quá hạn cam kết).`);
                advice = "Trưởng nhóm cần rà soát lại quy trình tiếp nhận & phản hồi lead, kèm cặp trực tiếp thao tác gọi điện/nhắn tin trong 5 phút đầu.";
            }
            if (calls + meetings < 8) {
                diagnosisDetails.push(`Tương tác khách hàng còn yếu: chỉ có <strong>${calls} cuộc gọi</strong> và <strong>${meetings} cuộc gặp</strong> trong kỳ.`);
                if (!advice) {
                    advice = "Cần lên lịch huấn luyện kỹ năng telesales và đặt chỉ tiêu tối thiểu 5 cuộc gọi mỗi ngày.";
                }
            }
            if (quotes === 0 && (calls + meetings >= 8)) {
                diagnosisDetails.push(`Đã tiếp cận nhiều khách nhưng <strong>chưa gửi được báo giá nào</strong>.`);
                if (!advice) {
                    advice = "Cần cùng xem lại các deal cơ hội để hỗ trợ lập báo giá và chốt đề xuất giá trị.";
                }
            }

            const initials = getInitials(m.fullName);

            html += `
                <div class="coach-alert-card">
                    <div>
                        <div class="coach-card-top">
                            <div class="coach-avatar">${initials}</div>
                            <div>
                                <div class="coach-user-name">${escapeHtml(m.fullName)}</div>
                                <div class="coach-team-name">${escapeHtml(m.teamName)}</div>
                            </div>
                        </div>
                        <div class="coach-issue-box">
                            <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:5px;">
                                <span>⚠️</span> Vấn đề cần khắc phục:
                            </div>
                            <ul style="margin:0; padding-left:18px;">
                                ${diagnosisDetails.map(d => `<li>${d}</li>`).join("")}
                            </ul>
                            <div style="margin-top:8px; font-style:italic; border-top:1px dashed #fed7d7; padding-top:6px;">
                                💡 <strong>Gợi ý kèm cặp:</strong> ${advice}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <a href="activities" class="coach-action-btn" style="flex:1;">
                            📞 Xem hoạt động của ${escapeHtml(m.fullName.split(' ').pop())}
                        </a>
                        <a href="calendar" class="crm-btn crm-btn-secondary" style="font-size:12px; padding:7px 12px; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                            📅 Đặt lịch 1-1
                        </a>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
    }

    function exportExcel() {
        let url = `${API_BASE}/api/reports/team-productivity/export?period=${encodeURIComponent(state.period)}`;
        if (state.teamId) {
            url += `&teamId=${encodeURIComponent(state.teamId)}`;
        }
        window.location.href = url;
    }

    function setTableLoading() {
        const tbody = document.getElementById("productivityTbody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="15" style="text-align: center; padding: 35px; color: var(--crm-muted);">Đang tổng hợp số liệu hoạt động và phản hồi SLA...</td></tr>`;
        }
    }

    function renderError(msg) {
        const tbody = document.getElementById("productivityTbody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="15" style="text-align: center; padding: 35px; color: #dc2626;">Lỗi tải dữ liệu: ${escapeHtml(msg)}</td></tr>`;
        }
    }

    function formatNumber(num) {
        return new Intl.NumberFormat("vi-VN").format(Math.round(num || 0));
    }

    function getInitials(name) {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

})();
