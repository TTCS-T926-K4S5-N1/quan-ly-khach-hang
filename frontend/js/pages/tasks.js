"use strict";

const API_BASE = (function () {
    if (window.location.port === "8080" || window.location.pathname.startsWith("/crm")) {
        return "/crm";
    }
    return "http://localhost:8080/crm";
})();

let tasks = [];
let assignableUsers = [];
let customersList = [];
let opportunitiesList = [];
let currentUser = null;

// Modal Elements
const modal = document.getElementById("taskModal");
const overlay = document.getElementById("taskOverlay");
const postponeModal = document.getElementById("postponeModal");
const postponeOverlay = document.getElementById("postponeOverlay");

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
    await loadTasks();
});

function setupEventListeners() {
    document.getElementById("newTask")?.addEventListener("click", () => openModal());
    document.getElementById("closeTaskModal")?.addEventListener("click", closeModal);
    document.getElementById("cancelTask")?.addEventListener("click", closeModal);
    overlay?.addEventListener("click", closeModal);

    document.getElementById("closePostponeModal")?.addEventListener("click", closePostponeModal);
    document.getElementById("cancelPostpone")?.addEventListener("click", closePostponeModal);
    postponeOverlay?.addEventListener("click", closePostponeModal);

    ["taskSearch", "taskState", "taskPriorityFilter", "taskMemberFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(id === "taskSearch" ? "input" : "change", render);
        }
    });

    document.getElementById("taskForm")?.addEventListener("submit", handleSaveTask);
    document.getElementById("postponeForm")?.addEventListener("submit", handlePostponeSubmit);

    // Cascading customer -> opportunities in modal
    document.getElementById("taskCustomerSelect")?.addEventListener("change", (e) => {
        const custId = e.target.value;
        populateOpportunitySelect(custId);
    });
}

async function loadInitialMetadata() {
    try {
        // Load current user profile
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
        // Load assignable users for team lead / delegation
        const users = await api("/api/activities/assignable-users");
        if (Array.isArray(users)) {
            assignableUsers = users;
            populateAssigneeSelects();
        }
    } catch (_) {}

    try {
        // Load customers for linking
        const custData = await api("/api/customers?limit=100");
        if (custData && Array.isArray(custData.items)) {
            customersList = custData.items;
        } else if (Array.isArray(custData)) {
            customersList = custData;
        }
        populateCustomerSelect();
    } catch (_) {}

    try {
        // Load opportunities for linking
        const oppData = await api("/api/opportunities");
        if (Array.isArray(oppData)) {
            opportunitiesList = oppData;
        }
    } catch (_) {}
}

function populateAssigneeSelects() {
    const modalSelect = document.getElementById("taskAssignee");
    const filterSelect = document.getElementById("taskMemberFilter");

    if (modalSelect) {
        modalSelect.innerHTML = assignableUsers.map(u => `
            <option value="${u.id}" ${currentUser && currentUser.id === u.id ? "selected" : ""}>
                ${escapeHtml(u.fullName || u.email)} (${escapeHtml(u.teamName || "Thành viên")})
            </option>
        `).join("");
    }

    if (filterSelect) {
        filterSelect.innerHTML = `
            <option value="">Tất cả người thực hiện</option>
            <option value="self">👤 Chỉ của tôi (${escapeHtml(currentUser?.fullName || "Tôi")})</option>
            ${assignableUsers.map(u => `
                <option value="${u.id}">👤 ${escapeHtml(u.fullName || u.email)}</option>
            `).join("")}
        `;
    }
}

function populateCustomerSelect() {
    const custSelect = document.getElementById("taskCustomerSelect");
    if (!custSelect) return;
    custSelect.innerHTML = `<option value="">-- Chọn khách hàng liên quan --</option>` +
        customersList.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
}

