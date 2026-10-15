"use strict";

const API_BASE = "http://localhost:8080/crm";

let organizations = [];
let regions = [];
let users = [];
let selectedId = null;

// DOM Elements
const tree = document.getElementById("organizationTree");
const empty = document.getElementById("organizationEmpty");
const drawer = document.getElementById("orgDrawer");
const overlay = document.getElementById("orgOverlay");

// Region Modal Elements
const regionModal = document.getElementById("regionModal");
const regionOverlay = document.getElementById("regionModalOverlay");
const openRegionBtn = document.getElementById("openRegionModalBtn");
const closeRegionBtn = document.getElementById("closeRegionModal");
const newRegionForm = document.getElementById("newRegionForm");

// Assign Member Modal Elements
const assignModal = document.getElementById("assignMemberModal");
const assignOverlay = document.getElementById("assignModalOverlay");
const openAssignBtn = document.getElementById("openAssignMemberBtn");
const closeAssignBtn = document.getElementById("closeAssignModal");
const cancelAssignBtn = document.getElementById("cancelAssignModal");
const assignMemberForm = document.getElementById("assignMemberForm");

// Event Listeners for Header Actions
document.getElementById("addRootOrg")?.addEventListener("click", () => openDrawer(null, null));
document.getElementById("addChildOrg")?.addEventListener("click", () => {
    if (!selectedId) return;
    openDrawer(null, selectedId);
});
document.getElementById("editOrg")?.addEventListener("click", () => {
    if (!selectedId) return;
    openDrawer(selectedId, null);
});
document.getElementById("deleteOrg")?.addEventListener("click", handleDeleteOrg);

// Drawer Events
document.getElementById("closeOrgDrawer")?.addEventListener("click", closeDrawer);
document.getElementById("cancelOrg")?.addEventListener("click", closeDrawer);
overlay?.addEventListener("click", closeDrawer);
document.getElementById("orgForm")?.addEventListener("submit", handleOrgSubmit);

// Region Modal Events
openRegionBtn?.addEventListener("click", openRegionModal);
closeRegionBtn?.addEventListener("click", closeRegionModal);
regionOverlay?.addEventListener("click", closeRegionModal);
newRegionForm?.addEventListener("submit", handleCreateRegion);

// Assign Member Modal Events
openAssignBtn?.addEventListener("click", openAssignModal);
closeAssignBtn?.addEventListener("click", closeAssignModal);
cancelAssignBtn?.addEventListener("click", closeAssignModal);
assignOverlay?.addEventListener("click", closeAssignModal);
assignMemberForm?.addEventListener("submit", handleAssignMember);

// Tree click handler (delegation)
tree?.addEventListener("click", event => {
    const expand = event.target.closest("[data-expand-org]");
    if (expand) {
        event.stopPropagation();
        const id = Number(expand.dataset.expandOrg);
        const item = organizations.find(org => Number(org.id) === id);
        if (item) {
            item.expanded = item.expanded === false;
        }
        render();
        return;
    }

    const row = event.target.closest("[data-select-org]");
    if (row) {
        selectedId = Number(row.dataset.selectOrg);
        render();
        renderDetail();
    }
});

/* ==========================================================================
   DATA LOADING
   ========================================================================== */

async function loadOrganizations() {
    try {
        const result = await api("/api/organization/units");
        const oldExpanded = new Map(organizations.map(item => [Number(item.id), item.expanded]));

        organizations = Array.isArray(result.data)
            ? result.data.map(item => ({
                  ...item,
                  id: Number(item.id),
                  parentId: item.parentId == null ? null : Number(item.parentId),
                  managerId: item.managerId == null ? null : Number(item.managerId),
                  memberCount: Number(item.memberCount || 0),
                  expanded: oldExpanded.get(Number(item.id)) ?? true
              }))
            : [];

        if (selectedId && !organizations.some(item => Number(item.id) === Number(selectedId))) {
            selectedId = null;
        }

        render();
        renderDetail();
    } catch (error) {
        console.error("Load organization error:", error);
        if (empty) {
            empty.style.display = "flex";
            empty.textContent = error.message || "Không tải được cơ cấu tổ chức.";
        }
    }
}

async function loadRegions() {
    try {
        const res = await api("/api/organization/regions");
        regions = Array.isArray(res.data) ? res.data : [];
        populateRegionDropdown();
        renderRegionModalList();
    } catch (err) {
        console.error("Load regions error:", err);
    }
}

