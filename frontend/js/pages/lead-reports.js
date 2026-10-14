/**
 * Báo cáo Hiệu quả Nguồn Lead & Đo lường ROI Marketing
 * User Story 6: Marketing Lead Source & Campaign ROI Report
 */

"use strict";

const API_BASE = "http://localhost:8080/crm";

// DOM Elements
const btnRefresh = document.getElementById("btnRefresh");
const btnExportExcel = document.getElementById("btnExportExcel");
const btnApplyDateFilter = document.getElementById("btnApplyDateFilter");
const inputFromDate = document.getElementById("inputFromDate");
const inputToDate = document.getElementById("inputToDate");
const presetButtons = document.querySelectorAll(".preset-chip");

// KPI Elements
const kpiTotalLeads = document.getElementById("kpiTotalLeads");
const kpiTotalLeadsSub = document.getElementById("kpiTotalLeadsSub");
const kpiAcceptanceRate = document.getElementById("kpiAcceptanceRate");
const kpiAcceptedLeadsSub = document.getElementById("kpiAcceptedLeadsSub");
const kpiConversionRate = document.getElementById("kpiConversionRate");
const kpiConvertedLeadsSub = document.getElementById("kpiConvertedLeadsSub");
const kpiTotalOpportunities = document.getElementById("kpiTotalOpportunities");
const kpiTotalWonRevenue = document.getElementById("kpiTotalWonRevenue");
const kpiWonOppsSub = document.getElementById("kpiWonOppsSub");

// Recommendation Banner
const recommendationBanner = document.getElementById("recommendationBanner");
const recommendationTitle = document.getElementById("recommendationTitle");
const recommendationDesc = document.getElementById("recommendationDesc");

// Tables & Tabs
const countSources = document.getElementById("countSources");
const countCampaigns = document.getElementById("countCampaigns");
const leadSourcesTbody = document.getElementById("leadSourcesTbody");
const leadSourcesTfoot = document.getElementById("leadSourcesTfoot");
const campaignsTbody = document.getElementById("campaignsTbody");
const campaignsTfoot = document.getElementById("campaignsTfoot");
const tabButtons = document.querySelectorAll(".report-tab-btn");
const tabPanes = document.querySelectorAll(".report-tab-pane");

let currentFromDate = "";
let currentToDate = "";
let currentReport = null;

