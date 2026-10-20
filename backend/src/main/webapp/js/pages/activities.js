"use strict";

const API_BASE = (function () {
    if (window.location.pathname.startsWith("/crm")) return "/crm";
    if (window.location.port === "8080") return "";
    return "http://localhost:8080/crm";
})();

let activities = [];
let accessibleMembers = [];
let memberSummaries = [];

const filterState = {
    keyword: "",
    type: "",
    ownerId: "",
    status: "",
    preset: "all",
    startDate: "",
    endDate: ""
};

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
   INITIALIZATION & DATA LOADING (SCRUM-109)
========================================================= */
async function init() {
    setupEventListeners();
    await loadAccessibleMembers();
    await loadActivitiesAndSummary();
}

async function loadAccessibleMembers() {
    try {
        const data = await api("/api/activities/members");
        if (Array.isArray(data)) {
            accessibleMembers = data;
            populateMemberDropdowns();
            return;
        }
    } catch (err) {
        console.warn("Could not load members from /api/activities/members:", err);
    }

    // Fallback: extract distinct owners from cached activities if any
    try {
        const cached = JSON.parse(localStorage.getItem("crm_ui_activities")) || [];
        const map = new Map();
        cached.forEach(a => {
            if (a.ownerUserId && a.owner) {
                map.set(a.ownerUserId, { id: a.ownerUserId, fullName: a.owner });
            }
        });
        accessibleMembers = Array.from(map.values());
        populateMemberDropdowns();
    } catch (_) {
        accessibleMembers = [];
    }
}

function populateMemberDropdowns() {
    const filterSelect = document.getElementById("activityMemberFilter");
    if (filterSelect) {
        const currentVal = filterSelect.value;
        filterSelect.innerHTML = `<option value="">Tất cả thành viên (${accessibleMembers.length})</option>`;
        accessibleMembers.forEach(m => {
            const opt = document.createElement("option");
            opt.value = String(m.id);
            const teamInfo = m.teamName ? ` · ${m.teamName}` : "";
            opt.textContent = `👤 ${m.fullName || m.email}${teamInfo}`;
            filterSelect.appendChild(opt);
        });
        filterSelect.value = currentVal;
    }

    const drawerSelect = document.getElementById("activityOwnerSelect");
    if (drawerSelect) {
        const currentVal = drawerSelect.value;
        drawerSelect.innerHTML = `<option value="">-- Chọn người phụ trách --</option>`;
        accessibleMembers.forEach(m => {
            const opt = document.createElement("option");
            opt.value = String(m.id);
            const teamInfo = m.teamName ? ` (${m.teamName})` : "";
            opt.textContent = `${m.fullName || m.email}${teamInfo}`;
            drawerSelect.appendChild(opt);
        });
        drawerSelect.value = currentVal;
    }
}

function buildFilterQueryParams() {
    const params = new URLSearchParams();
    if (filterState.keyword) params.append("keyword", filterState.keyword);
    if (filterState.type) params.append("type", filterState.type);
    if (filterState.ownerId) params.append("ownerId", filterState.ownerId);
    if (filterState.status) params.append("status", filterState.status);
    if (filterState.startDate) params.append("startDate", filterState.startDate);
    if (filterState.endDate) params.append("endDate", filterState.endDate);
    return params;
}

async function loadActivitiesAndSummary() {
    const params = buildFilterQueryParams();
    const queryString = params.toString() ? `?${params.toString()}` : "";

    try {
        const [actsData, summaryData] = await Promise.all([
            api(`/api/activities${queryString}`),
            api(`/api/activities/summary-by-member${queryString}`)
        ]);

        if (Array.isArray(actsData)) {
            activities = actsData.map(item => normalizeActivityFromBackend(item));
            saveActivitiesCache();
        }

        if (Array.isArray(summaryData)) {
            memberSummaries = summaryData;
        }

        renderMemberCareSection();
        renderActivityList();
        renderActiveFilterChips();
        updateSummaryCards();
        return;
    } catch (err) {
        console.warn("Backend error fetching filtered activities, falling back to client cache:", err);
    }

    // Local fallback
    try {
        const cached = JSON.parse(localStorage.getItem("crm_ui_activities"));
        activities = Array.isArray(cached) ? cached : [];
    } catch {
        activities = [];
    }
    renderMemberCareSection();
    renderActivityList();
    renderActiveFilterChips();
    updateSummaryCards();
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
        title: item.subject || item.title || "Hoạt động",
        relation: rel,
        date: dateStr,
        time: timeStr,
        owner: item.ownerName || "Tôi",
        ownerUserId: item.ownerUserId,
        description: item.description || "",
        reminder: !!item.reminder,
        status: st,
        customerId: item.customerId,
        opportunityId: item.opportunityId,
        createdAt: item.createdAt || new Date().toISOString()
    };
}

