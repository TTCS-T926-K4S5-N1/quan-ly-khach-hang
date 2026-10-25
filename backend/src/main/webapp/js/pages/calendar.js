"use strict";

const API_BASE = (function () {
    if (window.location.port === "8080" || window.location.pathname.startsWith("/crm")) {
        return "/crm";
    }
    return "http://localhost:8080/crm";
})();

let currentDate = new Date();
let currentView = "month"; // "month", "week", "day"
let calendarActivities = [];
let assignableUsers = [];
let currentUser = null;

const modal = document.getElementById("calendarModal");
const overlay = document.getElementById("calendarOverlay");

/* =========================================================
   API CLIENT HELPER
========================================================= */
async function api(path, options = {}) {
    const config = {
        credentials: "include",
        headers: {
            "Accept": "application/json",
            ...(options.body && typeof options.body === "string" ? { "Content-Type": "application/json; charset=UTF-8" } : {}),
            ...(options.headers || {})
        },
        ...options
    };

    const res = await fetch(API_BASE + path, config);
    let json = null;
    try { json = await res.json(); } catch (_) {}

    if (res.status === 401) {
        window.location.href = "login";
        throw new Error("Phiên đăng nhập đã hết hạn.");
    }
    if (!res.ok || (json && json.success === false)) {
        throw new Error(json?.message || `Lỗi HTTP ${res.status}`);
    }
    return json ? json.data : null;
}

/* =========================================================
   INITIALIZATION
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
    setupEventListeners();
    await loadInitialMetadata();
    await fetchCalendarEvents();
});

function setupEventListeners() {
    document.getElementById("previousPeriod")?.addEventListener("click", () => navigatePeriod(-1));
    document.getElementById("nextPeriod")?.addEventListener("click", () => navigatePeriod(1));
    document.getElementById("todayButton")?.addEventListener("click", () => {
        currentDate = new Date();
        fetchCalendarEvents();
    });

    document.getElementById("calendarMemberFilter")?.addEventListener("change", fetchCalendarEvents);
    document.getElementById("calendarTypeFilter")?.addEventListener("change", renderCalendar);

    document.getElementById("closeCalendarModal")?.addEventListener("click", closeModal);
    overlay?.addEventListener("click", closeModal);
}

async function loadInitialMetadata() {
    try {
        const profile = await api("/api/profile");
        if (profile) {
            currentUser = profile;
            const badge = document.getElementById("currentUserBadge");
            if (badge) badge.textContent = profile.fullName || profile.email;
            const avatar = document.getElementById("userAvatar");
            if (avatar) avatar.textContent = (profile.fullName || "U").charAt(0).toUpperCase();
        }
    } catch (_) {}

    try {
        const users = await api("/api/activities/assignable-users");
        if (Array.isArray(users)) {
            assignableUsers = users;
            populateMemberFilter();
        }
    } catch (_) {}
}

function populateMemberFilter() {
    const filterSelect = document.getElementById("calendarMemberFilter");
    if (!filterSelect) return;

    filterSelect.innerHTML = `
        <option value="team" selected>👥 Toàn nhóm kinh doanh (Lịch chồng)</option>
        <option value="self">👤 Lịch của tôi (${escapeHtml(currentUser?.fullName || "Tôi")})</option>
        ${assignableUsers.map(u => `
            <option value="${u.id}">👤 ${escapeHtml(u.fullName || u.email)} (${escapeHtml(u.teamName || "Thành viên")})</option>
        `).join("")}
    `;
}

function switchCalendarView(viewMode) {
    currentView = viewMode;

    ["btnViewMonth", "btnViewWeek", "btnViewDay"].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.remove("active");
    });
    const activeBtn = document.getElementById("btnView" + viewMode.charAt(0).toUpperCase() + viewMode.slice(1));
    if (activeBtn) activeBtn.classList.add("active");

    const monthWrap = document.getElementById("monthViewWrapper");
    const weekWrap = document.getElementById("weekViewWrapper");
    const dayWrap = document.getElementById("dayViewWrapper");

    if (monthWrap) monthWrap.style.display = viewMode === "month" ? "block" : "none";
    if (weekWrap) weekWrap.style.display = viewMode === "week" ? "block" : "none";
    if (dayWrap) dayWrap.style.display = viewMode === "day" ? "block" : "none";

    updateTitle();
    renderCalendar();
}

function navigatePeriod(step) {
    if (currentView === "month") {
        currentDate.setMonth(currentDate.getMonth() + step);
    } else if (currentView === "week") {
        currentDate.setDate(currentDate.getDate() + (step * 7));
    } else if (currentView === "day") {
        currentDate.setDate(currentDate.getDate() + step);
    }
    fetchCalendarEvents();
}

function updateTitle() {
    const titleEl = document.getElementById("calendarTitle");
    if (!titleEl) return;

    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;

    if (currentView === "month") {
        titleEl.textContent = `Tháng ${m}, ${y}`;
    } else if (currentView === "week") {
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        titleEl.textContent = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}/${y}`;
    } else if (currentView === "day") {
        titleEl.textContent = currentDate.toLocaleDateString("vi-VN", {
            weekday: "long", day: "2-digit", month: "2-digit", year: "numeric"
        });
    }
}

/* =========================================================
   DATA FETCHING
========================================================= */
async function fetchCalendarEvents() {
    updateTitle();

    const memberFilter = document.getElementById("calendarMemberFilter")?.value || "team";
    let queryParams = [];

    if (memberFilter === "team") {
        queryParams.push("includeTeam=true");
    } else if (memberFilter === "self") {
        if (currentUser) queryParams.push(`ownerUserId=${currentUser.id}`);
    } else if (memberFilter) {
        queryParams.push(`ownerUserId=${memberFilter}`);
    }

    try {
        const url = `/api/activities` + (queryParams.length > 0 ? `?${queryParams.join("&")}` : "");
        const res = await api(url);
        calendarActivities = Array.isArray(res) ? res : [];
        detectTeamOverlaps();
        renderCalendar();
    } catch (err) {
        console.error("Could not fetch calendar events:", err);
    }
}