// Helpers
function formatNumber(num) {
    if (num === null || num === undefined) return "0";
    return Number(num).toLocaleString("vi-VN");
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return "0 đ";
    return Number(amount).toLocaleString("vi-VN") + " đ";
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

function getSourceIcon(code, name) {
    const text = ((code || "") + " " + (name || "")).toUpperCase();
    if (text.includes("HOI_THAO") || text.includes("HỘI THẢO")) return "🎪";
    if (text.includes("SU_KIEN") || text.includes("SỰ KIỆN") || text.includes("WORKSHOP")) return "🎟️";
    if (text.includes("WEBSITE") || text.includes("FORM")) return "🌐";
    if (text.includes("FACEBOOK") || text.includes("MẠNG XÃ HỘI")) return "📱";
    if (text.includes("GOOGLE") || text.includes("SEARCH")) return "🔍";
    if (text.includes("GIOI_THIEU") || text.includes("GIỚI THIỆU") || text.includes("NGƯỜI QUEN")) return "🤝";
    if (text.includes("TIKTOK")) return "🎵";
    if (text.includes("LINKEDIN")) return "💼";
    if (text.includes("EMAIL")) return "📧";
    if (text.includes("DANH_THIEP")) return "📇";
    if (text.includes("COLD_CALL") || text.includes("TELESALES")) return "📞";
    if (text.includes("CHUA_XAC_DINH") || text.includes("CHƯA PHÂN LOẠI") || text.includes("CHƯA XÁC ĐỊNH")) return "❓";
    return "🌐";
}

async function api(path) {
    const response = await fetch(API_BASE + path, {
        credentials: "include",
        headers: { "Accept": "application/json" }
    });

    let result;
    try {
        result = await response.json();
    } catch (_) {
        result = null;
    }

    if (response.status === 401) {
        window.location.href = "login";
        throw new Error("Phiên đăng nhập đã hết hạn.");
    }

    if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Lỗi HTTP ${response.status}`);
    }

    return result.data;
}

/* =========================================================
   DATE PRESETS CALCULATION
========================================================= */
function setDatePreset(preset) {
    const now = new Date();
    const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    if (preset === "TODAY") {
        currentFromDate = formatDate(now);
        currentToDate = formatDate(now);
    } else if (preset === "LAST_7_DAYS") {
        const past = new Date();
        past.setDate(past.getDate() - 7);
        currentFromDate = formatDate(past);
        currentToDate = formatDate(now);
    } else if (preset === "THIS_MONTH") {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        currentFromDate = formatDate(firstDay);
        currentToDate = formatDate(now);
    } else if (preset === "THIS_QUARTER") {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const firstDayQ = new Date(now.getFullYear(), quarterMonth, 1);
        currentFromDate = formatDate(firstDayQ);
        currentToDate = formatDate(now);
    } else {
        // ALL
        currentFromDate = "";
        currentToDate = "";
    }

    if (inputFromDate) inputFromDate.value = currentFromDate;
    if (inputToDate) inputToDate.value = currentToDate;

    presetButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.preset === preset);
    });

    loadReportData();
}

/* =========================================================
   LOAD & RENDER REPORT DATA
========================================================= */
async function loadReportData() {
    try {
        if (leadSourcesTbody) {
            leadSourcesTbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--crm-muted);">⏳ Đang tính toán số liệu hiệu quả nguồn lead & chiến dịch...</td></tr>`;
        }
        if (campaignsTbody) {
            campaignsTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:30px; color:var(--crm-muted);">⏳ Đang tính toán dữ liệu chiến dịch marketing...</td></tr>`;
        }

        const params = new URLSearchParams();
        if (currentFromDate) params.append("fromDate", currentFromDate);
        if (currentToDate) params.append("toDate", currentToDate);

        const data = await api(`/api/reports/lead-sources?${params.toString()}`);
        currentReport = data;

        const kpis = data?.kpis || data?.summary || {};
        const sources = data?.sources || data?.leadSources || [];
        const campaigns = data?.campaigns || [];

        renderSummary(kpis, sources);
        renderRecommendation(sources);
        renderLeadSources(sources, kpis);
        renderCampaigns(campaigns);
    } catch (err) {
        console.error("Lỗi tải báo cáo nguồn lead:", err);
        if (leadSourcesTbody) {
            leadSourcesTbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#dc2626; padding:20px;">Lỗi tải dữ liệu: ${escapeHtml(err.message)}</td></tr>`;
        }
    }
}

function renderSummary(kpis, sources) {
    if (!kpis) return;

    const totalLeads = kpis.totalLeads ?? 0;
    const totalAccepted = kpis.totalAccepted ?? kpis.acceptedLeads ?? 0;
    const accRate = kpis.overallAcceptanceRate ?? kpis.acceptanceRate ?? 0;
    const totalConverted = kpis.totalConverted ?? kpis.convertedLeads ?? 0;
    const convRate = kpis.overallConversionRate ?? kpis.conversionRate ?? 0;
    const wonRevenue = kpis.totalWonRevenue ?? 0;

    let totalOpps = 0;
    let totalWonOpps = 0;
    (sources || []).forEach(s => {
        totalOpps += Number(s.totalOpportunities || 0);
        totalWonOpps += Number(s.wonOpportunities || 0);
    });

    if (kpiTotalLeads) kpiTotalLeads.textContent = formatNumber(totalLeads);
    if (kpiTotalLeadsSub) {
        const timeText = (currentFromDate && currentToDate) ? `từ ${currentFromDate} đến ${currentToDate}` : "toàn thời gian";
        kpiTotalLeadsSub.textContent = `Tổng thu được ${timeText}`;
    }

    if (kpiAcceptanceRate) {
        kpiAcceptanceRate.textContent = `${Number(accRate).toFixed(1)}%`;
    }
    if (kpiAcceptedLeadsSub) {
        kpiAcceptedLeadsSub.textContent = `${formatNumber(totalAccepted)} / ${formatNumber(totalLeads)} lead đã được Sales nhận`;
    }

    if (kpiConversionRate) {
        kpiConversionRate.textContent = `${Number(convRate).toFixed(1)}%`;
    }
    if (kpiConvertedLeadsSub) {
        kpiConvertedLeadsSub.textContent = `${formatNumber(totalConverted)} lead đã chuyển thành Cơ hội`;
    }

    if (kpiTotalOpportunities) {
        kpiTotalOpportunities.textContent = formatNumber(totalOpps);
    }

    if (kpiTotalWonRevenue) {
        kpiTotalWonRevenue.textContent = formatCurrency(wonRevenue);
    }
    if (kpiWonOppsSub) {
        kpiWonOppsSub.textContent = `${formatNumber(totalWonOpps)} hợp đồng thành công`;
    }
}

