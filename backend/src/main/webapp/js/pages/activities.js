"use strict";

function fixMojibake(str) {
    if (!str || typeof str !== "string") return str;
    if (!str.includes("Æ") && !str.includes("Ã") && !str.includes("áº") && !str.includes("á»") && !str.includes("Ä")) {
        return str;
    }
    try {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code === 0xC3 && i + 1 < str.length && str.charCodeAt(i + 1) === 0x20) {
                bytes.push(0xC3, 0xA0);
                i++;
                continue;
            }
            if (code <= 0xFF) {
                bytes.push(code);
            } else {
                return str;
            }
        }
        return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
    } catch (_) {
        return str;
    }
}

const API_BASE = "http://localhost:8080/crm";

let activities = [];

const drawer = document.getElementById("activityDrawer");
const overlay = document.getElementById("activityOverlay");
const activityForm = document.getElementById("activityForm");

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
async function loadActivities() {
    try {
        const data = await api("/api/activities");
        if (Array.isArray(data)) {
            activities = data.map(item => normalizeActivityFromBackend(item));
            saveActivitiesCache();
            render();
            return;
        }
    } catch (err) {
        console.warn("Could not load activities from backend, falling back to cache:", err);
    }

    try {
        const cached = JSON.parse(localStorage.getItem("crm_ui_activities"));
        activities = Array.isArray(cached) ? cached.map(item => ({
            ...item,
            title: fixMojibake(item.title || item.subject || "Hoạt động"),
            relation: fixMojibake(item.relation || item.customerName || ""),
            description: fixMojibake(item.description || "")
        })) : [];
    } catch {
        activities = [];
    }
    render();
}

function normalizeActivityFromBackend(item) {
    let dateStr = "";
    let timeStr = "";
    if (item.dueDate) {
        const dt = new Date(item.dueDate);
        if (!isNaN(dt.getTime())) {
            dateStr = dt.toISOString().split("T")[0];
            timeStr = dt.toTimeString().slice(0, 5);
        }
    }

    const rel = item.customerName || item.opportunityName || item.relation || "";
    const st = (item.status || "OPEN").toUpperCase() === "COMPLETED" ? "done" : "open";

    return {
        id: item.id,
        type: (item.type || "task").toLowerCase(),
        title: fixMojibake(item.subject || item.title || "Hoạt động"),
        relation: fixMojibake(rel),
        date: dateStr,
        time: timeStr,
        ownerId: item.ownerId || item.createdById || null,
        owner: fixMojibake(item.ownerName || item.createdByName || "Tôi"),
        description: fixMojibake(item.description || ""),
        reminder: !!item.reminder,
        status: st,
        customerId: item.customerId,
        contactId: item.contactId,
        contactName: fixMojibake(item.contactName || ""),
        opportunityId: item.opportunityId,
        durationMinutes: item.durationMinutes || 0,
        outcome: fixMojibake(item.outcome || ""),
        createdAt: item.createdAt || new Date().toISOString()
    };
}

function saveActivitiesCache() {
    try {
        localStorage.setItem("crm_ui_activities", JSON.stringify(activities));
    } catch (_) {}
}

/* =========================================================
   EVENT LISTENERS
========================================================= */
document.getElementById("createActivity")?.addEventListener("click", () => openDrawer());
document.getElementById("closeActivityDrawer")?.addEventListener("click", closeDrawer);
document.getElementById("cancelActivity")?.addEventListener("click", closeDrawer);
overlay?.addEventListener("click", closeDrawer);

["activitySearch", "activityTypeFilter", "activityStatusFilter"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", render);
    document.getElementById(id)?.addEventListener("change", render);
});

activityForm?.addEventListener("submit", event => {
    event.preventDefault();
    saveActivity();
});

