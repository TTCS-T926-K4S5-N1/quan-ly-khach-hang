"use strict";

const API_BASE = "http://localhost:8080/crm";

let records = [];
let duplicatePairs = [];
let currentUserRoles = [];
let isTeamLeadOrAbove = false;
let currentComparison = null;

const tableBody = document.getElementById("customerTableBody");
const desktopEmpty = document.getElementById("customerEmpty");
const mobileList = document.getElementById("customerMobileList");
const drawer = document.getElementById("customerDrawer");
const drawerOverlay = document.getElementById("customerDrawerOverlay");
const openDrawerButton = document.getElementById("openCustomerDrawer");
const closeDrawerButton = document.getElementById("closeCustomerDrawer");
const cancelButton = document.getElementById("cancelCustomer");
const form = document.getElementById("customerForm");
const searchInput = document.getElementById("customerSearch");
const statusFilter = document.getElementById("statusFilter");

// Duplicate elements
const btnDuplicateAlerts = document.getElementById("btnDuplicateAlerts");
const dupCountBadge = document.getElementById("dupCountBadge");
const duplicatesModal = document.getElementById("duplicatesModal");
const duplicatesModalOverlay = document.getElementById("duplicatesModalOverlay");
const closeDuplicatesModal = document.getElementById("closeDuplicatesModal");
const duplicatesListContainer = document.getElementById("duplicatesListContainer");
const duplicatesEmptyState = document.getElementById("duplicatesEmptyState");

// Comparison / Merge elements
const comparisonModal = document.getElementById("comparisonModal");
const comparisonModalOverlay = document.getElementById("comparisonModalOverlay");
const closeComparisonModal = document.getElementById("closeComparisonModal");
const btnCancelMerge = document.getElementById("btnCancelMerge");
const btnConfirmMerge = document.getElementById("btnConfirmMerge");
const btnSwapSides = document.getElementById("btnSwapSides");
const mergeRoleWarning = document.getElementById("mergeRoleWarning");

// Drawer Duplicate Alert elements
const drawerDuplicateAlert = document.getElementById("drawerDuplicateAlert");
const drawerDupDesc = document.getElementById("drawerDupDesc");
const btnDrawerOpenCompare = document.getElementById("btnDrawerOpenCompare");

let searchDebounceTimer = null;
let dupCheckDebounceTimer = null;