function renderRecommendation(sources) {
    if (!recommendationBanner) return;
    if (!sources || sources.length === 0) {
        recommendationBanner.style.display = "none";
        return;
    }

    // Tìm kênh có doanh thu won cao nhất và tỷ lệ chuyển đổi tốt
    const ranked = [...sources].sort((a, b) => (b.wonRevenue || 0) - (a.wonRevenue || 0));
    const topSource = ranked[0];

    if (topSource && (topSource.wonRevenue > 0 || topSource.totalLeads > 0)) {
        recommendationBanner.style.display = "flex";
        if (recommendationTitle) {
            recommendationTitle.innerHTML = `💡 Kênh chiến lược dẫn đầu doanh thu: <strong>${escapeHtml(topSource.sourceName)}</strong>`;
        }
        if (recommendationDesc) {
            recommendationDesc.innerHTML = `
                Nguồn <strong>${escapeHtml(topSource.sourceName)}</strong> thu hút <strong>${formatNumber(topSource.totalLeads)}</strong> lead với tỷ lệ chuyển đổi cơ hội đạt 
                <strong>${Number(topSource.conversionRate || 0).toFixed(1)}%</strong>, mang về <strong>${formatCurrency(topSource.wonRevenue)}</strong> doanh thu thực tế.
                <br>🎯 <em>Khuyến nghị cho Marketing:</em> Tiếp tục duy trì và ưu tiên rót ngân sách vào kênh này để tối đa hóa doanh thu của doanh nghiệp.
            `;
        }
    } else {
        recommendationBanner.style.display = "none";
    }
}