document.addEventListener("click", async event => {
    const editBtn = event.target.closest("[data-edit-activity]");
    if (editBtn) {
        const id = editBtn.dataset.editActivity;
        const item = activities.find(row => String(row.id) === String(id));
        if (item) openDrawer(item);
        return;
    }

    const completeBtn = event.target.closest("[data-complete-activity]");
    if (completeBtn) {
        const id = completeBtn.dataset.completeActivity;
        const item = activities.find(row => String(row.id) === String(id));
        if (item) {
            const newStatus = item.status === "done" ? "OPEN" : "COMPLETED";
            try {
                if (typeof item.id === "number") {
                    await api(`/api/activities/${item.id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            subject: item.title,
                            type: item.type,
                            description: item.description,
                            status: newStatus,
                            dueDate: item.date ? `${item.date} ${item.time || "09:00"}:00` : null
                        })
                    });
                }
                item.status = newStatus === "COMPLETED" ? "done" : "open";
                saveActivitiesCache();
                render();
            } catch (err) {
                alert("Lỗi khi cập nhật trạng thái hoạt động: " + err.message);
            }
        }
        return;
    }

    const deleteBtn = event.target.closest("[data-delete-activity]");
    if (deleteBtn) {
        const id = deleteBtn.dataset.deleteActivity;
        if (confirm("Bạn có chắc chắn muốn xóa hoạt động này không?")) {
            try {
                if (typeof Number(id) === "number" && !isNaN(Number(id))) {
                    await api(`/api/activities/${id}`, { method: "DELETE" });
                }
                activities = activities.filter(a => String(a.id) !== String(id));
                saveActivitiesCache();
                render();
            } catch (err) {
                alert("Lỗi khi xóa hoạt động: " + err.message);
            }
        }
    }
});

/* =========================================================
   SAVE / EDIT ACTIVITY
========================================================= */
async function saveActivity() {
    const title = value("activityTitle");
    const error = document.getElementById("activityError");
    if (error) error.textContent = "";

    if (!title) {
        if (error) error.textContent = "Vui lòng nhập tiêu đề hoạt động.";
        return;
    }

    const editingId = value("editingActivityId");
    const type = value("activityType") || "task";
    const relation = value("activityRelation");
    const date = value("activityDate");
    const time = value("activityTime");
    const owner = value("activityOwner");
    const description = value("activityDescription");
    const reminder = document.getElementById("activityReminder")?.checked;

    const duration = value("activityDuration") || 30;
    const outcome = value("activityOutcome");

    const dueDateStr = date ? `${date} ${time || "09:00"}:00` : null;

    try {
        if (editingId && !isNaN(Number(editingId))) {
            const updated = await api(`/api/activities/${editingId}`, {
                method: "PUT",
                body: JSON.stringify({
                    subject: title,
                    type: type.toUpperCase(),
                    description: description,
                    outcome: outcome,
                    durationMinutes: Number(duration) || 0,
                    status: "OPEN",
                    dueDate: dueDateStr
                })
            });
            await loadActivities();
        } else {
            const created = await api("/api/activities", {
                method: "POST",
                body: JSON.stringify({
                    subject: title,
                    type: type.toUpperCase(),
                    description: description,
                    outcome: outcome,
                    durationMinutes: Number(duration) || 0,
                    status: "COMPLETED",
                    dueDate: dueDateStr
                })
            });
            await loadActivities();
        }

        closeDrawer();
    } catch (err) {
        if (error) error.textContent = "Lỗi: " + err.message;
        else alert("Lỗi khi lưu hoạt động: " + err.message);
    }
}

/* =========================================================
   RENDER
========================================================= */
function render() {
    const query = value("activitySearch").toLowerCase();
    const type = value("activityTypeFilter");
    const status = value("activityStatusFilter");
    const memberId = value("activityMemberFilter");
    const fromDate = value("activityFromDate");
    const toDate = value("activityToDate");

    const filtered = activities.filter(item => {
        const text = `${item.title} ${item.relation} ${item.description} ${item.owner}`.toLowerCase();
        const searchOk = !query || text.includes(query);
        const typeOk = !type || item.type.toLowerCase() === type.toLowerCase();
        const statusOk = !status || item.status === status;
        const memberOk = !memberId || String(item.ownerId) === String(memberId) || item.owner.toLowerCase().includes(memberId.toLowerCase());
        const dateOk = (!fromDate || (item.date && item.date >= fromDate)) &&
                       (!toDate || (item.date && item.date <= toDate));
        return searchOk && typeOk && statusOk && memberOk && dateOk;
    });

    const list = document.getElementById("activityList");
    if (!list) return;
    list.innerHTML = "";

    const empty = document.getElementById("activityEmpty");
    if (empty) empty.style.display = filtered.length ? "none" : "flex";

    filtered.forEach(item => {
        const article = document.createElement("article");
        article.className = "activity-row";
        article.innerHTML = `
            <div class="activity-icon ${item.type}">
                ${typeIcon(item.type)}
            </div>

            <div class="activity-main">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.description || "Không có ghi chú")}</p>
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; font-size: 11px;">
                    ${item.durationMinutes ? `<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: 600;">⏱️ ${item.durationMinutes}p</span>` : ''}
                    ${item.outcome ? `<span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 600;">🎯 ${escapeHtml(item.outcome)}</span>` : ''}
                    ${item.owner ? `<span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600;">👤 ${escapeHtml(item.owner)}</span>` : ''}
                    ${item.contactName ? `<span style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px;">📇 ${escapeHtml(item.contactName)}</span>` : ''}
                </div>
            </div>

            <div class="activity-relation">
                ${escapeHtml(item.relation || "Không liên kết")}
            </div>

            <div class="activity-date">
                ${formatSchedule(item)}
            </div>

            <div>
                <span class="activity-status ${statusClass(item)}">
                    ${statusLabel(item)}
                </span>

                <div class="activity-actions">
                    <button type="button" data-edit-activity="${item.id}">Sửa</button>
                    <button type="button" data-complete-activity="${item.id}">
                        ${item.status === "done" ? "Mở lại" : "Hoàn thành"}
                    </button>
                    <button type="button" style="color:#ef4444;" data-delete-activity="${item.id}">Xóa</button>
                </div>
            </div>
        `;
        list.appendChild(article);
    });

    updateSummary();
}

function updateSummary() {
    const now = todayString();
    const open = activities.filter(item => item.status === "open");
    const done = activities.filter(item => item.status === "done");
    const late = activities.filter(item => item.status === "open" && item.date && item.date < now);

    text("summaryTotal", activities.length);
    text("summaryPending", open.length);
    text("summaryDone", done.length);
    text("summaryLate", late.length);
    text("totalActivity", activities.length);
    text("openActivity", open.length);
    text("doneActivity", done.length);
    text("lateActivity", late.length);
}

/* =========================================================
   DRAWER
========================================================= */
function openDrawer(item = null) {
    const err = document.getElementById("activityError");
    if (err) err.textContent = "";

    if (item) {
        text("activityDrawerTitle", "Sửa hoạt động");
        setValue("editingActivityId", item.id);
        setValue("activityType", item.type);
        setValue("activityTitle", item.title);
        setValue("activityRelation", item.relation);
        setValue("activityDate", item.date);
        setValue("activityTime", item.time);
        setValue("activityOwner", item.owner);
        setValue("activityDuration", item.durationMinutes || 30);
        setValue("activityOutcome", item.outcome || "");
        setValue("activityDescription", item.description);
        const rem = document.getElementById("activityReminder");
        if (rem) rem.checked = !!item.reminder;
    } else {
        text("activityDrawerTitle", "Tạo hoạt động");
        activityForm?.reset();
        setValue("editingActivityId", "");
        setValue("activityType", "task");
        setValue("activityDate", todayString());
        setValue("activityTime", "09:00");
        setValue("activityDuration", "30");
        setValue("activityOutcome", "");
    }

    drawer?.classList.add("open");
    overlay?.classList.add("open");
}

function closeDrawer() {
    drawer?.classList.remove("open");
    overlay?.classList.remove("open");
}

/* =========================================================
   UI HELPERS
========================================================= */
function typeIcon(type) {
    switch (type) {
        case "call":
            return `<svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
        case "email":
            return `<svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
        case "meeting":
            return `<svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
        case "note":
            return `<svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
        default:
            return `<svg class="crm-inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
    }
}

function statusClass(item) {
    if (item.status === "done") return "done";
    if (item.date && item.date < todayString()) return "late";
    return "open";
}

function statusLabel(item) {
    if (item.status === "done") return "Hoàn thành";
    if (item.date && item.date < todayString()) return "Quá hạn";
    return "Đang chờ";
}

function formatSchedule(item) {
    return (item.date || "Chưa đặt ngày") + (item.time ? " · " + item.time : "");
}

function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function value(id) {
    return (document.getElementById(id)?.value || "").trim();
}

function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? "";
}

function text(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function escapeHtml(val) {
    return String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   STORY 3: VIEW TABS & DATE PRESETS
========================================================= */
function initViewTabs() {
    const tabList = document.getElementById("tabActivitiesList");
    const tabReport = document.getElementById("tabTeamReport");
    const viewList = document.getElementById("viewActivitiesList");
    const viewReport = document.getElementById("viewTeamReport");

    tabList?.addEventListener("click", () => {
        tabList.classList.add("active");
        tabReport?.classList.remove("active");
        if (viewList) viewList.style.display = "block";
        if (viewReport) viewReport.style.display = "none";
    });

    tabReport?.addEventListener("click", () => {
        tabReport.classList.add("active");
        tabList?.classList.remove("active");
        if (viewList) viewList.style.display = "none";
        if (viewReport) viewReport.style.display = "block";
        loadTeamStats();
    });
}

function initDatePresets() {
    const presets = document.querySelectorAll("#quickDatePresets .filter-chip-btn");
    const customWrap = document.getElementById("customDateRangeWrap");

    presets.forEach(btn => {
        btn.addEventListener("click", () => {
            presets.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const preset = btn.dataset.preset;
            const fromInput = document.getElementById("activityFromDate");
            const toInput = document.getElementById("activityToDate");
            const today = new Date();

            if (preset === "custom") {
                if (customWrap) customWrap.style.display = "inline-flex";
                if (fromInput) fromInput.focus();
                text("filterResultNotice", "Khoảng ngày tùy chọn");
                return;
            }

            if (customWrap) customWrap.style.display = "none";

            if (preset === "all") {
                if (fromInput) fromInput.value = "";
                if (toInput) toInput.value = "";
                text("filterResultNotice", "Đang hiển thị toàn bộ hoạt động");
            } else if (preset === "today") {
                const dStr = todayString();
                if (fromInput) fromInput.value = dStr;
                if (toInput) toInput.value = dStr;
                text("filterResultNotice", "Hoạt động trong ngày hôm nay");
            } else if (preset === "week") {
                const past = new Date(today.getTime() - 7 * 86400000);
                if (fromInput) fromInput.value = past.toISOString().split("T")[0];
                if (toInput) toInput.value = todayString();
                text("filterResultNotice", "Hoạt động trong 7 ngày qua");
            } else if (preset === "month") {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                if (fromInput) fromInput.value = firstDay.toISOString().split("T")[0];
                if (toInput) toInput.value = todayString();
                text("filterResultNotice", "Hoạt động trong tháng này");
            }

            render();
            loadTeamStats();
        });
    });

    document.getElementById("btnResetFilters")?.addEventListener("click", () => {
        setValue("activitySearch", "");
        setValue("activityTypeFilter", "");
        setValue("activityMemberFilter", "");
        setValue("activityFromDate", "");
        setValue("activityToDate", "");
        if (customWrap) customWrap.style.display = "none";
        presets.forEach(b => b.classList.remove("active"));
        document.querySelector("#quickDatePresets [data-preset='all']")?.classList.add("active");
        text("filterResultNotice", "Đang hiển thị toàn bộ hoạt động");
        render();
        loadTeamStats();
    });

    ["activitySearch", "activityTypeFilter", "activityMemberFilter", "activityFromDate", "activityToDate"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", () => {
            render();
            loadTeamStats();
        });
        document.getElementById(id)?.addEventListener("change", () => {
            render();
            loadTeamStats();
        });
    });
}

/* =========================================================
   STORY 3: TEAM STATS MONITORING
========================================================= */
let teamStatsData = [];

async function loadTeamStats() {
    const fromDate = value("activityFromDate");
    const toDate = value("activityToDate");
    const type = value("activityTypeFilter");
    const memberId = value("activityMemberFilter");

    const params = new URLSearchParams();
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    if (type) params.append("type", type);
    if (memberId) params.append("memberUserId", memberId);

    const tbody = document.getElementById("teamStatsTableBody");
    try {
        const data = await api(`/api/activities/team-stats?${params.toString()}`);
        if (!data || !Array.isArray(data.stats)) return;

        teamStatsData = data.stats;
        renderTeamStats(teamStatsData, data.totalActivities || 0);

        populateMemberDropdown(teamStatsData);
    } catch (err) {
        console.warn("Could not load team stats:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#ef4444; padding:20px;">Lỗi tải dữ liệu nhóm: ${escapeHtml(err.message)}</td></tr>`;
        }
    }
}

function renderTeamStats(stats, totalActivities) {
    const tbody = document.getElementById("teamStatsTableBody");
    if (!tbody) return;

    if (!stats.length) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding:30px;">Không có dữ liệu thành viên nào phù hợp bộ lọc.</td></tr>`;
        return;
    }

    text("kpiTotalActivities", totalActivities);
    text("badgeTeamMemberCount", `${stats.length} thành viên`);

    const topMember = [...stats].sort((a, b) => b.totalActivities - a.totalActivities)[0];
    if (topMember) {
        text("kpiTopMember", fixMojibake(topMember.userName));
        text("kpiTopMemberSub", `${topMember.totalActivities} hoạt động ghi nhận`);
    }

    const totalCallsMeetings = stats.reduce((acc, m) => acc + (m.callCount || 0) + (m.meetingCount || 0), 0);
    text("kpiCallsMeetings", totalCallsMeetings);

    const totalOverdue = stats.reduce((acc, m) => acc + (m.overdueTaskCount || 0), 0);
    text("kpiTeamOverdue", totalOverdue);

    tbody.innerHTML = "";
    stats.forEach(member => {
        const memberName = fixMojibake(member.userName || "Thành viên");
        const initial = (memberName.trim()[0] || "U").toUpperCase();
        const rating = member.activityRating || "Tích cực";
        let ratingClass = "good";
        if (rating === "Rất tích cực") ratingClass = "high";
        else if (rating === "Cần cải thiện") ratingClass = "low";
        else if (rating === "Trung bình") ratingClass = "moderate";

        const total = member.totalActivities || 0;
        const callPct = total > 0 ? ((member.callCount || 0) / total) * 100 : 0;
        const meetPct = total > 0 ? ((member.meetingCount || 0) / total) * 100 : 0;
        const mailPct = total > 0 ? ((member.emailCount || 0) / total) * 100 : 0;
        const taskPct = total > 0 ? ((member.taskCount || 0) / total) * 100 : 0;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="member-info-cell">
                    <div class="member-avatar">${escapeHtml(initial)}</div>
                    <div class="member-name-block">
                        <strong>${escapeHtml(memberName)}</strong>
                        <span>${escapeHtml(member.email || "")} · ${escapeHtml(fixMojibake(member.teamName || "Nhóm kinh doanh"))}</span>
                    </div>
                </div>
            </td>
            <td style="text-align: center;">
                <span class="count-chip total">${total}</span>
            </td>
            <td style="text-align: center;">
                <span class="count-chip call">${member.callCount || 0}</span>
            </td>
            <td style="text-align: center;">
                <span class="count-chip meeting">${member.meetingCount || 0}</span>
            </td>
            <td style="text-align: center;">
                <span class="count-chip email">${member.emailCount || 0}</span>
            </td>
            <td style="text-align: center;">
                <span class="count-chip task">${member.taskCount || 0}</span>
            </td>
            <td style="text-align: center;">
                <span class="count-chip overdue" style="${(member.overdueTaskCount || 0) > 0 ? 'background:#fee2e2; color:#b91c1c; font-weight:800;' : 'background:#f1f5f9; color:#94a3b8;'}">
                    ${member.overdueTaskCount || 0}
                </span>
            </td>
            <td>
                <div class="touchpoint-bar-container" title="Phân bổ: Cuộc gọi ${Math.round(callPct)}%, Họp ${Math.round(meetPct)}%, Email ${Math.round(mailPct)}%, Task ${Math.round(taskPct)}%">
                    <div class="touchpoint-slice call" style="width: ${callPct}%"></div>
                    <div class="touchpoint-slice meeting" style="width: ${meetPct}%"></div>
                    <div class="touchpoint-slice email" style="width: ${mailPct}%"></div>
                    <div class="touchpoint-slice task" style="width: ${taskPct}%"></div>
                </div>
            </td>
            <td>
                <span class="rating-badge ${ratingClass}">
                    ● ${escapeHtml(rating)}
                </span>
            </td>
            <td style="text-align: right;">
                <button type="button" class="crm-btn crm-btn-secondary filter-member-btn" data-user-id="${member.userId}" style="padding: 4px 10px; font-size: 11.5px;">
                    Lọc HĐ
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".filter-member-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const uid = btn.dataset.userId;
            setValue("activityMemberFilter", uid);
            document.getElementById("tabActivitiesList")?.click();
            render();
        });
    });
}