function populateOpportunitySelect(selectedCustomerId = null) {
    const oppSelect = document.getElementById("taskOpportunitySelect");
    if (!oppSelect) return;

    let filteredOpps = opportunitiesList;
    if (selectedCustomerId) {
        filteredOpps = opportunitiesList.filter(o => String(o.customerId) === String(selectedCustomerId));
    }

    oppSelect.innerHTML = `<option value="">-- Chọn cơ hội liên quan --</option>` +
        filteredOpps.map(o => `<option value="${o.id}">[#${o.id}] ${escapeHtml(o.name)}</option>`).join("");
}

/* =========================================================
   LOAD & RENDER TASKS
========================================================= */
async function loadTasks() {
    try {
        const data = await api("/api/activities?type=TASK");
        tasks = Array.isArray(data) ? data : [];
        updateKpis();
        render();
    } catch (err) {
        console.error("Error loading tasks:", err);
    }
}

function updateKpis() {
    const total = tasks.length;
    let openCount = 0;
    let lateCount = 0;
    let postponedCount = 0;
    let doneCount = 0;

    const todayStr = new Date().toISOString().slice(0, 10);

    tasks.forEach(t => {
        const isDone = (t.status || "").toUpperCase() === "COMPLETED";
        const isPostponed = (t.status || "").toUpperCase() === "POSTPONED";
        const dueDateStr = t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "";

        if (isDone) {
            doneCount++;
        } else if (isPostponed) {
            postponedCount++;
        } else {
            openCount++;
            if (dueDateStr && dueDateStr < todayStr) {
                lateCount++;
            }
        }
    });

    setElText("kpiTotalTasks", total);
    setElText("kpiOpenTasks", openCount);
    setElText("kpiLateTasks", lateCount);
    setElText("kpiPostponedTasks", postponedCount);
    setElText("kpiDoneTasks", doneCount);
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setQuickFilter(stateValue) {
    const stateEl = document.getElementById("taskState");
    if (stateEl) {
        stateEl.value = stateValue;
    }
    updateActiveKpiCard(stateValue);
    render();
}

function updateActiveKpiCard(stateValue) {
    const filterVal = (stateValue || "").toLowerCase();
    document.querySelectorAll(".task-kpi-card").forEach(c => {
        const cardFilter = (c.getAttribute("data-filter") || "").toLowerCase();
        if (cardFilter === filterVal) {
            c.classList.add("is-active");
        } else {
            c.classList.remove("is-active");
        }
    });
}

function render() {
    const listEl = document.getElementById("tasksList");
    const emptyEl = document.getElementById("tasksEmpty");
    if (!listEl) return;

    const searchKeyword = (document.getElementById("taskSearch")?.value || "").trim().toLowerCase();
    const stateFilter = (document.getElementById("taskState")?.value || "").toLowerCase();
    const priorityFilter = (document.getElementById("taskPriorityFilter")?.value || "").toLowerCase();
    const memberFilter = (document.getElementById("taskMemberFilter")?.value || "").toLowerCase();

    updateActiveKpiCard(stateFilter);

    const todayStr = new Date().toISOString().slice(0, 10);

    const filtered = tasks.filter(t => {
        const isDone = (t.status || "").toUpperCase() === "COMPLETED";
        const isPostponed = (t.status || "").toUpperCase() === "POSTPONED";
        const dueDateStr = t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "";
        const isLate = !isDone && dueDateStr && dueDateStr < todayStr;

        // State filter
        if (stateFilter === "open" && (isDone || isPostponed)) return false;
        if (stateFilter === "done" && !isDone) return false;
        if (stateFilter === "postponed" && !isPostponed) return false;
        if (stateFilter === "late" && !isLate) return false;

        // Priority filter
        if (priorityFilter && (t.priority || "medium").toLowerCase() !== priorityFilter) return false;

        // Member filter
        if (memberFilter === "self") {
            if (currentUser && t.ownerUserId && t.ownerUserId !== currentUser.id) return false;
        } else if (memberFilter && String(t.ownerUserId) !== memberFilter) {
            return false;
        }

        // Search keyword
        if (searchKeyword) {
            const matchSubject = (t.subject || "").toLowerCase().includes(searchKeyword);
            const matchDesc = (t.description || "").toLowerCase().includes(searchKeyword);
            const matchCust = (t.customerName || "").toLowerCase().includes(searchKeyword);
            const matchOpp = (t.opportunityName || "").toLowerCase().includes(searchKeyword);
            const matchOwner = (t.ownerName || "").toLowerCase().includes(searchKeyword);
            if (!matchSubject && !matchDesc && !matchCust && !matchOpp && !matchOwner) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        listEl.innerHTML = "";
        if (emptyEl) emptyEl.style.display = "block";
        return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    listEl.innerHTML = filtered.map(t => {
        const isDone = (t.status || "").toUpperCase() === "COMPLETED";
        const isPostponed = (t.status || "").toUpperCase() === "POSTPONED";
        const priority = (t.priority || "MEDIUM").toUpperCase();
        const dueDateStr = t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "";
        const isLate = !isDone && dueDateStr && dueDateStr < todayStr;

        let priorityClass = "medium";
        let priorityLabel = "🔷 Trung bình";
        if (priority === "URGENT") { priorityClass = "urgent"; priorityLabel = "🔥 Khẩn cấp"; }
        else if (priority === "HIGH") { priorityClass = "high"; priorityLabel = "⚡ Cao"; }
        else if (priority === "LOW") { priorityClass = "low"; priorityLabel = "⚪ Thấp"; }

        let cardClass = `task-item-card is-${priorityClass}`;
        if (isDone) cardClass += " is-completed";

        const formattedDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString("vi-VN", {
            weekday: "short", day: "2-digit", month: "2-digit", year: "numeric"
        }) : "Chưa đặt hạn";

        return `
            <div class="${cardClass}" id="task-card-${t.id}">
                <div class="task-check-wrap">
                    <button type="button" class="task-check-btn ${isDone ? 'is-checked' : ''}" 
                            title="${isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}" 
                            onclick="handleToggleComplete(${t.id})">
                        <svg class="task-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </button>
                </div>
                
                <div class="task-item-content">
                    <div class="task-badges-row">
                        <span class="priority-chip ${priorityClass}">${priorityLabel}</span>
                        ${isDone ? '<span class="status-chip done">✅ Đã hoàn thành</span>' : ''}
                        ${isPostponed ? '<span class="status-chip postponed">⏱️ Đã hoãn lại</span>' : ''}
                        ${isLate ? '<span class="status-chip late">⚠️ Quá hạn chót</span>' : ''}
                    </div>

                    <div class="task-main-title">
                        ${escapeHtml(t.subject || t.title)}
                    </div>

                    ${t.description ? `<div class="task-desc">${escapeHtml(t.description)}</div>` : ''}

                    <div class="task-meta-row">
                        <span class="task-meta-item ${isLate ? 'is-late' : ''}">
                            <span>📅 Hạn:</span>
                            <strong>${formattedDate}</strong>
                        </span>
                        
                        ${t.customerName ? `
                            <span class="task-meta-item">
                                <span>🏢</span>
                                <a href="customer-360?id=${t.customerId}" class="task-meta-link">${escapeHtml(t.customerName)}</a>
                            </span>
                        ` : ''}

                        ${t.opportunityName ? `
                            <span class="task-meta-item">
                                <span>🎯</span>
                                <a href="pipeline" class="task-meta-link">${escapeHtml(t.opportunityName)}</a>
                            </span>
                        ` : ''}

                        <span class="task-meta-item">
                            <span>👤 Thực hiện:</span>
                            <strong>${escapeHtml(t.ownerName || "Chưa giao")}</strong>
                            ${t.assignedByName && t.assignedByName !== t.ownerName ? `<em style="color:#64748b; font-style: normal; margin-left: 2px;">(Giao bởi: ${escapeHtml(t.assignedByName)})</em>` : ''}
                        </span>
                    </div>

                    ${isPostponed && t.postponeReason ? `
                        <div class="task-postpone-box">
                            <strong>⏱️ Lý do hoãn:</strong> ${escapeHtml(t.postponeReason)}
                        </div>
                    ` : ''}
                </div>

                <div class="task-actions-wrap">
                    ${!isDone ? `
                        <button type="button" class="task-btn-postpone" title="Gia hạn thời gian hoàn thành" onclick="openPostponeModal(${t.id}, '${escapeHtml(t.subject || '').replace(/'/g, "\\'")}', '${dueDateStr}')">
                            <span>⏱️</span>
                            <span>Hoãn lại</span>
                        </button>
                    ` : ''}
                    <button type="button" class="task-btn-icon" title="Chỉnh sửa công việc" onclick="openModal(${t.id})">
                        ✏️
                    </button>
                    <button type="button" class="task-btn-delete" title="Xóa công việc" onclick="handleDeleteTask(${t.id})">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

/* =========================================================
   ACTIONS: COMPLETE & POSTPONE
========================================================= */
async function handleToggleComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCurrentlyDone = (task.status || "").toUpperCase() === "COMPLETED";
    try {
        if (!isCurrentlyDone) {
            await api(`/api/activities/${taskId}/complete`, { method: "POST" });
        } else {
            await api(`/api/activities/${taskId}`, {
                method: "PUT",
                body: JSON.stringify({ status: "OPEN" })
            });
        }
        await loadTasks();
    } catch (err) {
        alert("Lỗi cập nhật trạng thái: " + err.message);
    }
}

function openPostponeModal(taskId, title, currentDueDate) {
    document.getElementById("postponeTaskId").value = taskId;
    document.getElementById("postponeTaskSubject").textContent = title || "Công việc #" + taskId;

    // Suggest default new due date (+2 days)
    const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
    baseDate.setDate(baseDate.getDate() + 2);
    document.getElementById("postponeNewDate").value = baseDate.toISOString().slice(0, 10);
    document.getElementById("postponeReason").value = "";
    document.getElementById("postponeError").textContent = "";

    postponeModal.style.display = "block";
    postponeOverlay.style.display = "block";
}

function closePostponeModal() {
    if (postponeModal) postponeModal.style.display = "none";
    if (postponeOverlay) postponeOverlay.style.display = "none";
}

function setPostponeReason(reason) {
    const input = document.getElementById("postponeReason");
    if (input) input.value = reason;
}

async function handlePostponeSubmit(e) {
    e.preventDefault();
    const taskId = document.getElementById("postponeTaskId")?.value;
    const newDueDate = document.getElementById("postponeNewDate")?.value;
    const reason = document.getElementById("postponeReason")?.value.trim();
    const errorEl = document.getElementById("postponeError");

    if (!reason) {
        if (errorEl) errorEl.textContent = "Vui lòng nhập lý do hoãn công việc.";
        return;
    }

    try {
        await api(`/api/activities/${taskId}/postpone`, {
            method: "POST",
            body: JSON.stringify({
                postponeReason: reason,
                newDueDate: newDueDate ? newDueDate + " 17:00:00" : null
            })
        });
        closePostponeModal();
        await loadTasks();
    } catch (err) {
        if (errorEl) errorEl.textContent = err.message;
    }
}

/* =========================================================
   CREATE & EDIT TASK MODAL
========================================================= */
function openModal(taskId = null) {
    const form = document.getElementById("taskForm");
    if (form) form.reset();
    document.getElementById("editingTaskId").value = taskId || "";
    document.getElementById("taskError").textContent = "";

    const titleEl = document.getElementById("taskModalTitle");
    if (titleEl) titleEl.textContent = taskId ? "Chỉnh sửa công việc" : "Tạo công việc mới";

    // Set default due date: today
    setQuickDueDate(0);

    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById("taskTitle").value = task.subject || "";
            document.getElementById("taskPriority").value = (task.priority || "MEDIUM").toUpperCase();
            if (task.dueDate) {
                document.getElementById("taskDate").value = new Date(task.dueDate).toISOString().slice(0, 10);
            }
            if (task.customerId) {
                document.getElementById("taskCustomerSelect").value = task.customerId;
                populateOpportunitySelect(task.customerId);
            }
            if (task.opportunityId) {
                document.getElementById("taskOpportunitySelect").value = task.opportunityId;
            }
            if (task.ownerUserId) {
                document.getElementById("taskAssignee").value = task.ownerUserId;
            }
            document.getElementById("taskDescription").value = task.description || "";
        }
    } else {
        if (currentUser) {
            document.getElementById("taskAssignee").value = currentUser.id;
        }
    }

    modal.classList.add("open");
    overlay.classList.add("open");
}

function closeModal() {
    modal.classList.remove("open");
    overlay.classList.remove("open");
}

function setQuickDueDate(daysFromToday) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const dateInput = document.getElementById("taskDate");
    if (dateInput) dateInput.value = d.toISOString().slice(0, 10);
}

function setQuickDueThisFriday() {
    const d = new Date();
    const day = d.getDay(); // 0: CN, 1: T2, ..., 5: T6
    const diff = (5 - day + 7) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    const dateInput = document.getElementById("taskDate");
    if (dateInput) dateInput.value = d.toISOString().slice(0, 10);
}

async function handleSaveTask(e) {
    e.preventDefault();
    const errorEl = document.getElementById("taskError");
    if (errorEl) errorEl.textContent = "";

    const editingId = document.getElementById("editingTaskId")?.value;
    const subject = document.getElementById("taskTitle")?.value.trim();
    const priority = document.getElementById("taskPriority")?.value || "MEDIUM";
    const dueDateStr = document.getElementById("taskDate")?.value;
    const customerId = document.getElementById("taskCustomerSelect")?.value || null;
    const opportunityId = document.getElementById("taskOpportunitySelect")?.value || null;
    const assigneeUserId = document.getElementById("taskAssignee")?.value || null;
    const description = document.getElementById("taskDescription")?.value.trim() || null;

    if (!subject) {
        if (errorEl) errorEl.textContent = "Vui lòng nhập tiêu đề công việc.";
        return;
    }
    if (!dueDateStr) {
        if (errorEl) errorEl.textContent = "Vui lòng chọn hạn hoàn thành.";
        return;
    }

    const payload = {
        subject,
        type: "TASK",
        priority,
        dueDate: dueDateStr + " 17:00:00",
        customerId: customerId ? Number(customerId) : null,
        opportunityId: opportunityId ? Number(opportunityId) : null,
        assigneeUserId: assigneeUserId ? Number(assigneeUserId) : null,
        description
    };

    try {
        if (editingId) {
            await api(`/api/activities/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
        } else {
            await api("/api/activities", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        }
        closeModal();
        await loadTasks();
    } catch (err) {
        if (errorEl) errorEl.textContent = err.message;
    }
}

async function handleDeleteTask(taskId) {
    if (!confirm("Bạn có chắc chắn muốn xóa công việc này không?")) return;
    try {
        await api(`/api/activities/${taskId}`, { method: "DELETE" });
        await loadTasks();
    } catch (err) {
        alert("Lỗi khi xóa công việc: " + err.message);
    }
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/* Expose global handlers for inline markup */
window.setQuickFilter = setQuickFilter;
window.handleToggleComplete = handleToggleComplete;
window.openPostponeModal = openPostponeModal;
window.closePostponeModal = closePostponeModal;
window.setPostponeReason = setPostponeReason;
window.openModal = openModal;
window.closeModal = closeModal;
window.setQuickDueDate = setQuickDueDate;
window.setQuickDueThisFriday = setQuickDueThisFriday;
window.handleDeleteTask = handleDeleteTask;