function renderLeadSources(sources, kpis) {
    if (!leadSourcesTbody) return;
    leadSourcesTbody.innerHTML = "";

    const list = Array.isArray(sources) ? sources : [];
    if (countSources) countSources.textContent = list.length;

    if (list.length === 0) {
        leadSourcesTbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:var(--crm-muted);">Chưa có dữ liệu khách hàng theo nguồn trong khoảng thời gian này.</td></tr>`;
        if (leadSourcesTfoot) leadSourcesTfoot.innerHTML = "";
        return;
    }

    let sumLeads = 0;
    let sumAccepted = 0;
    let sumOpps = 0;
    let sumWonOpps = 0;
    let sumWonRev = 0;

    list.forEach(item => {
        const tr = document.createElement("tr");

        const icon = getSourceIcon(item.sourceCode, item.sourceName);
        const leads = Number(item.totalLeads || 0);
        const accepted = Number(item.acceptedLeads || 0);
        const accRate = Number(item.acceptanceRate || 0);
        const opps = Number(item.totalOpportunities || 0);
        const convRate = Number(item.conversionRate || 0);
        const wonOpps = Number(item.wonOpportunities || 0);
        const wonRev = Number(item.wonRevenue || 0);

        sumLeads += leads;
        sumAccepted += accepted;
        sumOpps += opps;
        sumWonOpps += wonOpps;
        sumWonRev += wonRev;

        let ratingBadge = "";
        if (convRate >= 20 || wonRev >= 100000000) {
            ratingBadge = `<span class="progress-pill high">⭐⭐⭐ Xuất sắc</span>`;
        } else if (convRate >= 10 || wonRev > 0) {
            ratingBadge = `<span class="progress-pill medium">⭐⭐ Tiềm năng</span>`;
        } else {
            ratingBadge = `<span class="progress-pill low">⚠️ Cần tối ưu</span>`;
        }

        tr.innerHTML = `
            <td>
                <span class="channel-tag">
                    <span>${icon}</span>
                    <span>${escapeHtml(item.sourceName)}</span>
                </span>
            </td>
            <td style="text-align: right; font-weight: 700;">${formatNumber(leads)}</td>
            <td style="text-align: right;">${formatNumber(accepted)}</td>
            <td style="text-align: right; font-weight: 600; color: #15803d;">${accRate.toFixed(1)}%</td>
            <td style="text-align: right;">${formatNumber(opps)}</td>
            <td style="text-align: right; font-weight: 700; color: #7e22ce;">${convRate.toFixed(1)}%</td>
            <td style="text-align: right; font-weight: 600;">${formatNumber(wonOpps)}</td>
            <td style="text-align: right; font-weight: 700; color: #059669;">${formatCurrency(wonRev)}</td>
            <td style="text-align: center;">${ratingBadge}</td>
        `;
        leadSourcesTbody.appendChild(tr);
    });

    if (leadSourcesTfoot) {
        const overallAcc = sumLeads > 0 ? (sumAccepted / sumLeads) * 100 : 0;
        const overallConv = sumLeads > 0 ? ((kpis?.totalConverted ?? 0) / sumLeads) * 100 : 0;
        leadSourcesTfoot.innerHTML = `
            <tr class="total-row">
                <td>TỔNG CỘNG TẤT CẢ NGUỒN</td>
                <td style="text-align: right; font-size: 14px;">${formatNumber(sumLeads)}</td>
                <td style="text-align: right;">${formatNumber(sumAccepted)}</td>
                <td style="text-align: right; color: #15803d;">${overallAcc.toFixed(1)}%</td>
                <td style="text-align: right;">${formatNumber(sumOpps)}</td>
                <td style="text-align: right; color: #7e22ce;">${overallConv.toFixed(1)}%</td>
                <td style="text-align: right;">${formatNumber(sumWonOpps)}</td>
                <td style="text-align: right; font-size: 14px; color: #059669;">${formatCurrency(sumWonRev)}</td>
                <td style="text-align: center;">—</td>
            </tr>
        `;
    }
}