async function loadUsers() {
    try {
        const res = await api("/api/users");
        users = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        populateManagerDropdown();
    } catch (err) {
        console.error("Load users error:", err);
    }
}

/* ==========================================================================
   TREE RENDERING
   ========================================================================== */

function render() {
    if (!tree) return;
    tree.innerHTML = "";

    const roots = organizations.filter(item => item.parentId == null);

    if (empty) {
        empty.style.display = roots.length ? "none" : "flex";
    }

    for (const root of roots) {
        tree.appendChild(createNode(root));
    }
}

function createNode(item) {
    const wrapper = document.createElement("div");
    wrapper.className = "org-tree-node";

    const children = organizations.filter(child => Number(child.parentId) === Number(item.id));
    const isSelected = Number(selectedId) === Number(item.id);

    const row = document.createElement("div");
    row.className = "org-node-row" + (isSelected ? " selected" : "");
    row.dataset.selectOrg = item.id;

    const expandBtnHtml = `
        <button class="org-expand" type="button" data-expand-org="${item.id}" ${children.length ? "" : "disabled"}>
            ${children.length ? (item.expanded === false ? "›" : "⌄") : ""}
        </button>
    `;

    const tagsHtml = `
        <div class="org-node-tags">
            ${item.region ? `<span class="org-tag-region">📍 ${escapeHtml(item.region)}</span>` : ""}
            ${item.manager ? `<span class="org-tag-manager">👤 ${escapeHtml(item.manager)}</span>` : ""}
            <span class="org-tag-members">👥 ${item.memberCount} NS</span>
        </div>
    `;

    row.innerHTML = `
        ${expandBtnHtml}
        <div class="org-node-icon">
            ${typeIcon(item.type)}
        </div>
        <div class="org-node-copy">
            <strong>${escapeHtml(item.name)}</strong>
            <span>
                ${escapeHtml(item.code || "—")} · ${typeLabel(item.type)}
                ${item.active === false ? " · Ngừng hoạt động" : ""}
            </span>
            ${tagsHtml}
        </div>
    `;

    wrapper.appendChild(row);

    if (children.length && item.expanded !== false) {
        const childrenBox = document.createElement("div");
        childrenBox.className = "org-children";
        for (const child of children) {
            childrenBox.appendChild(createNode(child));
        }
        wrapper.appendChild(childrenBox);
    }

    return wrapper;
}

/* ==========================================================================
   DETAIL VIEW RENDERING
   ========================================================================== */

function renderDetail() {
    const item = organizations.find(org => Number(org.id) === Number(selectedId));

    const emptyDetail = document.getElementById("orgDetailEmpty");
    const detail = document.getElementById("orgDetail");

    if (emptyDetail) emptyDetail.hidden = Boolean(item);
    if (detail) detail.hidden = !item;

    if (!item) return;

    text("detailName", item.name);
    text("detailCode", item.code || "—");
    text("detailManager", item.manager ? `👤 ${item.manager}` : "Chưa chỉ định");
    text("detailDescription", item.description || "—");
    text("detailMemberCount", String(item.memberCount || 0));

    // Region badge
    const regionEl = document.getElementById("detailRegion");
    if (regionEl) {
        if (item.region) {
            regionEl.innerHTML = `<span class="region-badge">📍 ${escapeHtml(item.region)}</span>`;
        } else {
            regionEl.innerHTML = `<span style="color:var(--crm-muted)">Chưa gán khu vực</span>`;
        }
    }

    // Parent name
    const parent = organizations.find(org => Number(org.id) === Number(item.parentId));
    text("detailParent", parent ? parent.name : "Đơn vị gốc (Cao nhất)");
    text("detailType", typeLabel(item.type));

    // SCRUM-47: Data Scope Descendants List
    renderDataScopeDescendants(item.id);

    // SCRUM-47: Load & Render Members List
    loadAndRenderMembers(item.id);
}

function renderDataScopeDescendants(unitId) {
    const container = document.getElementById("scopeDescendantsList");
    if (!container) return;

    const descendants = getDescendants(unitId);

    if (descendants.length === 0) {
        container.innerHTML = `<span class="scope-tag-empty">Không có đơn vị cấp dưới trực thuộc (phạm vi xem chỉ trong nhóm này).</span>`;
    } else {
        container.innerHTML = descendants
            .map(
                d => `<span class="scope-tag-item">🏢 ${escapeHtml(d.name)} (${escapeHtml(d.code || "—")})</span>`
            )
            .join("");
    }
}