function detectTeamOverlaps() {
    const alertBox = document.getElementById("teamOverlapAlert");
    const alertText = document.getElementById("teamOverlapText");
    if (!alertBox || !alertText) return;

    // Check meetings for the same day with different members
    const meetingsByDate = {};
    let overlapCount = 0;

    calendarActivities.forEach(act => {
        if ((act.type || "").toUpperCase() === "MEETING" && act.dueDate) {
            const dateKey = new Date(act.dueDate).toISOString().slice(0, 10);
            if (!meetingsByDate[dateKey]) meetingsByDate[dateKey] = [];
            meetingsByDate[dateKey].push(act);
        }
    });

    Object.keys(meetingsByDate).forEach(d => {
        const list = meetingsByDate[d];
        if (list.length >= 2) {
            // Check if there are overlapping hours
            for (let i = 0; i < list.length; i++) {
                for (let j = i + 1; j < list.length; j++) {
                    const timeA = new Date(list[i].dueDate).getTime();
                    const durA = (list[i].durationMinutes || 60) * 60000;
                    const timeB = new Date(list[j].dueDate).getTime();
                    const durB = (list[j].durationMinutes || 60) * 60000;

                    if ((timeA < timeB + durB) && (timeB < timeA + durA)) {
                        overlapCount++;
                    }
                }
            }
        }
    });

    if (overlapCount > 0) {
        alertBox.style.display = "flex";
        alertText.textContent = `⚠️ Cảnh báo xung đột lịch: Phát hiện ${overlapCount} cặp cuộc gặp của các thành viên trong nhóm diễn ra cùng thời điểm.`;
    } else {
        alertBox.style.display = "none";
    }
}

/* =========================================================
   RENDERING ROUTER
========================================================= */
function renderCalendar() {
    const typeFilter = (document.getElementById("calendarTypeFilter")?.value || "").toLowerCase();

    const filtered = calendarActivities.filter(item => {
        const t = (item.type || "").toLowerCase();
        if (!typeFilter) return true;
        if (typeFilter === "meeting") return t === "meeting";
        if (typeFilter === "task") return t === "task";
        if (typeFilter === "call") return t === "call";
        if (typeFilter === "email") return t === "email" || t === "note";
        return t === typeFilter;
    });

    if (currentView === "month") {
        renderMonthView(filtered);
    } else if (currentView === "week") {
        renderWeekView(filtered);
    } else if (currentView === "day") {
        renderDayView(filtered);
    }
}