function renderCampaigns(campaigns) {
    if (!campaignsTbody) return;
    campaignsTbody.innerHTML = "";

    const list = Array.isArray(campaigns) ? campaigns : [];
    if (countCampaigns) countCampaigns.textContent = list.length;

    if (list.length === 0) {
        campaignsTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:24px; color:var(--crm-muted);">Chưa có dữ liệu chiến dịch marketing nào.</td></tr>`;
        if (campaignsTfoot) campaignsTfoot.innerHTML = "";
        return;
    }

    let sumBudget = 0;
    let sumLeads = 0;
    let sumOpps = 0;
    let sumWon = 0;
    let sumRevenue = 0;

    list.forEach(c => {
        const tr = document.createElement("tr");

        const budget = Number(c.budget || 0);
        const leads = Number(c.totalLeads || 0);
        const opps = Number(c.totalOpportunities || 0);
        const won = Number(c.wonOpportunities || 0);
        const revenue = Number(c.wonRevenue || 0);
        const roi = Number(c.roi !== undefined ? c.roi : (c.roiPercent || 0));

        sumBudget += budget;
        sumLeads += leads;
        sumOpps += opps;
        sumWon += won;
        sumRevenue += revenue;

        const cpl = leads > 0 && budget > 0 ? Math.round(budget / leads) : 0;

        let roiHtml = "";
        let roiEval = "";
        if (budget > 0) {
            if (roi > 0) {
                roiHtml = `<span style="font-weight:700; color:#15803d;">+${roi.toFixed(1)}%</span>`;
                roiEval = `<span class="progress-pill high">🚀 Sinh lời cao</span>`;
            } else if (revenue > 0) {
                roiHtml = `<span style="font-weight:600; color:#b45309;">${roi.toFixed(1)}%</span>`;
                roiEval = `<span class="progress-pill medium">Thu hồi vốn</span>`;
            } else {
                roiHtml = `<span style="font-weight:600; color:#dc2626;">-100%</span>`;
                roiEval = `<span class="progress-pill low">Chưa có doanh thu</span>`;
            }
        } else {
            roiHtml = `<span style="color:#94a3b8;">—</span>`;
            roiEval = revenue > 0 ? `<span class="progress-pill high">🌟 Doanh thu thuần</span>` : `<span style="color:#94a3b8;">Không tốn phí</span>`;
        }

        tr.innerHTML = `
            <td>
                <strong>${escapeHtml(c.campaignName)}</strong>
            </td>
            <td><code>${escapeHtml(c.campaignCode || "—")}</code></td>
            <td>${escapeHtml(c.channel || "—")}</td>
            <td>
                <span class="status-pill status-${(c.status || "").toLowerCase()}">
                    ${escapeHtml(c.status || "—")}
                </span>
            </td>
            <td style="text-align: right;">${formatCurrency(budget)}</td>
            <td style="text-align: right; font-weight: 700;">${formatNumber(leads)}</td>
            <td style="text-align: right; color:#64748b;">${cpl > 0 ? formatCurrency(cpl) : "—"}</td>
            <td style="text-align: right;">${formatNumber(opps)}</td>
            <td style="text-align: right; font-weight: 600;">${formatNumber(won)}</td>
            <td style="text-align: right; font-weight: 700; color: #059669;">${formatCurrency(revenue)}</td>
            <td style="text-align: right;">${roiHtml}</td>
            <td style="text-align: center;">${roiEval}</td>
        `;
        campaignsTbody.appendChild(tr);
    });

    if (campaignsTfoot) {
        const overallRoi = sumBudget > 0 ? ((sumRevenue - sumBudget) / sumBudget) * 100 : 0;
        campaignsTfoot.innerHTML = `
            <tr class="total-row">
                <td colspan="4">TỔNG CỘNG TẤT CẢ CHIẾN DỊCH</td>
                <td style="text-align: right; font-size: 14px;">${formatCurrency(sumBudget)}</td>
                <td style="text-align: right; font-size: 14px;">${formatNumber(sumLeads)}</td>
                <td style="text-align: right;">${sumLeads > 0 && sumBudget > 0 ? formatCurrency(Math.round(sumBudget / sumLeads)) : "—"}</td>
                <td style="text-align: right;">${formatNumber(sumOpps)}</td>
                <td style="text-align: right;">${formatNumber(sumWon)}</td>
                <td style="text-align: right; font-size: 14px; color: #059669;">${formatCurrency(sumRevenue)}</td>
                <td style="text-align: right; font-weight: 700; color: ${overallRoi >= 0 ? '#15803d' : '#dc2626'};">${overallRoi >= 0 ? '+' : ''}${overallRoi.toFixed(1)}%</td>
                <td style="text-align: center;">—</td>
            </tr>
        `;
    }
}

/* =========================================================
   EVENT LISTENERS & EXPORT
========================================================= */
presetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const preset = btn.dataset.preset;
        setDatePreset(preset);
    });
});

btnApplyDateFilter?.addEventListener("click", () => {
    currentFromDate = inputFromDate?.value.trim() || "";
    currentToDate = inputToDate?.value.trim() || "";
    presetButtons.forEach(btn => btn.classList.remove("active"));
    loadReportData();
});

btnRefresh?.addEventListener("click", () => {
    loadReportData();
});

btnExportExcel?.addEventListener("click", () => {
    const params = new URLSearchParams();
    if (currentFromDate) params.append("fromDate", currentFromDate);
    if (currentToDate) params.append("toDate", currentToDate);

    const exportUrl = `${API_BASE}/api/reports/lead-sources/export?${params.toString()}`;
    window.open(exportUrl, "_blank");
});

// Tab switching
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        tabPanes.forEach(p => p.classList.remove("active"));

        btn.classList.add("active");
        const targetTabId = btn.dataset.tab;
        const targetPane = document.getElementById(targetTabId);
        if (targetPane) targetPane.classList.add("active");
    });
});

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    loadReportData();
});