function getDescendants(parentId) {
    const results = [];
    const queue = [parentId];

    while (queue.length > 0) {
        const currId = queue.shift();
        const children = organizations.filter(org => Number(org.parentId) === Number(currId));
        for (const child of children) {
            results.push(child);
            queue.push(child.id);
        }
    }
    return results;
}

async function loadAndRenderMembers(unitId) {
    const listEl = document.getElementById("membersList");
    const countBadge = document.getElementById("detailMemberCountBadge");
    if (!listEl) return;

    listEl.innerHTML = `<div style="padding:10px;text-align:center;color:var(--crm-muted)">Đang tải nhân viên...</div>`;

    try {
        const res = await api(`/api/organization/units/${unitId}/members`);
        const members = Array.isArray(res.data) ? res.data : [];

        if (countBadge) countBadge.textContent = String(members.length);

        if (members.length === 0) {
            listEl.innerHTML = `
                <div class="empty-members">
                    Chưa có nhân viên nào trong nhóm này.<br>
                    Bấm <strong>+ Gán nhân viên</strong> ở trên để thêm nhân viên vào nhóm.
                </div>
            `;
            return;
        }

        listEl.innerHTML = members
            .map(m => {
                const initial = (m.fullName || "U").trim().charAt(0).toUpperCase();
                const roleText = m.roles || m.dataScope || "Thành viên";
                return `
                    <div class="member-card">
                        <div class="member-info">
                            <div class="member-avatar">${initial}</div>
                            <div class="member-details">
                                <div class="member-name">
                                    ${escapeHtml(m.fullName)}
                                    <span class="member-role-badge">${escapeHtml(roleText)}</span>
                                </div>
                                <div class="member-email">${escapeHtml(m.email)} ${m.phone ? "· " + escapeHtml(m.phone) : ""}</div>
                            </div>
                        </div>
                        <button class="btn-remove-member" type="button" title="Gỡ nhân viên khỏi nhóm" onclick="handleRemoveMember(${unitId}, ${m.id}, '${escapeHtml(m.fullName)}')">
                            Gỡ khỏi nhóm
                        </button>
                    </div>
                `;
            })
            .join("");
    } catch (err) {
        console.error("Load members error:", err);
        listEl.innerHTML = `<div class="empty-members" style="color:var(--crm-danger)">Không thể tải nhân viên: ${escapeHtml(err.message)}</div>`;
    }
}

// Global handler for removing member
window.handleRemoveMember = async function (unitId, userId, memberName) {
    if (!confirm(`Xác nhận gỡ nhân viên "${memberName}" khỏi nhóm này?`)) {
        return;
    }

    try {
        await api(`/api/organization/units/${unitId}/members/${userId}`, { method: "DELETE" });
        await loadOrganizations();
        await loadAndRenderMembers(unitId);
    } catch (err) {
        alert(err.message || "Không thể gỡ nhân viên khỏi nhóm.");
    }
};

/* ==========================================================================
   DRAWER (ADD / EDIT UNIT)
   ========================================================================== */

function populateRegionDropdown() {
    const select = document.getElementById("orgRegion");
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = `<option value="">-- Chưa gán khu vực --</option>`;

    for (const reg of regions) {
        const opt = document.createElement("option");
        opt.value = reg.name;
        opt.textContent = `${reg.name} (${reg.code})`;
        select.appendChild(opt);
    }

    if (currentVal) select.value = currentVal;
}

function populateManagerDropdown() {
    const select = document.getElementById("orgManager");
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = `<option value="">-- Chưa chỉ định --</option>`;

    for (const u of users) {
        const opt = document.createElement("option");
        opt.value = String(u.id);
        opt.textContent = `${u.fullName} (${u.email})`;
        select.appendChild(opt);
    }

    if (currentVal) select.value = currentVal;
}