/* =========================================================
   1. MONTH VIEW
========================================================= */
function renderMonthView(items) {
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    let startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    if (startDayOfWeek === 0) startDayOfWeek = 7; // Convert to Monday=1 ... Sunday=7

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = toDateKey(new Date());

    // Group items by YYYY-MM-DD
    const eventsByDate = {};
    items.forEach(item => {
        if (!item.dueDate) return;
        const key = toDateKey(new Date(item.dueDate));
        if (!eventsByDate[key]) eventsByDate[key] = [];
        eventsByDate[key].push(item);
    });

    // 1. Cells for previous month
    for (let i = startDayOfWeek - 1; i > 0; i--) {
        const dayNum = daysInPrevMonth - i + 1;
        const cell = document.createElement("div");
        cell.className = "calendar-day other-month";
        cell.innerHTML = `
            <div class="day-cell-header">
                <span class="day-number-badge">${dayNum}</span>
            </div>
        `;
        grid.appendChild(cell);
    }

    // 2. Cells for current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dObj = new Date(year, month, day);
        const dKey = toDateKey(dObj);
        const isToday = (dKey === todayStr);

        const cell = document.createElement("div");
        cell.className = "calendar-day" + (isToday ? " is-today" : "");

        let dayHeaderHtml = `
            <div class="day-cell-header">
                <span class="day-number-badge" title="Xem chi tiết ngày ${day}/${month + 1}" onclick="goToDayView('${dKey}')" style="cursor: pointer;">${day}</span>
                ${isToday ? '<span class="today-indicator-tag">Hôm nay</span>' : ''}
            </div>
        `;

        const dayEvents = eventsByDate[dKey] || [];
        let eventsHtml = '<div class="day-events-wrap">';

        dayEvents.slice(0, 3).forEach(ev => {
            const evType = (ev.type || "").toUpperCase();
            const isDone = (ev.status || "").toUpperCase() === "COMPLETED";
            let badgeClass = "is-meeting";
            let icon = "🤝";

            if (evType === "TASK") {
                badgeClass = isDone ? "is-task-done" : "is-task";
                icon = "📋";
            } else if (evType === "CALL") {
                badgeClass = "is-call";
                icon = "📞";
            } else if (evType === "EMAIL") {
                badgeClass = "is-email";
                icon = "✉️";
            }

            const timeStr = ev.dueDate ? new Date(ev.dueDate).toTimeString().slice(0, 5) : "";
            eventsHtml += `
                <div class="cal-event-badge ${badgeClass}" title="${escapeHtml(ev.subject || ev.title)} - ${escapeHtml(ev.ownerName || '')}" onclick="openEventDetail(${ev.id})">
                    <span class="cal-badge-icon">${icon}</span>
                    ${timeStr ? `<span class="cal-badge-time">${timeStr}</span>` : ''}
                    <span class="cal-badge-title">${escapeHtml(ev.subject || ev.title)}</span>
                </div>
            `;
        });

        if (dayEvents.length > 3) {
            eventsHtml += `
                <div class="cal-more-badge" onclick="goToDayView('${dKey}')" title="Xem tất cả ${dayEvents.length} lịch trong ngày">
                    +${dayEvents.length - 3} khác ▾
                </div>
            `;
        }

        eventsHtml += '</div>';

        cell.innerHTML = dayHeaderHtml + eventsHtml;
        grid.appendChild(cell);
    }

    // 3. Cells for next month (fill trailing row)
    const totalCells = (startDayOfWeek - 1) + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day other-month";
        cell.innerHTML = `
            <div class="day-cell-header">
                <span class="day-number-badge">${nextDay}</span>
            </div>
        `;
        grid.appendChild(cell);
    }
}