function saveActivitiesCache() {
    try {
        localStorage.setItem("crm_ui_activities", JSON.stringify(activities));
    } catch (_) {}
}

/* =========================================================
   EVENT LISTENERS (SCRUM-109)
========================================================= */
function setupEventListeners() {
    document.getElementById("createActivity")?.addEventListener("click", () => openDrawer());
    document.getElementById("closeActivityDrawer")?.addEventListener("click", closeDrawer);
    document.getElementById("cancelActivity")?.addEventListener("click", closeDrawer);
    overlay?.addEventListener("click", closeDrawer);

    let searchTimeout = null;
    document.getElementById("activitySearch")?.addEventListener("input", e => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterState.keyword = e.target.value.trim();
            loadActivitiesAndSummary();
        }, 250);
    });

    document.getElementById("activityTypeFilter")?.addEventListener("change", e => {
        filterState.type = e.target.value;
        loadActivitiesAndSummary();
    });

    document.getElementById("activityMemberFilter")?.addEventListener("change", e => {
        filterState.ownerId = e.target.value;
        loadActivitiesAndSummary();
    });

    document.getElementById("activityStatusFilter")?.addEventListener("change", e => {
        filterState.status = e.target.value;
        loadActivitiesAndSummary();
    });

    // Date Presets
    document.querySelectorAll(".date-preset-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const preset = btn.dataset.preset;
            applyDatePreset(preset);
        });
    });

    // Custom date inputs
    document.getElementById("applyDateBtn")?.addEventListener("click", () => {
        const start = value("activityStartDate");
        const end = value("activityEndDate");
        if (start && end && start > end) {
            alert("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
            return;
        }
        filterState.startDate = start;
        filterState.endDate = end;
        filterState.preset = "custom";
        updatePresetButtonActiveState("custom");
        loadActivitiesAndSummary();
    });

    document.getElementById("resetActivityFilter")?.addEventListener("click", resetAllFilters);

    // Toggle Member Care Section
    const toggleBtn = document.getElementById("toggleMemberCareView");
    const memberGrid = document.getElementById("memberCareGrid");
    if (toggleBtn && memberGrid) {
        toggleBtn.addEventListener("click", () => {
            const isCollapsed = memberGrid.classList.toggle("collapsed");
            toggleBtn.textContent = isCollapsed ? "Mở rộng" : "Thu gọn";
        });
    }

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
                                type: item.type.toUpperCase(),
                                description: item.description,
                                status: newStatus,
                                dueDate: item.date ? `${item.date} ${item.time || "09:00"}:00` : null
                            })
                        });
                    }
                    item.status = newStatus === "COMPLETED" ? "done" : "open";
                    saveActivitiesCache();
                    await loadActivitiesAndSummary();
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
                    await loadActivitiesAndSummary();
                } catch (err) {
                    alert("Lỗi khi xóa hoạt động: " + err.message);
                }
            }
            return;
        }

        // Quick filter by member card click
        const memberCard = event.target.closest("[data-member-id]");
        if (memberCard && !event.target.closest("button.prevent-card-click")) {
            const memberId = memberCard.dataset.memberId;
            if (filterState.ownerId === memberId) {
                // Deselect if already selected
                filterState.ownerId = "";
            } else {
                filterState.ownerId = memberId;
            }
            setValue("activityMemberFilter", filterState.ownerId);
            loadActivitiesAndSummary();
            return;
        }
    });
}