function openDrawer(editingId = null, parentId = null) {
    document.getElementById("orgForm")?.reset();
    setValue("editingOrgId", "");
    setValue("parentOrgId", parentId ?? "");

    const error = document.getElementById("orgFormError");
    if (error) error.textContent = "";

    populateRegionDropdown();
    populateManagerDropdown();

    const title = document.getElementById("orgDrawerTitle");
    if (title) {
        if (editingId) {
            title.textContent = "Sửa đơn vị tổ chức";
        } else if (parentId) {
            const parent = organizations.find(o => Number(o.id) === Number(parentId));
            title.textContent = parent ? `Thêm đơn vị con vào "${parent.name}"` : "Thêm đơn vị con";
        } else {
            title.textContent = "Thêm đơn vị gốc";
        }
    }

    if (editingId !== null) {
        const item = organizations.find(org => Number(org.id) === Number(editingId));
        if (item) {
            setValue("editingOrgId", item.id);
            setValue("parentOrgId", item.parentId ?? "");
            setValue("orgCode", item.code || "");
            setValue("orgName", item.name || "");
            setValue("orgType", item.type || "sales-team");
            setValue("orgRegion", item.region || "");
            setValue("orgManager", item.managerId ? String(item.managerId) : "");
            setValue("orgDescription", item.description || "");
        }
    }

    drawer?.classList.add("open");
    overlay?.classList.add("open");
}

function closeDrawer() {
    drawer?.classList.remove("open");
    overlay?.classList.remove("open");
}