/* =========================================================
   2. WEEK VIEW
========================================================= */
function renderWeekView(items) {
    const container = document.getElementById("weekGridContainer");
    if (!container) return;
    container.innerHTML = "";

    const startOfWeek = getStartOfWeek(currentDate);
    const todayStr = toDateKey(new Date());

    const eventsByDate = {};
    items.forEach(item => {
        if (!item.dueDate) return;
        const key = toDateKey(new Date(item.dueDate));
        if (!eventsByDate[key]) eventsByDate[key] = [];
        eventsByDate[key].push(item);
    });

    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

    for (let i = 0; i < 7; i++) {
        const dObj = new Date(startOfWeek);
        dObj.setDate(dObj.getDate() + i);
        const dKey = toDateKey(dObj);
        const isToday = (dKey === todayStr);

        const col = document.createElement("div");
        col.className = "week-day-col" + (isToday ? " is-today" : "");

        col.innerHTML = `
            <div class="week-day-header ${isToday ? 'is-today' : ''}">
                <div class="week-day-name">${dayNames[i]}</div>
                <div class="week-day-date">${dObj.getDate()}/${dObj.getMonth() + 1}</div>
            </div>
            <div class="week-day-body" id="week-body-${dKey}"></div>
        `;

        container.appendChild(col);

        const bodyEl = col.querySelector(`#week-body-${dKey}`);
        const dayEvents = eventsByDate[dKey] || [];

        if (dayEvents.length === 0) {
            bodyEl.innerHTML = `<div class="week-empty-state">Không có lịch</div>`;
        } else {
            dayEvents.forEach(ev => {
                const evType = (ev.type || "").toUpperCase();
                const isDone = (ev.status || "").toUpperCase() === "COMPLETED";
                let badgeClass = "is-meeting";
                let icon = "🤝";
                let typeName = "Cuộc gặp";

                if (evType === "TASK") {
                    badgeClass = isDone ? "is-task-done" : "is-task";
                    icon = "📋";
                    typeName = "Công việc";
                } else if (evType === "CALL") {
                    badgeClass = "is-call";
                    icon = "📞";
                    typeName = "Cuộc gọi";
                } else if (evType === "EMAIL") {
                    badgeClass = "is-email";
                    icon = "✉️";
                    typeName = "Email";
                }

                const timeStr = ev.dueDate ? new Date(ev.dueDate).toTimeString().slice(0, 5) : "";
                const durStr = ev.durationMinutes ? `${ev.durationMinutes}p` : "";

                const evCard = document.createElement("div");
                evCard.className = `cal-event-badge ${badgeClass} week-event-card`;
                evCard.innerHTML = `
                    <div class="week-card-top">
                        <span class="week-card-time">${icon} ${timeStr} ${durStr ? `(${durStr})` : ''}</span>
                        <span class="week-card-type">${typeName}</span>
                    </div>
                    <div class="week-card-title">${escapeHtml(ev.subject || ev.title)}</div>
                    ${ev.customerName ? `<div class="week-card-customer">🏢 ${escapeHtml(ev.customerName)}</div>` : ''}
                    <div class="week-card-owner">👤 ${escapeHtml(ev.ownerName || 'Tôi')}</div>
                `;
                evCard.onclick = () => openEventDetail(ev.id);
                bodyEl.appendChild(evCard);
            });
        }
    }
}