function populateMemberDropdown(stats) {
    const select = document.getElementById("activityMemberFilter");
    if (!select || select.options.length > 1) return;

    stats.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.userId;
        opt.textContent = `👤 ${fixMojibake(m.userName)} (${m.totalActivities} HĐ)`;
        select.appendChild(opt);
    });
}

/* =========================================================
   STORY 2: QUICK CALL (MOBILE-OPTIMIZED <= 3 TAPS)
========================================================= */
function initQuickCallFeature() {
    const fab = document.getElementById("fabQuickCall");
    const openBtn = document.getElementById("btnOpenQuickCall");
    const overlay = document.getElementById("quickCallOverlay");
    const modal = document.getElementById("quickCallModal");
    const closeBtn = document.getElementById("closeQuickCallModal");
    const customerSelect = document.getElementById("quickCallCustomerSelect");
    const linkedOppNotice = document.getElementById("quickCallLinkedOppNotice");
    const oppNameSpan = document.getElementById("quickCallOppName");
    const form = document.getElementById("quickCallForm");

    const openQuickCall = async () => {
        if (overlay) overlay.style.display = "block";
        if (modal) modal.style.display = "block";

        if (customerSelect && customerSelect.options.length <= 1) {
            try {
                const res = await api("/api/customers");
                if (Array.isArray(res)) {
                    res.forEach(c => {
                        const opt = document.createElement("option");
                        opt.value = c.id;
                        opt.textContent = `${fixMojibake(c.name || c.companyName)} (${c.phone || "Không có SĐT"})`;
                        customerSelect.appendChild(opt);
                    });
                }
            } catch (e) {
                console.warn("Could not load customers for quick call:", e);
            }
        }
    };

    const closeQuickCall = () => {
        if (overlay) overlay.style.display = "none";
        if (modal) modal.style.display = "none";
        if (linkedOppNotice) linkedOppNotice.style.display = "none";
    };

    fab?.addEventListener("click", openQuickCall);
    openBtn?.addEventListener("click", openQuickCall);
    closeBtn?.addEventListener("click", closeQuickCall);
    overlay?.addEventListener("click", closeQuickCall);

    customerSelect?.addEventListener("change", async () => {
        const custId = customerSelect.value;
        if (!custId) {
            if (linkedOppNotice) linkedOppNotice.style.display = "none";
            return;
        }
        try {
            const opps = await api(`/api/opportunities?customerId=${custId}`);
            if (Array.isArray(opps) && opps.length > 0) {
                const openOpp = opps.find(o => o.stage !== "CLOSED_WON" && o.stage !== "CLOSED_LOST") || opps[0];
                if (oppNameSpan) oppNameSpan.textContent = fixMojibake(openOpp.name || openOpp.title);
                if (linkedOppNotice) linkedOppNotice.style.display = "block";
            } else {
                if (linkedOppNotice) linkedOppNotice.style.display = "none";
            }
        } catch (_) {
            if (linkedOppNotice) linkedOppNotice.style.display = "none";
        }
    });

    document.querySelectorAll(".quick-call-touch-grid .touch-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".quick-call-touch-grid .touch-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            setValue("quickCallOutcome", btn.dataset.outcome);
        });
    });

    document.querySelectorAll(".quick-tag-chip[data-tag]").forEach(chip => {
        chip.addEventListener("click", () => {
            const notesInput = document.getElementById("quickCallNotes");
            if (notesInput) {
                const tag = chip.dataset.tag;
                if (!notesInput.value) notesInput.value = tag;
                else if (!notesInput.value.includes(tag)) notesInput.value += "; " + tag;
            }
        });
    });

    document.querySelectorAll(".callback-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".callback-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            setValue("quickCallCallback", chip.dataset.cb);
        });
    });

    form?.addEventListener("submit", async e => {
        e.preventDefault();
        const custId = customerSelect?.value;
        if (!custId) {
            alert("Vui lòng chọn khách hàng vừa liên hệ.");
            return;
        }
        const outcome = value("quickCallOutcome") || "Nghe máy - Quan tâm";
        const notes = value("quickCallNotes");
        const cbOption = value("quickCallCallback") || "none";

        let callbackAt = null;
        const now = new Date();
        if (cbOption === "2h") {
            const d = new Date(now.getTime() + 2 * 3600 * 1000);
            callbackAt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:00`;
        } else if (cbOption === "tomorrow") {
            const d = new Date(now.getTime() + 24 * 3600 * 1000);
            callbackAt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} 09:00:00`;
        } else if (cbOption === "next_monday") {
            const d = new Date(now.getTime() + ((1 + 7 - now.getDay()) % 7 || 7) * 24 * 3600 * 1000);
            callbackAt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} 09:00:00`;
        }

        const submitBtn = document.getElementById("btnSubmitQuickCall");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "⏳ Đang ghi nhận...";
        }

        try {
            const res = await api("/api/activities/quick-call", {
                method: "POST",
                body: JSON.stringify({
                    customerId: Number(custId),
                    outcome: outcome,
                    notes: notes,
                    callbackAt: callbackAt
                })
            });

            closeQuickCall();
            const oppLinkedMsg = res?.opportunityId ? ` (Đã tự động gắn vào cơ hội mở)` : ``;
            alert(`✅ Đã ghi nhanh cuộc gọi thành công!${oppLinkedMsg}`);

            await loadActivities();
            await loadTeamStats();
        } catch (err) {
            alert("Lỗi khi ghi cuộc gọi: " + err.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "⚡ LƯU NHANH CUỘC GỌI";
            }
        }
    });
}

// Start
initViewTabs();
initDatePresets();
initQuickCallFeature();
loadActivities();
loadTeamStats();