async function handleOrgSubmit(event) {
    event.preventDefault();
    const error = document.getElementById("orgFormError");
    if (error) error.textContent = "";

    const code = value("orgCode");
    const name = value("orgName");

    if (!code || !name) {
        if (error) error.textContent = "Mã đơn vị và tên đơn vị là bắt buộc.";
        return;
    }

    const editingId = value("editingOrgId");
    const parentIdValue = value("parentOrgId");
    const managerValue = value("orgManager");
    const regionValue = value("orgRegion");

    const existing = organizations.find(item => Number(item.id) === Number(editingId));

    const body = {
        code,
        name,
        type: value("orgType") || "sales-team",
        parentId: parentIdValue ? Number(parentIdValue) : null,
        managerId: parseManagerId(managerValue),
        region: regionValue || null,
        description: value("orgDescription"),
        active: existing ? existing.active !== false : true
    };

    try {
        let result;
        if (editingId) {
            result = await api(`/api/organization/units/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(body)
            });
        } else {
            result = await api("/api/organization/units", {
                method: "POST",
                body: JSON.stringify(body)
            });
        }

        selectedId = Number(result.data.id);
        closeDrawer();
        await loadOrganizations();
    } catch (apiError) {
        if (error) error.textContent = apiError.message || "Không thể lưu đơn vị.";
    }
}

async function handleDeleteOrg() {
    if (!selectedId) return;

    const item = organizations.find(org => Number(org.id) === Number(selectedId));
    if (!item) return;

    const hasChildren = organizations.some(org => Number(org.parentId) === Number(selectedId));
    if (hasChildren) {
        alert("Không thể xóa đơn vị đang có đơn vị con trực thuộc. Vui lòng xóa hoặc di chuyển các đơn vị con trước.");
        return;
    }

    if (item.memberCount > 0) {
        alert(`Không thể xóa đơn vị này vì đang có ${item.memberCount} nhân viên trực thuộc. Vui lòng gỡ hoặc chuyển nhân viên sang nhóm khác trước.`);
        return;
    }

    if (!confirm(`Xác nhận xóa vĩnh viễn đơn vị "${item.name}"?`)) {
        return;
    }

    try {
        await api(`/api/organization/units/${item.id}`, { method: "DELETE" });
        selectedId = null;
        await loadOrganizations();
    } catch (error) {
        alert(error.message || "Không thể xóa đơn vị.");
    }
}

/* ==========================================================================
   MODAL 1: REGION DECLARATION (SCRUM-47)
   ========================================================================== */

function openRegionModal() {
    renderRegionModalList();
    const err = document.getElementById("regionFormError");
    if (err) err.textContent = "";
    document.getElementById("newRegionForm")?.reset();

    regionModal?.classList.add("open");
    regionOverlay?.classList.add("open");
}

function closeRegionModal() {
    regionModal?.classList.remove("open");
    regionOverlay?.classList.remove("open");
}

function renderRegionModalList() {
    const container = document.getElementById("regionListContainer");
    if (!container) return;

    if (regions.length === 0) {
        container.innerHTML = `<span style="color:var(--crm-muted);font-size:12px">Chưa có khu vực nào được khai báo.</span>`;
        return;
    }

    container.innerHTML = regions
        .map(
            r => `
            <div class="region-tag-item">
                <span>📍</span>
                <strong>${escapeHtml(r.name)}</strong>
                <small style="color:var(--crm-muted)">[${escapeHtml(r.code)}]</small>
            </div>
        `
        )
        .join("");
}

async function handleCreateRegion(event) {
    event.preventDefault();
    const err = document.getElementById("regionFormError");
    if (err) err.textContent = "";

    const code = value("newRegionCode");
    const name = value("newRegionName");

    if (!code || !name) {
        if (err) err.textContent = "Mã và tên khu vực là bắt buộc.";
        return;
    }

    try {
        await api("/api/organization/regions", {
            method: "POST",
            body: JSON.stringify({ code: code.toUpperCase(), name })
        });

        document.getElementById("newRegionForm")?.reset();
        await loadRegions();
    } catch (e) {
        if (err) err.textContent = e.message || "Không thể thêm khu vực.";
    }
}

/* ==========================================================================
   MODAL 2: ASSIGN MEMBER TO TEAM (SCRUM-47)
   ========================================================================== */

async function openAssignModal() {
    if (!selectedId) return;

    const item = organizations.find(org => Number(org.id) === Number(selectedId));
    if (!item) return;

    text("assignTargetName", item.name);

    const err = document.getElementById("assignFormError");
    if (err) err.textContent = "";

    // Refresh users list
    await loadUsers();

    const select = document.getElementById("assignUserSelect");
    if (select) {
        select.innerHTML = `<option value="">-- Chọn nhân viên kinh doanh --</option>`;
        for (const u of users) {
            const opt = document.createElement("option");
            opt.value = String(u.id);

            let statusHint = "";
            if (Number(u.teamId) === Number(selectedId)) {
                statusHint = " [Đã ở nhóm này]";
                opt.disabled = true;
            } else if (u.teamName) {
                statusHint = ` [Đang ở: ${u.teamName} - sẽ chuyển sang nhóm này]`;
            } else {
                statusHint = " [Chưa thuộc nhóm nào]";
            }

            opt.textContent = `${u.fullName} (${u.email})${statusHint}`;
            select.appendChild(opt);
        }
    }

    assignModal?.classList.add("open");
    assignOverlay?.classList.add("open");
}

function closeAssignModal() {
    assignModal?.classList.remove("open");
    assignOverlay?.classList.remove("open");
}

async function handleAssignMember(event) {
    event.preventDefault();
    const err = document.getElementById("assignFormError");
    if (err) err.textContent = "";

    const userSelect = document.getElementById("assignUserSelect");
    const userId = userSelect?.value;

    if (!userId) {
        if (err) err.textContent = "Vui lòng chọn nhân viên cần gán.";
        return;
    }

    try {
        await api(`/api/organization/units/${selectedId}/members`, {
            method: "POST",
            body: JSON.stringify({ userId: Number(userId) })
        });

        closeAssignModal();
        await loadOrganizations();
        await loadAndRenderMembers(selectedId);
    } catch (e) {
        if (err) err.textContent = e.message || "Không thể gán nhân viên vào nhóm.";
    }
}

/* ==========================================================================
   HELPERS & UTILITIES
   ========================================================================== */

async function api(path, options = {}) {
    const response = await fetch(API_BASE + path, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    let json = null;
    try {
        json = await response.json();
    } catch {
        json = null;
    }

    if (!response.ok) {
        throw new Error(json?.message || `HTTP ${response.status}`);
    }

    return json;
}

function parseManagerId(val) {
    if (!val) return null;
    const num = Number(val);
    return Number.isInteger(num) && num > 0 ? num : null;
}

function typeLabel(type) {
    switch (type) {
        case "sales-team":
            return "Nhóm kinh doanh";
        case "division":
            return "Khối / Bộ phận";
        default:
            return "Phòng ban";
    }
}

function typeIcon(type) {
    switch (type) {
        case "sales-team":
            return "♟";
        case "division":
            return "◦";
        default:
            return "⌂";
    }
}

function value(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
}

function setValue(id, newValue) {
    const element = document.getElementById(id);
    if (element) {
        element.value = newValue ?? "";
    }
}

function text(id, newValue) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = newValue;
    }
}

function escapeHtml(val) {
    return String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

(async function init() {
    await Promise.all([loadRegions(), loadUsers()]);
    await loadOrganizations();
})();