/* =========================================================
   API CLIENT
========================================================= */
async function api(path, options = {}) {
    const config = {
        credentials: "include",
        headers: {
            "Accept": "application/json",
            ...(options.body ? { "Content-Type": "application/json; charset=utf-8" } : {}),
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
   AUTH & ROLE INITIALIZATION
========================================================= */
async function initUserProfile() {
    try {
        const profile = await api("/api/profile");
        if (profile) {
            const roleNames = (profile.roleNames || "").toUpperCase();
            currentUserRoles = (profile.roles || []).map(r => String(r).toUpperCase());

            // Kiểm tra quyền: Chỉ Trưởng nhóm trở lên được thực hiện gộp
            isTeamLeadOrAbove = currentUserRoles.some(r =>
                ["ADMIN", "DIRECTOR", "TEAM_LEAD", "MANAGER"].includes(r)
            ) || roleNames.includes("TRƯỞNG NHÓM") || roleNames.includes("GIÁM ĐỐC") || roleNames.includes("QUẢN TRỊ");
        }
    } catch (e) {
        console.warn("Could not load user profile:", e);
    }
}

/* =========================================================
   DUPLICATES LIST & NOTIFICATIONS
========================================================= */
async function loadDuplicatePairs() {
    try {
        const data = await api("/api/customers/duplicates");
        duplicatePairs = Array.isArray(data) ? data : [];

        if (duplicatePairs.length > 0) {
            if (btnDuplicateAlerts) {
                btnDuplicateAlerts.style.display = "inline-flex";
                if (dupCountBadge) dupCountBadge.textContent = duplicatePairs.length;
            }
        } else {
            if (btnDuplicateAlerts) btnDuplicateAlerts.style.display = "none";
        }

        renderDuplicatesList();
    } catch (e) {
        console.warn("Could not load duplicate pairs:", e);
    }
}

function renderDuplicatesList() {
    if (!duplicatesListContainer) return;
    duplicatesListContainer.innerHTML = "";

    if (!duplicatePairs || duplicatePairs.length === 0) {
        if (duplicatesEmptyState) duplicatesEmptyState.style.display = "flex";
        return;
    }

    if (duplicatesEmptyState) duplicatesEmptyState.style.display = "none";

    duplicatePairs.forEach(pair => {
        const c1 = pair.masterCandidate;
        const c2 = pair.duplicateCandidate;

        const card = document.createElement("div");
        card.className = "dup-pair-card";

        const reasonsHtml = (pair.reasons || []).map(r =>
            `<span class="dup-reason-badge">⚠️ ${escapeHtml(r)}</span>`
        ).join("");

        card.innerHTML = `
            <div class="dup-pair-head">
                <div class="dup-reasons">
                    ${reasonsHtml}
                    <span class="dup-reason-badge" style="background:#dcfce7; color:#15803d;">Độ khớp: ${pair.confidence || 90}%</span>
                </div>
                <button type="button" class="crm-btn crm-btn-primary" style="font-size:12px; padding:5px 12px; background:#d97706; border-color:#d97706;" data-compare-id1="${c1.id}" data-compare-id2="${c2.id}">
                    🔍 So sánh cạnh nhau & Gộp
                </button>
            </div>
            <div class="dup-pair-columns">
                <div class="dup-candidate-info">
                    <h4>👑 ${escapeHtml(c1.name)} (Mã: #${c1.id})</h4>
                    <div class="dup-candidate-meta">
                        <span><strong>MST:</strong> ${escapeHtml(c1.taxCode || "—")}</span>
                        <span><strong>Website:</strong> ${escapeHtml(c1.website || "—")}</span>
                        <span><strong>Phụ trách:</strong> ${escapeHtml(c1.ownerName || "Chưa rõ")}</span>
                        <span><strong>Dữ liệu:</strong> ${c1.contactsCount || 0} liên hệ · ${c1.opportunitiesCount || 0} cơ hội · ${c1.activitiesCount || 0} hoạt động</span>
                    </div>
                </div>
                <div class="dup-candidate-info" style="border-left:1px dashed var(--crm-border); padding-left:14px;">
                    <h4>⚠️ ${escapeHtml(c2.name)} (Mã: #${c2.id})</h4>
                    <div class="dup-candidate-meta">
                        <span><strong>MST:</strong> ${escapeHtml(c2.taxCode || "—")}</span>
                        <span><strong>Website:</strong> ${escapeHtml(c2.website || "—")}</span>
                        <span><strong>Phụ trách:</strong> ${escapeHtml(c2.ownerName || "Chưa rõ")}</span>
                        <span><strong>Dữ liệu:</strong> ${c2.contactsCount || 0} liên hệ · ${c2.opportunitiesCount || 0} cơ hội · ${c2.activitiesCount || 0} hoạt động</span>
                    </div>
                </div>
            </div>
        `;
        duplicatesListContainer.appendChild(card);
    });
}

function openDuplicatesModal() {
    duplicatesModal?.classList.add("open");
    duplicatesModalOverlay?.classList.add("open");
}

function closeDuplicatesModalFunc() {
    duplicatesModal?.classList.remove("open");
    duplicatesModalOverlay?.classList.remove("open");
}

btnDuplicateAlerts?.addEventListener("click", openDuplicatesModal);
closeDuplicatesModal?.addEventListener("click", closeDuplicatesModalFunc);
duplicatesModalOverlay?.addEventListener("click", closeDuplicatesModalFunc);

/* =========================================================
   SIDE-BY-SIDE COMPARISON & MERGE LOGIC
========================================================= */
async function openComparison(id1, id2) {
    try {
        const comp = await api(`/api/customers/compare?id1=${id1}&id2=${id2}`);
        if (!comp) return;

        currentComparison = {
            masterId: id1,
            duplicateId: id2,
            data: comp
        };

        renderComparisonModal();

        closeDuplicatesModalFunc();
        comparisonModal?.classList.add("open");
        comparisonModalOverlay?.classList.add("open");
    } catch (err) {
        alert("Lỗi tải dữ liệu so sánh khách hàng: " + err.message);
    }
}

function renderComparisonModal() {
    if (!currentComparison || !currentComparison.data) return;

    const c1 = currentComparison.data.customer1;
    const c2 = currentComparison.data.customer2;

    // Điểm trùng khớp
    const pointsText = document.getElementById("matchPointsText");
    if (pointsText) {
        pointsText.textContent = (currentComparison.data.matchPoints || []).join(" | ") || "Trùng khớp thông tin doanh nghiệp";
    }

    // Cột Trái: Master
    writeVal("masterCustId", `#${c1.id}`);
    writeVal("masterName", c1.name);
    writeVal("masterTax", c1.taxCode);
    writeVal("masterWeb", c1.website);
    writeVal("masterContact", `${c1.phone || "—"} / ${c1.email || "—"}`);
    writeVal("masterAddress", c1.address);
    writeVal("masterOwner", c1.ownerName || "Chưa phân công");
    writeVal("masterCntContacts", c1.contactsCount || 0);
    writeVal("masterCntOpps", c1.opportunitiesCount || 0);
    writeVal("masterCntActs", c1.activitiesCount || 0);

    // Cột Phải: Duplicate
    writeVal("dupCustId", `#${c2.id}`);
    writeVal("dupName", c2.name);
    writeVal("dupTax", c2.taxCode);
    writeVal("dupWeb", c2.website);
    writeVal("dupContact", `${c2.phone || "—"} / ${c2.email || "—"}`);
    writeVal("dupAddress", c2.address);
    writeVal("dupOwner", c2.ownerName || "Chưa phân công");
    writeVal("dupCntContacts", c2.contactsCount || 0);
    writeVal("dupCntOpps", c2.opportunitiesCount || 0);
    writeVal("dupCntActs", c2.activitiesCount || 0);

    // Tổng hợp sau khi gộp (giữ lại toàn bộ)
    const sumContacts = (c1.contactsCount || 0) + (c2.contactsCount || 0);
    const sumOpps = (c1.opportunitiesCount || 0) + (c2.opportunitiesCount || 0);
    const sumActs = (c1.activitiesCount || 0) + (c2.activitiesCount || 0) + 1; // +1 system note
    const sumAtts = (c1.attachmentsCount || 0) + (c2.attachmentsCount || 0);

    writeVal("summarySumContacts", `${sumContacts} người liên hệ (${c1.contactsCount || 0} + ${c2.contactsCount || 0})`);
    writeVal("summarySumOpps", `${sumOpps} cơ hội bán hàng (${c1.opportunitiesCount || 0} + ${c2.opportunitiesCount || 0})`);
    writeVal("summarySumActs", `${sumActs} hoạt động tương tác (${c1.activitiesCount || 0} + ${c2.activitiesCount || 0} + 1 log gộp)`);
    writeVal("summarySumAtts", `${sumAtts} tệp đính kèm (${c1.attachmentsCount || 0} + ${c2.attachmentsCount || 0})`);

    // Kiểm tra quyền hạn: Chỉ Trưởng nhóm trở lên được thực hiện gộp
    if (mergeRoleWarning && btnConfirmMerge) {
        if (isTeamLeadOrAbove) {
            mergeRoleWarning.style.display = "none";
            btnConfirmMerge.disabled = false;
            btnConfirmMerge.title = "Xác nhận gộp toàn bộ dữ liệu vào bản ghi chính";
        } else {
            mergeRoleWarning.style.display = "flex";
            btnConfirmMerge.disabled = true;
            btnConfirmMerge.title = "Chỉ Trưởng nhóm kinh doanh trở lên mới có quyền thực hiện gộp";
        }
    }
}

function closeComparisonModalFunc() {
    comparisonModal?.classList.remove("open");
    comparisonModalOverlay?.classList.remove("open");
    currentComparison = null;
}

closeComparisonModal?.addEventListener("click", closeComparisonModalFunc);
btnCancelMerge?.addEventListener("click", closeComparisonModalFunc);
comparisonModalOverlay?.addEventListener("click", closeComparisonModalFunc);

// Nút Đổi bản ghi chính (Swap Master & Duplicate)
btnSwapSides?.addEventListener("click", () => {
    if (!currentComparison) return;
    const temp = currentComparison.masterId;
    currentComparison.masterId = currentComparison.duplicateId;
    currentComparison.duplicateId = temp;

    // Swap data object
    const tempData = currentComparison.data.customer1;
    currentComparison.data.customer1 = currentComparison.data.customer2;
    currentComparison.data.customer2 = tempData;

    renderComparisonModal();
});

// Xác nhận gộp khách hàng
btnConfirmMerge?.addEventListener("click", async () => {
    if (!currentComparison) return;

    if (!isTeamLeadOrAbove) {
        alert("Chỉ Trưởng nhóm kinh doanh trở lên mới có quyền thực hiện gộp khách hàng.");
        return;
    }

    const masterName = currentComparison.data.customer1.name;
    const dupName = currentComparison.data.customer2.name;

    const ok = window.confirm(
        `XÁC NHẬN GỘP KHÁCH HÀNG:\n\n` +
        `• Bản ghi chính GIỮ LẠI: "${masterName}" (#${currentComparison.masterId})\n` +
        `• Bản ghi trùng SẼ GỘP: "${dupName}" (#${currentComparison.duplicateId})\n\n` +
        `Toàn bộ người liên hệ, cơ hội và dòng thời gian hoạt động của cả hai sẽ được lưu giữ trọn vẹn.\n\n` +
        `Bạn có chắc chắn muốn tiến hành?`
    );

    if (!ok) return;

    btnConfirmMerge.disabled = true;
    btnConfirmMerge.textContent = "Đang thực hiện gộp...";

    try {
        const res = await api("/api/customers/merge", {
            method: "POST",
            body: JSON.stringify({
                masterId: currentComparison.masterId,
                duplicateId: currentComparison.duplicateId
            })
        });

        alert(
            `🎉 GỘP KHÁCH HÀNG THÀNH CÔNG!\n\n` +
            `Đã chuyển toàn bộ:\n` +
            `• ${res.contactsMerged || 0} người liên hệ\n` +
            `• ${res.opportunitiesMerged || 0} cơ hội bán hàng\n` +
            `• ${res.activitiesMerged || 0} hoạt động tương tác\n` +
            `• ${res.attachmentsMerged || 0} tệp đính kèm\n` +
            `vào khách hàng "${masterName}". Bản ghi trùng đã được xử lý.`
        );

        closeComparisonModalFunc();
        await loadCustomers();
        await loadDuplicatePairs();
    } catch (err) {
        alert("Lỗi khi gộp khách hàng: " + err.message);
    } finally {
        if (btnConfirmMerge) {
            btnConfirmMerge.disabled = !isTeamLeadOrAbove;
            btnConfirmMerge.textContent = "✅ Xác nhận gộp khách hàng";
        }
    }
});

// Event delegation cho nút So sánh & Gộp trong modal duplicates
document.addEventListener("click", event => {
    const compareBtn = event.target.closest("[data-compare-id1]");
    if (compareBtn) {
        const id1 = Number(compareBtn.dataset.compareId1);
        const id2 = Number(compareBtn.dataset.compareId2);
        openComparison(id1, id2);
    }
});

/* =========================================================
   REAL-TIME DUPLICATE DETECTION TRONG DRAWER
========================================================= */
function checkDrawerDuplicateRealtime() {
    clearTimeout(dupCheckDebounceTimer);
    dupCheckDebounceTimer = setTimeout(async () => {
        const name = value("companyName");
        const taxCode = value("taxCode");
        const website = value("website");

        if (!name && !taxCode && !website) {
            if (drawerDuplicateAlert) drawerDuplicateAlert.style.display = "none";
            return;
        }

        const editingIndex = document.getElementById("editingIndex").value;
        let excludeId = "";
        if (editingIndex !== "" && records[Number(editingIndex)]) {
            excludeId = records[Number(editingIndex)].id;
        }

        try {
            const url = `/api/customers/check-duplicate?name=${encodeURIComponent(name)}&taxCode=${encodeURIComponent(taxCode)}&website=${encodeURIComponent(website)}&excludeId=${excludeId}`;
            const dupes = await api(url);

            if (Array.isArray(dupes) && dupes.length > 0) {
                const first = dupes[0];
                if (drawerDuplicateAlert) drawerDuplicateAlert.style.display = "block";
                if (drawerDupDesc) {
                    drawerDupDesc.innerHTML = `
                        Đã có khách hàng <strong>${escapeHtml(first.name)}</strong> (MST: ${escapeHtml(first.taxCode || "—")}, Website: ${escapeHtml(first.website || "—")}) do nhân viên <strong>${escapeHtml(first.ownerName || "Chưa rõ")}</strong> phụ trách.<br>
                        <em>Lý do trùng: ${escapeHtml((first.matchReasons || []).join(", "))}</em>
                    `;
                }

                if (btnDrawerOpenCompare) {
                    btnDrawerOpenCompare.onclick = () => {
                        if (excludeId) {
                            openComparison(Number(excludeId), Number(first.id));
                        } else {
                            // Chuyển sang xem khách hàng trùng hoặc so sánh
                            window.location.href = `customer-360?id=${first.id}`;
                        }
                    };
                }
            } else {
                if (drawerDuplicateAlert) drawerDuplicateAlert.style.display = "none";
            }
        } catch (e) {
            console.warn("Real-time duplicate check error:", e);
        }
    }, 400);
}

document.getElementById("companyName")?.addEventListener("input", checkDrawerDuplicateRealtime);
document.getElementById("taxCode")?.addEventListener("input", checkDrawerDuplicateRealtime);
document.getElementById("website")?.addEventListener("input", checkDrawerDuplicateRealtime);

/* =========================================================
   STANDARD CUSTOMER MANAGEMENT
========================================================= */
openDrawerButton?.addEventListener("click", () => openDrawer());
closeDrawerButton?.addEventListener("click", closeDrawer);
cancelButton?.addEventListener("click", closeDrawer);
drawerOverlay?.addEventListener("click", closeDrawer);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeDrawer();
        closeDuplicatesModalFunc();
        closeComparisonModalFunc();
    }
});