/* =========================================================
   DATE PRESETS & FILTER RESET (SCRUM-109)
========================================================= */
function applyDatePreset(preset) {
    filterState.preset = preset;
    updatePresetButtonActiveState(preset);

    const now = new Date();
    let start = "";
    let end = "";

    switch (preset) {
        case "today": {
            const t = todayString();
            start = t;
            end = t;
            break;
        }
        case "7days": {
            const prev = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            start = formatDate(prev);
            end = todayString();
            break;
        }
        case "this_month": {
            const first = new Date(now.getFullYear(), now.getMonth(), 1);
            const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            start = formatDate(first);
            end = formatDate(last);
            break;
        }
        case "this_quarter": {
            const qMonth = Math.floor(now.getMonth() / 3) * 3;
            const first = new Date(now.getFullYear(), qMonth, 1);
            const last = new Date(now.getFullYear(), qMonth + 3, 0);
            start = formatDate(first);
            end = formatDate(last);
            break;
        }
        case "all":
        default:
            start = "";
            end = "";
            break;
    }

    filterState.startDate = start;
    filterState.endDate = end;
    setValue("activityStartDate", start);
    setValue("activityEndDate", end);

    loadActivitiesAndSummary();
}

function updatePresetButtonActiveState(preset) {
    document.querySelectorAll(".date-preset-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.preset === preset);
    });
}

function resetAllFilters() {
    filterState.keyword = "";
    filterState.type = "";
    filterState.ownerId = "";
    filterState.status = "";
    filterState.preset = "all";
    filterState.startDate = "";
    filterState.endDate = "";

    setValue("activitySearch", "");
    setValue("activityTypeFilter", "");
    setValue("activityMemberFilter", "");
    setValue("activityStatusFilter", "");
    setValue("activityStartDate", "");
    setValue("activityEndDate", "");

    updatePresetButtonActiveState("all");
    loadActivitiesAndSummary();
}

/* =========================================================
   RENDER MEMBER CARE CARDS (SCRUM-109)
========================================================= */
function renderMemberCareSection() {
    const grid = document.getElementById("memberCareGrid");
    const empty = document.getElementById("memberCareEmpty");
    const countPill = document.getElementById("memberCareCountPill");
    if (!grid) return;

    if (countPill) {
        countPill.textContent = `${memberSummaries.length} thành viên`;
    }

    if (!memberSummaries.length) {
        grid.innerHTML = "";
        if (empty) empty.style.display = "flex";
        return;
    }
    if (empty) empty.style.display = "none";

    grid.innerHTML = "";
    memberSummaries.forEach(m => {
        const isSelected = String(filterState.ownerId) === String(m.userId);
        const total = Number(m.totalActivities) || 0;
        const completed = Number(m.completedCount) || 0;
        const open = Number(m.openCount) || 0;
        const late = Number(m.lateCount) || 0;

        const pDone = total > 0 ? (completed / total) * 100 : 0;
        const pOpen = total > 0 ? (open / total) * 100 : 0;
        const pLate = total > 0 ? (late / total) * 100 : 0;

        const initials = getInitials(m.fullName || m.email || "NV");

        const card = document.createElement("article");
        card.className = `member-care-card ${isSelected ? "active-selected" : ""}`;
        card.dataset.memberId = String(m.userId);
        card.title = isSelected ? "Đang lọc theo thành viên này. Nhấp để bỏ chọn." : "Nhấp để lọc hoạt động của thành viên này";

        card.innerHTML = `
            <div class="member-card-top">
                <div class="member-user-info">
                    <div class="member-avatar">${initials}</div>
                    <div class="member-meta">
                        <strong>${escapeHtml(m.fullName || m.email)}</strong>
                        <span>${escapeHtml(m.teamName || "Nhóm kinh doanh")}</span>
                    </div>
                </div>
                <div class="member-total-box">
                    <div class="count">${total}</div>
                    <span class="label">hoạt động</span>
                </div>
            </div>

            <div class="member-types-chips">
                <span class="type-chip call" title="Cuộc gọi">📞 ${m.callCount || 0}</span>
                <span class="type-chip email" title="Email">✉️ ${m.emailCount || 0}</span>
                <span class="type-chip meeting" title="Cuộc họp">👥 ${m.meetingCount || 0}</span>
                <span class="type-chip task" title="Công việc">📋 ${m.taskCount || 0}</span>
                <span class="type-chip note" title="Ghi chú">📝 ${m.noteCount || 0}</span>
            </div>

            <div class="member-progress-wrap">
                <div class="member-progress-label">
                    <span>Xong: <b>${completed}</b> (${pDone.toFixed(0)}%)</span>
                    <span>Đang mở: <b>${open}</b></span>
                    ${late > 0 ? `<span style="color:#ef4444;font-weight:700;">Quá hạn: <b>${late}</b></span>` : ""}
                </div>
                <div class="member-progress-bar">
                    <div class="seg-done" style="width:${pDone}%"></div>
                    <div class="seg-open" style="width:${pOpen}%"></div>
                    <div class="seg-late" style="width:${pLate}%"></div>
                </div>
            </div>

            <div class="member-card-footer">
                <span>Gần nhất: ${formatDateAgo(m.latestActivityAt)}</span>
                <button type="button" class="member-filter-link prevent-card-click">
                    ${isSelected ? "✓ Đang lọc (Bỏ)" : "Lọc hoạt động →"}
                </button>
            </div>
        `;

        // Handle button inside footer
        card.querySelector(".member-filter-link")?.addEventListener("click", e => {
            e.stopPropagation();
            if (filterState.ownerId === String(m.userId)) {
                filterState.ownerId = "";
            } else {
                filterState.ownerId = String(m.userId);
            }
            setValue("activityMemberFilter", filterState.ownerId);
            loadActivitiesAndSummary();
        });

        grid.appendChild(card);
    });
}