/* =========================================================
   3. DAY VIEW
========================================================= */
function renderDayView(items) {
    const meetingsList = document.getElementById("dayMeetingsList");
    const tasksList = document.getElementById("dayTasksList");
    const countM = document.getElementById("dayMeetingsCount");
    const countT = document.getElementById("dayTasksCount");

    if (!meetingsList || !tasksList) return;

    const dayKey = toDateKey(currentDate);

    const dayItems = items.filter(ev => {
        if (!ev.dueDate) return false;
        return toDateKey(new Date(ev.dueDate)) === dayKey;
    });

    const meetings = dayItems.filter(ev => (ev.type || "").toUpperCase() === "MEETING");
    const dayTasks = dayItems.filter(ev => (ev.type || "").toUpperCase() === "TASK");
    const otherActs = dayItems.filter(ev => (ev.type || "").toUpperCase() !== "MEETING" && (ev.type || "").toUpperCase() !== "TASK");

    if (countM) countM.textContent = meetings.length;
    if (countT) countT.textContent = dayTasks.length;

    // Render Meetings
    if (meetings.length === 0) {
        meetingsList.innerHTML = `<div style="font-size: 12.5px; color: var(--crm-muted); font-style: italic; padding: 12px 0;">Không có cuộc gặp nào được đặt trong ngày này.</div>`;
    } else {
        meetingsList.innerHTML = meetings.map(m => {
            const timeStr = m.dueDate ? new Date(m.dueDate).toTimeString().slice(0, 5) : "";
            return `
                <div class="day-card-item" style="border-left: 4px solid #0284c7; cursor: pointer;" onclick="openEventDetail(${m.id})">
                    <div>
                        <div style="font-size: 14.5px; font-weight: 600; color: #0369a1; margin-bottom: 4px;">
                            🤝 ${timeStr} - ${escapeHtml(m.subject || m.title)}
                        </div>
                        <div style="font-size: 12px; color: var(--crm-muted); display: flex; gap: 14px;">
                            <span>🏢 Khách hàng: <strong>${escapeHtml(m.customerName || '—')}</strong></span>
                            <span>👤 Người thực hiện: <strong>${escapeHtml(m.ownerName || 'Tôi')}</strong></span>
                            ${m.durationMinutes ? `<span>⏱️ Thời lượng: ${m.durationMinutes} phút</span>` : ''}
                        </div>
                        ${m.description ? `<div style="font-size: 12px; color: #475569; margin-top: 4px;">${escapeHtml(m.description)}</div>` : ''}
                    </div>
                    <span style="font-size: 12px; background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 12px; font-weight: 600;">Cuộc gặp</span>
                </div>
            `;
        }).join("");
    }

    // Render Tasks
    if (dayTasks.length === 0) {
        tasksList.innerHTML = `<div style="font-size: 12.5px; color: var(--crm-muted); font-style: italic; padding: 12px 0;">Không có công việc nào có hạn trong ngày này.</div>`;
    } else {
        tasksList.innerHTML = dayTasks.map(t => {
            const isDone = (t.status || "").toUpperCase() === "COMPLETED";
            const priority = (t.priority || "MEDIUM").toUpperCase();
            return `
                <div class="day-card-item" style="border-left: 4px solid #f59e0b; cursor: pointer; ${isDone ? 'opacity: 0.7; background: #f8fafc;' : ''}" onclick="openEventDetail(${t.id})">
                    <div>
                        <div style="font-size: 14px; font-weight: 600; color: ${isDone ? '#64748b' : '#92400e'}; ${isDone ? 'text-decoration: line-through;' : ''} margin-bottom: 4px;">
                            📋 ${escapeHtml(t.subject || t.title)}
                        </div>
                        <div style="font-size: 12px; color: var(--crm-muted); display: flex; gap: 14px;">
                            <span>🏢 Khách hàng: <strong>${escapeHtml(t.customerName || '—')}</strong></span>
                            <span>👤 Thực hiện: <strong>${escapeHtml(t.ownerName || 'Tôi')}</strong></span>
                            <span>Mức ưu tiên: <strong>${priority}</strong></span>
                        </div>
                        ${t.postponeReason ? `<div style="font-size: 11.5px; color: #b45309; margin-top: 4px;">⏱️ Đã hoãn: ${escapeHtml(t.postponeReason)}</div>` : ''}
                    </div>
                    <span style="font-size: 12px; background: ${isDone ? '#dcfce7; color:#16a34a;' : '#fef3c7; color:#b45309;'} padding: 4px 10px; border-radius: 12px; font-weight: 600;">
                        ${isDone ? 'Đã xong' : 'Công việc'}
                    </span>
                </div>
            `;
        }).join("");
    }

    // Render Other Activities if present
    const othersSection = document.getElementById("dayOthersSection");
    const othersList = document.getElementById("dayOthersList");
    const countO = document.getElementById("dayOthersCount");
    if (othersSection && othersList) {
        if (otherActs.length > 0) {
            othersSection.style.display = "block";
            if (countO) countO.textContent = otherActs.length;
            othersList.innerHTML = otherActs.map(a => {
                const timeStr = a.dueDate ? new Date(a.dueDate).toTimeString().slice(0, 5) : "";
                const isCall = (a.type || "").toUpperCase() === "CALL";
                return `
                    <div class="day-card-item" style="border-left: 4px solid ${isCall ? '#10b981' : '#0284c7'}; cursor: pointer;" onclick="openEventDetail(${a.id})">
                        <div>
                            <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">
                                ${isCall ? '📞' : '✉️'} ${timeStr ? timeStr + ' - ' : ''}${escapeHtml(a.subject || a.title)}
                            </div>
                            <div style="font-size: 12px; color: var(--crm-muted); display: flex; gap: 14px;">
                                <span>🏢 Khách hàng: <strong>${escapeHtml(a.customerName || '—')}</strong></span>
                                <span>👤 Người thực hiện: <strong>${escapeHtml(a.ownerName || 'Tôi')}</strong></span>
                            </div>
                        </div>
                        <span style="font-size: 12px; background: ${isCall ? '#d1fae5; color: #065f46;' : '#e0f2fe; color: #0284c7;'} padding: 4px 10px; border-radius: 12px; font-weight: 600;">
                            ${isCall ? 'Cuộc gọi' : 'Hoạt động'}
                        </span>
                    </div>
                `;
            }).join("");
        } else {
            othersSection.style.display = "none";
        }
    }
}