form?.addEventListener("submit", async event => {
    event.preventDefault();

    const companyName = value("companyName");
    const error = document.getElementById("companyNameError");

    if (!companyName) {
        error.textContent = "Vui lòng nhập tên công ty.";
        return;
    }

    error.textContent = "";

    const payload = {
        companyName,
        name: companyName,
        taxCode: value("taxCode"),
        status: value("customerStatus") || "TIEM_NANG",
        email: value("customerEmail"),
        phone: value("customerPhone"),
        industryId: value("industry") ? Number(value("industry")) : null,
        companySizeId: value("companySize") ? Number(value("companySize")) : null,
        website: value("website"),
        address: value("address")
    };

    const editingIndex = document.getElementById("editingIndex").value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang lưu...";
    }

    try {
        if (editingIndex === "") {
            await api("/api/customers", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        } else {
            const currentRecord = records[Number(editingIndex)];
            if (currentRecord?.id) {
                await api(`/api/customers/${currentRecord.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
            }
        }

        closeDrawer();
        await loadCustomers();
        await loadDuplicatePairs();
    } catch (err) {
        alert(err.message || "Không thể lưu thông tin khách hàng.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
});

searchInput?.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        loadCustomers();
    }, 300);
});

statusFilter?.addEventListener("change", () => {
    loadCustomers();
});

async function loadCustomers() {
    try {
        const query = searchInput ? searchInput.value.trim() : "";
        const status = statusFilter ? statusFilter.value : "";
        let url = `/api/customers?size=100`;
        if (query) url += `&keyword=${encodeURIComponent(query)}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;

        const data = await api(url);
        records = data?.items || [];
        render();
    } catch (error) {
        console.error("Lỗi tải danh sách khách hàng:", error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">${escapeHtml(error.message)}</td></tr>`;
    }
}

function render() {
    tableBody.innerHTML = "";
    mobileList.innerHTML = "";

    desktopEmpty.style.display = records.length ? "none" : "flex";

    if (!records.length) {
        const empty = document.createElement("div");
        empty.className = "customer-mobile-empty";
        empty.textContent = "Không có bản ghi phù hợp.";
        mobileList.appendChild(empty);
        return;
    }

    for (let index = 0; index < records.length; index++) {
        const record = records[index];
        renderDesktopRow(record, index);
        renderMobileCard(record, index);
    }
}

function renderDesktopRow(record, index) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>
            <input type="checkbox">
        </td>
        <td>
            <a class="customer-name" href="customer-360?id=${record.id}">
                ${escapeHtml(record.companyName || record.name)}
            </a>
            <span class="customer-sub">
                ${escapeHtml(record.taxCode || "—")}
            </span>
        </td>
        <td>
            ${escapeHtml(record.email || "—")}
            <span class="customer-sub">
                ${escapeHtml(record.phone || "—")}
            </span>
        </td>
        <td>
            <span class="status-pill ${statusClass(record.status)}">
                ${escapeHtml(record.status)}
            </span>
        </td>
        <td>
            ${escapeHtml(record.ownerName || record.owner || "—")}
        </td>
        <td class="action-col">
            <div class="row-action-wrap">
                <button class="row-action-button" type="button" data-action-menu="${index}">
                    ⋮
                </button>
                <div class="row-action-menu" data-menu="${index}">
                    <a href="customer-360?id=${record.id}">
                        Xem chi tiết (360)
                    </a>
                    <button type="button" data-edit="${index}">
                        Sửa
                    </button>
                    <button type="button" class="danger" data-delete="${index}">
                        Xóa
                    </button>
                </div>
            </div>
        </td>
    `;

    tableBody.appendChild(tr);
}

function renderMobileCard(record, index) {
    const card = document.createElement("article");
    card.className = "customer-mobile-card";

    card.innerHTML = `
        <div class="mobile-card-head">
            <div>
                <strong>
                    ${escapeHtml(record.companyName || record.name)}
                </strong>
                <div style="margin-top:6px">
                    <span class="status-pill ${statusClass(record.status)}">
                        ${escapeHtml(record.status)}
                    </span>
                </div>
            </div>
            <button class="row-action-button" type="button" data-edit="${index}">
                ⋮
            </button>
        </div>
        <div class="mobile-card-contact">
            <span>✉ ${escapeHtml(record.email || "—")}</span>
            <span>☎ ${escapeHtml(record.phone || "—")}</span>
            <span>Người sở hữu: ${escapeHtml(record.ownerName || record.owner || "—")}</span>
        </div>
        <a href="customer-360?id=${record.id}" class="crm-btn crm-btn-secondary" style="margin-top:12px; width:100%; text-decoration:none;">
            Xem chi tiết (360)
        </a>
    `;

    mobileList.appendChild(card);
}

document.addEventListener("click", async event => {
    const actionButton = event.target.closest("[data-action-menu]");
    if (actionButton) {
        const index = actionButton.dataset.actionMenu;
        document.querySelectorAll(".row-action-menu").forEach(menu => {
            if (menu.dataset.menu !== index) {
                menu.classList.remove("open");
            }
        });
        document.querySelector(`[data-menu="${index}"]`)?.classList.toggle("open");
        return;
    }

    const editButton = event.target.closest("[data-edit]");
    if (editButton) {
        openDrawer(Number(editButton.dataset.edit));
        return;
    }

    const deleteButton = event.target.closest("[data-delete]");
    if (deleteButton) {
        const index = Number(deleteButton.dataset.delete);
        const record = records[index];
        if (record && confirm(`Bạn có chắc chắn muốn xóa khách hàng "${record.companyName || record.name}"?`)) {
            try {
                await api(`/api/customers/${record.id}`, { method: "DELETE" });
                await loadCustomers();
                await loadDuplicatePairs();
            } catch (err) {
                alert(err.message || "Không thể xóa khách hàng.");
            }
        }
        return;
    }

    if (!event.target.closest(".row-action-wrap")) {
        document.querySelectorAll(".row-action-menu").forEach(menu => {
            menu.classList.remove("open");
        });
    }
});

function openDrawer(index = null) {
    resetForm();

    if (index !== null && records[index]) {
        const record = records[index];
        document.getElementById("drawerTitle").textContent = "Sửa Khách hàng / Lead";
        document.getElementById("editingIndex").value = String(index);

        setValue("companyName", record.companyName || record.name);
        setValue("taxCode", record.taxCode);
        setValue("customerStatus", record.status);
        setValue("customerEmail", record.email);
        setValue("customerPhone", record.phone);
        setValue("industry", record.industryId || record.industry);
        setValue("companySize", record.companySizeId || record.companySize);
        setValue("website", record.website);
        setValue("address", record.address);
        setValue("owner", record.ownerName || record.owner);
    }

    drawer?.classList.add("open");
    drawerOverlay?.classList.add("open");
}

function closeDrawer() {
    drawer?.classList.remove("open");
    drawerOverlay?.classList.remove("open");
    if (drawerDuplicateAlert) drawerDuplicateAlert.style.display = "none";
}

function resetForm() {
    form?.reset();
    document.getElementById("editingIndex").value = "";
    document.getElementById("drawerTitle").textContent = "Thêm mới Khách hàng / Lead";
    document.getElementById("companyNameError").textContent = "";
    if (drawerDuplicateAlert) drawerDuplicateAlert.style.display = "none";
}

function statusClass(status) {
    switch (status) {
        case "Đang giao dịch":
        case "DANG_GIAO_DICH":
            return "status-dealing";
        case "Khách hàng":
        case "CHINH_THUC":
            return "status-customer";
        case "Ngừng hợp tác":
        case "NGUNG_HOP_TAC":
            return "status-inactive";
        default:
            return "status-prospect";
    }
}

function value(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
}

function writeVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "—";
}

function escapeHtml(val) {
    return String(val || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   INITIALIZATION
========================================================= */
async function init() {
    await initUserProfile();
    await loadCustomers();
    await loadDuplicatePairs();

    // Kiểm tra nếu được redirect từ customer 360 với tham số merge
    const params = new URLSearchParams(window.location.search);
    const mId = params.get("mergeMaster");
    const dId = params.get("mergeDuplicate");
    if (mId && dId) {
        await openComparison(Number(mId), Number(dId));
    }
}

document.addEventListener("DOMContentLoaded", init);
if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
}