/* =========================================================
   RENDER ACTIVITY LIST & CHIPS
========================================================= */
function renderActivityList() {
    const list = document.getElementById("activityList");
    if (!list) return;
    list.innerHTML = "";

    const empty = document.getElementById("activityEmpty");
    if (empty) empty.style.display = activities.length ? "none" : "flex";

    activities.forEach(item => {
        const article = document.createElement("article");
        article.className = "activity-row";
        const ownerInitials = getInitials(item.owner || "U");

        article.innerHTML = `
            <div class="activity-icon ${item.type}">
                ${typeIcon(item.type)}
            </div>

            <div class="activity-main">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.description || "Không có ghi chú")}</p>
            </div>

            <div class="activity-relation">
                ${escapeHtml(item.relation || "Không liên kết")}
            </div>

            <div class="activity-owner" title="Người thực hiện">
                <div class="activity-owner-avatar">${ownerInitials}</div>
                <span>${escapeHtml(item.owner)}</span>
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
}

function renderActiveFilterChips() {
    const wrap = document.getElementById("activeFilterChips");
    if (!wrap) return;

    const chips = [];

    if (filterState.keyword) {
        chips.push({
            label: `Từ khóa: "${filterState.keyword}"`,
            clear: () => {
                filterState.keyword = "";
                setValue("activitySearch", "");
            }
        });
    }

    if (filterState.type) {
        const typeLabels = { call: "Cuộc gọi", email: "Email", meeting: "Cuộc họp", task: "Công việc", note: "Ghi chú" };
        chips.push({
            label: `Loại: ${typeLabels[filterState.type] || filterState.type}`,
            clear: () => {
                filterState.type = "";
                setValue("activityTypeFilter", "");
            }
        });
    }

    if (filterState.ownerId) {
        const member = accessibleMembers.find(m => String(m.id) === String(filterState.ownerId));
        const memberName = member ? (member.fullName || member.email) : `ID ${filterState.ownerId}`;
        chips.push({
            label: `Thành viên: ${memberName}`,
            clear: () => {
                filterState.ownerId = "";
                setValue("activityMemberFilter", "");
            }
        });
    }

    if (filterState.status) {
        const statusLabels = { open: "Đang mở", done: "Hoàn thành", late: "Quá hạn" };
        chips.push({
            label: `Trạng thái: ${statusLabels[filterState.status] || filterState.status}`,
            clear: () => {
                filterState.status = "";
                setValue("activityStatusFilter", "");
            }
        });
    }

    if (filterState.startDate || filterState.endDate) {
        let dateText = "Thời gian: ";
        if (filterState.startDate && filterState.endDate) dateText += `${filterState.startDate} → ${filterState.endDate}`;
        else if (filterState.startDate) dateText += `Từ ${filterState.startDate}`;
        else if (filterState.endDate) dateText += `Đến ${filterState.endDate}`;

        chips.push({
            label: dateText,
            clear: () => {
                filterState.startDate = "";
                filterState.endDate = "";
                filterState.preset = "all";
                setValue("activityStartDate", "");
                setValue("activityEndDate", "");
                updatePresetButtonActiveState("all");
            }
        });
    }

    if (!chips.length) {
        wrap.style.display = "none";
        wrap.innerHTML = "";
        return;
    }

    wrap.style.display = "flex";
    wrap.innerHTML = `<span style="font-size:11px;color:var(--crm-muted);">Bộ lọc đang bật:</span>`;
    chips.forEach(chip => {
        const span = document.createElement("span");
        span.className = "filter-chip";
        span.innerHTML = `<span>${escapeHtml(chip.label)}</span><button type="button" class="filter-chip-clear" title="Xóa lọc">×</button>`;
        span.querySelector("button")?.addEventListener("click", () => {
            chip.clear();
            loadActivitiesAndSummary();
        });
        wrap.appendChild(span);
    });

    const clearAllBtn = document.createElement("button");
    clearAllBtn.type = "button";
    clearAllBtn.className = "crm-btn crm-btn-ghost";
    clearAllBtn.style.fontSize = "11px";
    clearAllBtn.style.padding = "2px 8px";
    clearAllBtn.textContent = "Xóa tất cả";
    clearAllBtn.addEventListener("click", resetAllFilters);
    wrap.appendChild(clearAllBtn);
}

function updateSummaryCards() {
    const now = todayString();
    const open = activities.filter(item => item.status === "open");
    const done = activities.filter(item => item.status === "done");
    const late = activities.filter(item => item.status === "open" && item.date && item.date < now);

    text("totalActivity", activities.length);
    text("openActivity", open.length);
    text("doneActivity", done.length);
    text("lateActivity", late.length);
}

/* =========================================================
   DRAWER (TẠO / SỬA HOẠT ĐỘNG)
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
        setValue("activityOwnerSelect", item.ownerUserId || "");
        setValue("activityOwner", item.owner);
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
        if (accessibleMembers.length) {
            setValue("activityOwnerSelect", accessibleMembers[0].id);
        }
    }

    drawer?.classList.add("open");
    overlay?.classList.add("open");
}

function closeDrawer() {
    drawer?.classList.remove("open");
    overlay?.classList.remove("open");
}

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
    const ownerSelectVal = value("activityOwnerSelect");
    const ownerId = ownerSelectVal && !isNaN(Number(ownerSelectVal)) ? Number(ownerSelectVal) : null;
    const description = value("activityDescription");

    const dueDateStr = date ? `${date} ${time || "09:00"}:00` : null;

    try {
        if (editingId && !isNaN(Number(editingId))) {
            await api(`/api/activities/${editingId}`, {
                method: "PUT",
                body: JSON.stringify({
                    subject: title,
                    type: type.toUpperCase(),
                    description: description,
                    status: "OPEN",
                    dueDate: dueDateStr
                })
            });
        } else {
            await api("/api/activities", {
                method: "POST",
                body: JSON.stringify({
                    subject: title,
                    type: type.toUpperCase(),
                    description: description,
                    status: "OPEN",
                    dueDate: dueDateStr,
                    ownerId: ownerId
                })
            });
        }

        await loadActivitiesAndSummary();
        closeDrawer();
    } catch (err) {
        if (error) error.textContent = "Lỗi: " + err.message;
        else alert("Lỗi khi lưu hoạt động: " + err.message);
    }
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
    return formatDate(new Date());
}

function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateAgo(ts) {
    if (!ts) return "Chưa có";
    const dt = new Date(ts);
    if (isNaN(dt.getTime())) return "Chưa có";
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

function getInitials(name) {
    if (!name) return "NV";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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

// Start
init();