/* =========================================================
   DETAIL MODAL
========================================================= */
function openEventDetail(eventId) {
    const ev = calendarActivities.find(a => a.id === eventId);
    if (!ev) return;

    const titleEl = document.getElementById("calendarModalTitle");
    const bodyEl = document.getElementById("calendarModalBody");
    if (!titleEl || !bodyEl) return;

    const typeStr = (ev.type || "ACTIVITY").toUpperCase();
    titleEl.textContent = `Chi tiết ${typeStr === 'MEETING' ? 'Cuộc gặp' : (typeStr === 'TASK' ? 'Công việc' : 'Hoạt động')}`;

    const dateStr = ev.dueDate ? new Date(ev.dueDate).toLocaleString("vi-VN", {
        weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    }) : "—";

    bodyEl.innerHTML = `
        <div style="margin-bottom: 10px;">
            <div style="font-size: 11px; color: var(--crm-muted); text-transform: uppercase; font-weight: 700;">Tiêu đề</div>
            <div style="font-size: 15px; font-weight: 700; color: var(--crm-text); margin-top: 2px;">${escapeHtml(ev.subject || ev.title)}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; background: #f8fafc; padding: 10px; border-radius: 6px;">
            <div>
                <span style="color: var(--crm-muted);">Thời gian:</span>
                <strong>${dateStr}</strong>
            </div>
            <div>
                <span style="color: var(--crm-muted);">Trạng thái:</span>
                <strong>${escapeHtml(ev.status || 'OPEN')}</strong>
            </div>
            <div>
                <span style="color: var(--crm-muted);">Người phụ trách:</span>
                <strong>${escapeHtml(ev.ownerName || 'Tôi')}</strong>
            </div>
            <div>
                <span style="color: var(--crm-muted);">Mức ưu tiên:</span>
                <strong>${escapeHtml(ev.priority || 'MEDIUM')}</strong>
            </div>
        </div>

        ${ev.customerName ? `
            <div style="margin-bottom: 8px;">
                <span style="color: var(--crm-muted);">Khách hàng liên quan:</span>
                <a href="customer-360?id=${ev.customerId}" style="color: var(--crm-primary); font-weight: 600; text-decoration: none;">${escapeHtml(ev.customerName)}</a>
            </div>
        ` : ''}

        ${ev.opportunityName ? `
            <div style="margin-bottom: 8px;">
                <span style="color: var(--crm-muted);">Cơ hội bán hàng:</span>
                <a href="pipeline" style="color: var(--crm-primary); font-weight: 600; text-decoration: none;">${escapeHtml(ev.opportunityName)}</a>
            </div>
        ` : ''}

        ${ev.description ? `
            <div style="margin-top: 10px;">
                <div style="font-size: 12px; color: var(--crm-muted); font-weight: 600;">Mô tả nội dung:</div>
                <div style="background: #ffffff; border: 1px solid var(--crm-border); padding: 8px; border-radius: 6px; margin-top: 4px; font-size: 12.5px;">${escapeHtml(ev.description)}</div>
            </div>
        ` : ''}

        ${ev.outcome ? `
            <div style="margin-top: 8px;">
                <span style="color: var(--crm-muted); font-weight: 600;">Kết quả trao đổi:</span>
                <span style="color: #16a34a; font-weight: 600;">${escapeHtml(ev.outcome)}</span>
            </div>
        ` : ''}

        ${ev.postponeReason ? `
            <div style="margin-top: 8px; background: #fffbeb; border: 1px dashed #fcd34d; padding: 8px; border-radius: 6px; color: #92400e;">
                <strong>⏱️ Lý do hoãn:</strong> ${escapeHtml(ev.postponeReason)}
            </div>
        ` : ''}
    `;

    modal.classList.add("open");
    overlay.classList.add("open");
}

function closeModal() {
    modal.classList.remove("open");
    overlay.classList.remove("open");
}

/* =========================================================
   DATE UTILITIES
========================================================= */
function toDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function goToDayView(dateStr) {
    if (dateStr) {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
            currentDate = new Date(dateStr);
        }
    }
    switchCalendarView("day");
}

/* Expose global handlers for inline markup */
window.switchCalendarView = switchCalendarView;
window.goToDayView = goToDayView;
window.openEventDetail = openEventDetail;
window.closeModal = closeModal;
