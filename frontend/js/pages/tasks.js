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

// Pagination State
let taskCurrentPage = 1;
let taskPageSize = 10;
let taskTotalItems = 0;
let taskTotalPages = 1;

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
            el.addEventListener(id === "taskSearch" ? "input" : "change", () => {
                taskCurrentPage = 1;
                render();
            });
        }
    });

    document.getElementById("taskForm")?.addEventListener("submit", handleSaveTask);
    document.getElementById("postponeForm")?.addEventListener("submit", handlePostponeSubmit);

    // Cascading customer -> opportunities in modal
    document.getElementById("taskCustomerSelect")?.addEventListener("change", (e) => {
        const custId = e.target.value;
        populateOpportunitySelect(custId);
    });

    // Pagination events
    document.getElementById("taskPaginationControls")?.addEventListener("click", (e) => {
        const btn = e.target.closest(".crm-pagination-btn");
        if (btn && !btn.disabled && btn.dataset.page) {
            taskCurrentPage = parseInt(btn.dataset.page, 10);
            render();
            window.scrollTo({ top: 300, behavior: "smooth" });
        }
    });

    document.getElementById("taskPageSizeSelect")?.addEventListener("change", (e) => {
        taskPageSize = parseInt(e.target.value, 10);
        taskCurrentPage = 1;
        render();
    });

    // Dropdown menu toggle
    document.addEventListener("click", (e) => {
        const toggleBtn = e.target.closest("[data-action-menu]");
        if (toggleBtn) {
            e.stopPropagation();
            const idx = toggleBtn.getAttribute("data-action-menu");
            const targetMenu = document.querySelector(`.row-action-menu[data-menu="${idx}"]`);
            const allMenus = document.querySelectorAll(".row-action-menu");
            
            allMenus.forEach(m => {
                if (m !== targetMenu) m.classList.remove("open");
            });

            if (targetMenu) {
                targetMenu.classList.toggle("open");
            }
            return;
        }

        if (!e.target.closest(".row-action-menu")) {
            document.querySelectorAll(".row-action-menu").forEach(m => m.classList.remove("open"));
        }
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
    taskCurrentPage = 1;
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
    const paginationEl = document.getElementById("taskPagination");
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

    taskTotalItems = filtered.length;
    taskTotalPages = Math.max(1, Math.ceil(taskTotalItems / taskPageSize));

    if (taskCurrentPage > taskTotalPages) taskCurrentPage = taskTotalPages;
    if (taskCurrentPage < 1) taskCurrentPage = 1;

    if (filtered.length === 0) {
        listEl.innerHTML = "";
        if (emptyEl) emptyEl.style.display = "block";
        if (paginationEl) paginationEl.style.display = "none";
        return;
    }

    if (emptyEl) emptyEl.style.display = "none";
    if (paginationEl) paginationEl.style.display = "flex";

    const startIndex = (taskCurrentPage - 1) * taskPageSize;
    const paged = filtered.slice(startIndex, startIndex + taskPageSize);

    listEl.innerHTML = paged.map((t, idx) => {
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

        const globalIdx = startIndex + idx;

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

                <div class="row-actions-group" style="align-self: flex-start; margin-left: auto;">
                    <button type="button" class="crm-btn crm-btn-secondary crm-btn-sm" style="padding: 4px 10px; font-size: 12px;" title="Chỉnh sửa công việc" onclick="openModal(${t.id})">
                        ✏️ Sửa
                    </button>
                    <div class="row-action-wrap">
                        <button class="row-action-button" type="button" data-action-menu="${globalIdx}" title="Thao tác khác">
                            ⋮
                        </button>
                        <div class="row-action-menu" data-menu="${globalIdx}">
                            ${!isDone ? `
                                <button type="button" onclick="openPostponeModal(${t.id}, '${escapeHtml(t.subject || '').replace(/'/g, "\\'")}', '${dueDateStr}')">
                                    ⏱️ Hoãn hạn hoàn thành
                                </button>
                            ` : ''}
                            <button type="button" class="danger" onclick="handleDeleteTask(${t.id})">
                                🗑️ Xóa công việc
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    renderTaskPagination();
}

/* =========================================================
   TASK PAGINATION
========================================================= */
function renderTaskPagination() {
    const rangeEl = document.getElementById("taskPaginationRange");
    const totalEl = document.getElementById("taskPaginationTotal");
    const controlsEl = document.getElementById("taskPaginationControls");

    if (!rangeEl || !totalEl || !controlsEl) return;

    if (taskTotalItems === 0) {
        rangeEl.textContent = "0-0";
        totalEl.textContent = "0";
        controlsEl.innerHTML = "";
        return;
    }

    const start = (taskCurrentPage - 1) * taskPageSize + 1;
    const end = Math.min(taskCurrentPage * taskPageSize, taskTotalItems);
    rangeEl.textContent = `${start}-${end}`;
    totalEl.textContent = String(taskTotalItems);

    let html = `
        <button class="crm-pagination-btn" ${taskCurrentPage === 1 ? 'disabled' : ''} data-page="${taskCurrentPage - 1}" title="Trang trước">
            &lsaquo;
        </button>
    `;

    for (let p = 1; p <= taskTotalPages; p++) {
        if (p === 1 || p === taskTotalPages || (p >= taskCurrentPage - 1 && p <= taskCurrentPage + 1)) {
            html += `
                <button class="crm-pagination-btn ${p === taskCurrentPage ? 'active' : ''}" data-page="${p}">
                    ${p}
                </button>
            `;
        } else if (p === taskCurrentPage - 2 || p === taskCurrentPage + 2) {
            html += `<span class="crm-pagination-ellipsis">...</span>`;
        }
    }

    html += `
        <button class="crm-pagination-btn" ${taskCurrentPage === taskTotalPages ? 'disabled' : ''} data-page="${taskCurrentPage + 1}" title="Trang tiếp">
            &rsaquo;
        </button>
    `;

    controlsEl.innerHTML = html;
}

/* =========================================================
   TASK ACTIONS: COMPLETE, POSTPONE, DELETE
========================================================= */
async function handleToggleComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isDone = (task.status || "").toUpperCase() === "COMPLETED";
    const newStatus = isDone ? "OPEN" : "COMPLETED";

    try {
        await api(`/api/activities/${taskId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus })
        });
        task.status = newStatus;
        updateKpis();
        render();
    } catch (err) {
        alert("Lỗi khi cập nhật trạng thái: " + err.message);
    }
}

function openPostponeModal(taskId, subject, currentDueDate) {
    document.getElementById("postponeTaskId").value = taskId;
    document.getElementById("postponeTaskSubject").textContent = subject || "—";
    document.getElementById("postponeReason").value = "";
    document.getElementById("postponeError").textContent = "";

    // Set default new due date: tomorrow or current + 1
    const d = new Date();
    d.setDate(d.getDate() + 1);
    document.getElementById("postponeNewDate").value = d.toISOString().slice(0, 10);

    postponeModal.style.display = "block";
    postponeOverlay.style.display = "block";
}

function closePostponeModal() {
    postponeModal.style.display = "none";
    postponeOverlay.style.display = "none";
}

function setPostponeReason(reason) {
    const el = document.getElementById("postponeReason");
    if (el) el.value = reason;
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
    const day = d.getDay(); // 0 is Sun, 5 is Fri
    let diff = 5 - day;
    if (diff <= 0) diff += 7; // Next Friday
    d.setDate(d.getDate() + diff);
    const dateInput = document.getElementById("taskDate");
    if (dateInput) dateInput.value = d.toISOString().slice(0, 10);
}

async function handleSaveTask(e) {
    e.preventDefault();
    const taskId = document.getElementById("editingTaskId")?.value;
    const title = document.getElementById("taskTitle")?.value.trim();
    const priority = document.getElementById("taskPriority")?.value || "MEDIUM";
    const assignee = document.getElementById("taskAssignee")?.value || null;
    const dueDate = document.getElementById("taskDate")?.value;
    const customerId = document.getElementById("taskCustomerSelect")?.value || null;
    const opportunityId = document.getElementById("taskOpportunitySelect")?.value || null;
    const description = document.getElementById("taskDescription")?.value.trim();
    const errorEl = document.getElementById("taskError");

    if (!title) {
        if (errorEl) errorEl.textContent = "Vui lòng nhập tiêu đề công việc.";
        return;
    }

    const payload = {
        type: "TASK",
        subject: title,
        priority: priority,
        ownerUserId: assignee ? parseInt(assignee, 10) : null,
        dueDate: dueDate ? dueDate + " 18:00:00" : null,
        customerId: customerId ? parseInt(customerId, 10) : null,
        opportunityId: opportunityId ? parseInt(opportunityId, 10) : null,
        description: description || null
    };

    try {
        if (taskId) {
            await api(`/api/activities/${taskId}`, {
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