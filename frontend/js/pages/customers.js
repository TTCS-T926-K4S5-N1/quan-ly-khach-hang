"use strict";

const API_BASE = (function () {
    if (window.location.port === "8080" || window.location.pathname.startsWith("/crm")) {
        return "/crm";
    }
    return "http://localhost:8080/crm";
})();

let records = [];
let duplicatePairs = [];
let currentUserRoles = [];
let isTeamLeadOrAbove = false;
let currentComparison = null;

// Pagination state
let currentPage = 1;
let pageSize = 10;
let totalItems = 0;
let totalPages = 1;

const customerPagination = document.getElementById("customerPagination");
const custPaginationRange = document.getElementById("custPaginationRange");
const custPageSizeSelect = document.getElementById("custPageSizeSelect");
const custPaginationControls = document.getElementById("custPaginationControls");

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
const contactPhoneFilter = document.getElementById("contactPhoneFilter");
const industryFilter = document.getElementById("industryFilter");
const companySizeFilter = document.getElementById("companySizeFilter");
const regionFilter = document.getElementById("regionFilter");
const ownerFilter = document.getElementById("ownerFilter");
const scoreGradeFilter = document.getElementById("scoreGradeFilter");
const assignmentStatusFilter = document.getElementById("assignmentStatusFilter");
const btnSortByScore = document.getElementById("btnSortByScore");
let isSortByScoreActive = false;
const btnSlaBreachedFilter = document.getElementById("btnSlaBreachedFilter");
let isSlaBreachedActive = false;
const btnResetFilters = document.getElementById("btnResetFilters");
const savedFilterChips = document.getElementById("savedFilterChips");
const filterResultCount = document.getElementById("filterResultCount");
const activeFilterTags = document.getElementById("activeFilterTags");

// Custom Fields state & elements
let customerCustomFields = [];
const btnExportExcel = document.getElementById("btnExportExcel");
const customFieldSelectFilter = document.getElementById("customFieldSelectFilter");
const customFieldValueFilter = document.getElementById("customFieldValueFilter");
const customFieldSelectValueFilter = document.getElementById("customFieldSelectValueFilter");
const customerCustomFieldsSection = document.getElementById("customerCustomFieldsSection");
const customerCustomFieldsContainer = document.getElementById("customerCustomFieldsContainer");

// Save Filter Modal elements
const btnOpenSaveFilterModal = document.getElementById("btnOpenSaveFilterModal");
const saveFilterModal = document.getElementById("saveFilterModal");
const saveFilterModalOverlay = document.getElementById("saveFilterModalOverlay");
const btnCloseSaveFilterModal = document.getElementById("btnCloseSaveFilterModal");
const btnCancelSaveFilter = document.getElementById("btnCancelSaveFilter");
const btnSubmitSaveFilter = document.getElementById("btnSubmitSaveFilter");
const saveFilterNameInput = document.getElementById("saveFilterNameInput");
const saveFilterCriteriaPreview = document.getElementById("saveFilterCriteriaPreview");

let savedFilters = [];
let activeSavedFilterId = null;

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
   CUSTOM FIELDS LOGIC
========================================================= */
async function loadCustomerCustomFields() {
    try {
        const res = await api("/api/custom-fields?entityType=CUSTOMER&active=true");
        customerCustomFields = Array.isArray(res?.data) ? res.data : [];
        populateCustomFieldFilterSelect();
    } catch (e) {
        console.warn("Could not load customer custom fields:", e);
        customerCustomFields = [];
    }
}

function populateCustomFieldFilterSelect() {
    if (!customFieldSelectFilter) return;
    const currentVal = customFieldSelectFilter.value;
    customFieldSelectFilter.innerHTML = '<option value="">✨ Lọc trường tùy chỉnh</option>';
    customerCustomFields.forEach(cf => {
        const opt = document.createElement("option");
        opt.value = cf.key;
        opt.textContent = `${cf.label} (${cf.fieldType})`;
        customFieldSelectFilter.appendChild(opt);
    });
    if (currentVal) customFieldSelectFilter.value = currentVal;
}

function renderCustomerCustomFieldInputs(existingValues = {}) {
    if (!customerCustomFieldsContainer) return;
    customerCustomFieldsContainer.innerHTML = "";

    if (!customerCustomFields || customerCustomFields.length === 0) {
        if (customerCustomFieldsSection) customerCustomFieldsSection.style.display = "none";
        return;
    }

    if (customerCustomFieldsSection) customerCustomFieldsSection.style.display = "block";

    customerCustomFields.forEach(cf => {
        const wrap = document.createElement("div");
        wrap.className = "field-group";
        const val = existingValues[cf.key] !== undefined && existingValues[cf.key] !== null ? String(existingValues[cf.key]) : "";

        let inputHtml = "";
        const requiredAttr = cf.required ? 'data-required="true"' : 'data-required="false"';
        const requiredAsterisk = cf.required ? '<em style="color:#ef4444; font-weight:700;"> *</em>' : '';

        if (cf.fieldType === "TEXT") {
            inputHtml = `<input id="cf_${cf.key}" class="crm-input customer-cf-input" type="text" data-key="${cf.key}" data-label="${escapeHtml(cf.label)}" ${requiredAttr} value="${escapeHtml(val)}" placeholder="Nhập ${escapeHtml(cf.label)}...">`;
        } else if (cf.fieldType === "NUMBER") {
            inputHtml = `<input id="cf_${cf.key}" class="crm-input customer-cf-input" type="number" step="any" data-key="${cf.key}" data-label="${escapeHtml(cf.label)}" ${requiredAttr} value="${escapeHtml(val)}" placeholder="0">`;
        } else if (cf.fieldType === "DATE") {
            inputHtml = `<input id="cf_${cf.key}" class="crm-input customer-cf-input" type="date" data-key="${cf.key}" data-label="${escapeHtml(cf.label)}" ${requiredAttr} value="${escapeHtml(val)}">`;
        } else if (cf.fieldType === "SELECT") {
            const options = Array.isArray(cf.options) ? cf.options : [];
            const optsHtml = options.map(opt => `<option value="${escapeHtml(opt)}" ${opt === val ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join("");
            inputHtml = `<select id="cf_${cf.key}" class="crm-input customer-cf-input" data-key="${cf.key}" data-label="${escapeHtml(cf.label)}" ${requiredAttr}>
                <option value="">-- Chọn ${escapeHtml(cf.label)} --</option>
                ${optsHtml}
            </select>`;
        } else {
            inputHtml = `<input id="cf_${cf.key}" class="crm-input customer-cf-input" type="text" data-key="${cf.key}" data-label="${escapeHtml(cf.label)}" ${requiredAttr} value="${escapeHtml(val)}">`;
        }

        wrap.innerHTML = `
            <label for="cf_${cf.key}" style="font-weight:600; font-size:13px; color:var(--crm-text); margin-bottom:4px; display:block;">
                ${escapeHtml(cf.label)}${requiredAsterisk}
            </label>
            ${inputHtml}
            <small id="cf_err_${cf.key}" class="cf-field-error" style="color:#ef4444; font-size:11px; display:none; margin-top:2px;"></small>
        `;
        customerCustomFieldsContainer.appendChild(wrap);
    });
}

function collectCustomerCustomFields() {
    const customFields = {};
    const inputs = document.querySelectorAll(".customer-cf-input");
    let firstErrorMsg = "";

    document.querySelectorAll(".cf-field-error").forEach(el => { el.style.display = "none"; el.textContent = ""; });

    for (const input of inputs) {
        const key = input.dataset.key;
        const label = input.dataset.label;
        const isRequired = input.dataset.required === "true";
        const val = input.value.trim();

        if (isRequired && !val) {
            const errEl = document.getElementById("cf_err_" + key);
            if (errEl) {
                errEl.textContent = `Vui lòng nhập trường "${label}".`;
                errEl.style.display = "block";
            }
            if (!firstErrorMsg) {
                firstErrorMsg = `Trường tùy chỉnh "${label}" là bắt buộc.`;
                input.focus();
            }
        }

        if (val) {
            customFields[key] = val;
        }
    }

    if (firstErrorMsg) {
        throw new Error(firstErrorMsg);
    }

    return customFields;
}

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

    let customFields = {};
    try {
        customFields = collectCustomerCustomFields();
    } catch (cfErr) {
        alert(cfErr.message);
        return;
    }

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
        address: value("address"),
        customFields
    };

    const editingIndex = document.getElementById("editingIndex").value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang lưu...";
    }

    try {
        const isCreating = editingIndex === "";
        if (isCreating) {
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

        if (isCreating) {
            if (typeof window.crmToast === "function") {
                window.crmToast("Thêm khách hàng thành công!", "success");
            }
            alert("Thêm khách hàng thành công!");
        } else {
            if (typeof window.crmToast === "function") {
                window.crmToast("Cập nhật thông tin khách hàng thành công!", "success");
            }
            alert("Cập nhật thông tin khách hàng thành công!");
        }
    } catch (err) {
        alert(err.message || "Không thể lưu thông tin khách hàng.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
});

/* =========================================================
   SAVED FILTERS & MULTI-CONDITION SEARCH & FILTERING
========================================================= */

async function loadSavedFilters() {
    try {
        const data = await api("/api/saved-filters?module=CUSTOMER");
        savedFilters = Array.isArray(data) ? data : [];
        renderSavedFilterChips();
    } catch (err) {
        console.warn("Không thể tải danh sách bộ lọc đã lưu:", err);
    }
}

function renderSavedFilterChips() {
    if (!savedFilterChips) return;
    savedFilterChips.innerHTML = "";

    // 1. Chip "Tất cả" mặc định
    const allChip = document.createElement("button");
    allChip.type = "button";
    allChip.className = `saved-filter-chip ${activeSavedFilterId === null ? "active" : ""}`;
    allChip.innerHTML = `⭐ Tất cả khách hàng`;
    allChip.addEventListener("click", () => {
        resetAllFilters();
    });
    savedFilterChips.appendChild(allChip);

    // 2. Render các chip từ database (Preset & User saved)
    savedFilters.forEach(f => {
        const chip = document.createElement("button");
        chip.type = "button";
        const isActive = activeSavedFilterId === f.id;
        chip.className = `saved-filter-chip ${isActive ? "active" : ""}`;

        let icon = "🔖";
        if (f.name.includes("gọi") || f.name.includes("tuần")) icon = "📞";
        else if (f.name.includes("lớn") || f.name.includes("quy mô")) icon = "🏢";
        else if (f.name.includes("Hà Nội") || f.name.includes("Miền Bắc") || f.name.includes("khu vực")) icon = "📍";
        else if (f.name.includes("tôi") || f.name.includes("phụ trách")) icon = "👤";

        let deleteBtnHtml = "";
        if (f.canDelete && !f.isPreset) {
            deleteBtnHtml = `<span class="chip-delete" title="Xóa bộ lọc này" data-del-filter="${f.id}">✕</span>`;
        }

        chip.innerHTML = `${icon} ${escapeHtml(f.name)} ${deleteBtnHtml}`;

        chip.addEventListener("click", (e) => {
            if (e.target.closest("[data-del-filter]")) {
                e.stopPropagation();
                deleteSavedFilter(f.id);
                return;
            }
            applySavedFilter(f);
        });

        savedFilterChips.appendChild(chip);
    });
}

function applySavedFilter(filter) {
    if (!filter) return;
    activeSavedFilterId = filter.id;

    let crit = {};
    try {
        crit = typeof filter.filterCriteria === "string" ? JSON.parse(filter.filterCriteria) : filter.filterCriteria;
    } catch (_) {
        crit = {};
    }

    // Điền các giá trị vào inputs & selects
    if (searchInput) searchInput.value = crit.keyword || "";
    if (contactPhoneFilter) contactPhoneFilter.value = crit.contactPhone || "";
    if (statusFilter) statusFilter.value = crit.status || "";
    if (industryFilter) industryFilter.value = crit.industryId ? String(crit.industryId) : "";
    if (companySizeFilter) companySizeFilter.value = crit.companySizeId ? String(crit.companySizeId) : "";
    if (regionFilter) regionFilter.value = crit.regionId ? String(crit.regionId) : "";
    if (ownerFilter) {
        if (crit.ownerFilter) ownerFilter.value = crit.ownerFilter;
        else if (crit.ownerUserId) ownerFilter.value = String(crit.ownerUserId);
        else ownerFilter.value = "";
    }

    renderSavedFilterChips();
    currentPage = 1;
    loadCustomers(1);
}

async function deleteSavedFilter(filterId) {
    if (!confirm("Bạn có chắc chắn muốn xóa bộ lọc đã lưu này?")) return;
    try {
        await api(`/api/saved-filters/${filterId}`, { method: "DELETE" });
        if (activeSavedFilterId === filterId) {
            activeSavedFilterId = null;
        }
        await loadSavedFilters();
    } catch (err) {
        alert("Lỗi khi xóa bộ lọc: " + err.message);
    }
}

function resetAllFilters() {
    activeSavedFilterId = null;
    if (searchInput) searchInput.value = "";
    if (contactPhoneFilter) contactPhoneFilter.value = "";
    if (statusFilter) statusFilter.value = "";
    if (industryFilter) industryFilter.value = "";
    if (companySizeFilter) companySizeFilter.value = "";
    if (regionFilter) regionFilter.value = "";
    if (ownerFilter) ownerFilter.value = "";

    isSlaBreachedActive = false;
    if (btnSlaBreachedFilter) {
        btnSlaBreachedFilter.style.background = "#fef2f2";
        btnSlaBreachedFilter.style.color = "#dc2626";
        btnSlaBreachedFilter.innerHTML = "🚨 Quá SLA phản hồi";
    }

    if (customFieldSelectFilter) customFieldSelectFilter.value = "";
    if (customFieldValueFilter) { customFieldValueFilter.value = ""; customFieldValueFilter.style.display = "none"; }
    if (customFieldSelectValueFilter) { customFieldSelectValueFilter.value = ""; customFieldSelectValueFilter.style.display = "none"; }

    renderSavedFilterChips();
    currentPage = 1;
    loadCustomers(1);
}

function openSaveFilterModal() {
    // Thu thập các điều kiện đang chọn để preview
    const previewItems = [];
    if (searchInput?.value.trim()) previewItems.push(`<strong>Từ khóa:</strong> ${escapeHtml(searchInput.value.trim())}`);
    if (contactPhoneFilter?.value.trim()) previewItems.push(`<strong>SĐT liên hệ:</strong> ${escapeHtml(contactPhoneFilter.value.trim())}`);
    if (statusFilter?.value) previewItems.push(`<strong>Trạng thái:</strong> ${escapeHtml(statusFilter.options[statusFilter.selectedIndex]?.text)}`);
    if (industryFilter?.value) previewItems.push(`<strong>Ngành nghề:</strong> ${escapeHtml(industryFilter.options[industryFilter.selectedIndex]?.text)}`);
    if (companySizeFilter?.value) previewItems.push(`<strong>Quy mô:</strong> ${escapeHtml(companySizeFilter.options[companySizeFilter.selectedIndex]?.text)}`);
    if (regionFilter?.value) previewItems.push(`<strong>Khu vực:</strong> ${escapeHtml(regionFilter.options[regionFilter.selectedIndex]?.text)}`);
    if (ownerFilter?.value) previewItems.push(`<strong>Người sở hữu:</strong> ${escapeHtml(ownerFilter.options[ownerFilter.selectedIndex]?.text)}`);

    if (saveFilterCriteriaPreview) {
        saveFilterCriteriaPreview.innerHTML = previewItems.length > 0
            ? previewItems.join("<br>")
            : "<em>(Đang lưu toàn bộ khách hàng không giới hạn điều kiện)</em>";
    }

    if (saveFilterNameInput) saveFilterNameInput.value = "";
    saveFilterModal?.style.setProperty("display", "block");
    saveFilterModalOverlay?.classList.add("open");
    saveFilterNameInput?.focus();
}

function closeSaveFilterModalFunc() {
    saveFilterModal?.style.setProperty("display", "none");
    saveFilterModalOverlay?.classList.remove("open");
}

async function submitSaveFilterFunc() {
    const name = saveFilterNameInput?.value.trim();
    if (!name) {
        alert("Vui lòng nhập tên cho bộ lọc!");
        saveFilterNameInput?.focus();
        return;
    }

    const criteria = {};
    if (searchInput?.value.trim()) criteria.keyword = searchInput.value.trim();
    if (contactPhoneFilter?.value.trim()) criteria.contactPhone = contactPhoneFilter.value.trim();
    if (statusFilter?.value) criteria.status = statusFilter.value;
    if (industryFilter?.value) criteria.industryId = Number(industryFilter.value);
    if (companySizeFilter?.value) criteria.companySizeId = Number(companySizeFilter.value);
    if (regionFilter?.value) criteria.regionId = Number(regionFilter.value);
    if (ownerFilter?.value) {
        if (ownerFilter.value === "MINE") criteria.ownerFilter = "MINE";
        else criteria.ownerUserId = Number(ownerFilter.value);
    }

    try {
        btnSubmitSaveFilter.disabled = true;
        btnSubmitSaveFilter.textContent = "Đang lưu...";
        const res = await api("/api/saved-filters", {
            method: "POST",
            body: JSON.stringify({
                name: name,
                module: "CUSTOMER",
                filterCriteria: criteria
            })
        });

        closeSaveFilterModalFunc();
        activeSavedFilterId = res?.id || null;
        await loadSavedFilters();
        alert(`Đã lưu thành công bộ lọc "${name}"!`);
    } catch (err) {
        alert("Lỗi khi lưu bộ lọc: " + err.message);
    } finally {
        if (btnSubmitSaveFilter) {
            btnSubmitSaveFilter.disabled = false;
            btnSubmitSaveFilter.textContent = "Lưu bộ lọc";
        }
    }
}

btnOpenSaveFilterModal?.addEventListener("click", openSaveFilterModal);
btnCloseSaveFilterModal?.addEventListener("click", closeSaveFilterModalFunc);
btnCancelSaveFilter?.addEventListener("click", closeSaveFilterModalFunc);
saveFilterModalOverlay?.addEventListener("click", closeSaveFilterModalFunc);
btnSubmitSaveFilter?.addEventListener("click", submitSaveFilterFunc);
btnResetFilters?.addEventListener("click", resetAllFilters);

// Debounced inputs & change events
[searchInput, contactPhoneFilter].forEach(input => {
    input?.addEventListener("input", () => {
        activeSavedFilterId = null;
        renderSavedFilterChips();
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            currentPage = 1;
            loadCustomers(1);
        }, 300);
    });
});

[statusFilter, industryFilter, companySizeFilter, regionFilter, ownerFilter, scoreGradeFilter, assignmentStatusFilter].forEach(select => {
    select?.addEventListener("change", () => {
        activeSavedFilterId = null;
        renderSavedFilterChips();
        currentPage = 1;
        loadCustomers(1);
    });
});

btnSortByScore?.addEventListener("click", () => {
    isSortByScoreActive = !isSortByScoreActive;
    if (isSortByScoreActive) {
        btnSortByScore.style.background = "#dc2626";
        btnSortByScore.style.color = "#ffffff";
        btnSortByScore.innerHTML = "🔥 Đang xếp Lead Hot nhất ▲";
    } else {
        btnSortByScore.style.background = "#fee2e2";
        btnSortByScore.style.color = "#b91c1c";
        btnSortByScore.innerHTML = "🔥 Lead Hot nhất";
    }
    currentPage = 1;
    loadCustomers(1);
});

btnSlaBreachedFilter?.addEventListener("click", () => {
    isSlaBreachedActive = !isSlaBreachedActive;
    if (isSlaBreachedActive) {
        btnSlaBreachedFilter.style.background = "#dc2626";
        btnSlaBreachedFilter.style.color = "#ffffff";
        btnSlaBreachedFilter.innerHTML = "🚨 Đang lọc Quá SLA ▲";
    } else {
        btnSlaBreachedFilter.style.background = "#fef2f2";
        btnSlaBreachedFilter.style.color = "#dc2626";
        btnSlaBreachedFilter.innerHTML = "🚨 Quá SLA phản hồi";
    }
    currentPage = 1;
    loadCustomers(1);
});

custPageSizeSelect?.addEventListener("change", (e) => {
    pageSize = Number(e.target.value) || 10;
    currentPage = 1;
    loadCustomers(1);
});

// Custom Field filter handlers
customFieldSelectFilter?.addEventListener("change", () => {
    const selectedKey = customFieldSelectFilter.value;
    const cfDef = customerCustomFields.find(f => f.key === selectedKey);
    if (!cfDef) {
        if (customFieldValueFilter) { customFieldValueFilter.style.display = "none"; customFieldValueFilter.value = ""; }
        if (customFieldSelectValueFilter) { customFieldSelectValueFilter.style.display = "none"; customFieldSelectValueFilter.value = ""; }
    } else if (cfDef.fieldType === "SELECT") {
        if (customFieldValueFilter) { customFieldValueFilter.style.display = "none"; customFieldValueFilter.value = ""; }
        if (customFieldSelectValueFilter) {
            customFieldSelectValueFilter.innerHTML = '<option value="">-- Chọn --</option>';
            (cfDef.options || []).forEach(opt => {
                const o = document.createElement("option");
                o.value = opt;
                o.textContent = opt;
                customFieldSelectValueFilter.appendChild(o);
            });
            customFieldSelectValueFilter.style.display = "inline-block";
        }
    } else {
        if (customFieldSelectValueFilter) { customFieldSelectValueFilter.style.display = "none"; customFieldSelectValueFilter.value = ""; }
        if (customFieldValueFilter) {
            customFieldValueFilter.placeholder = `Giá trị ${cfDef.label}...`;
            customFieldValueFilter.type = cfDef.fieldType === "NUMBER" ? "number" : (cfDef.fieldType === "DATE" ? "date" : "text");
            customFieldValueFilter.style.display = "inline-block";
        }
    }
    currentPage = 1;
    loadCustomers(1);
});

customFieldValueFilter?.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        currentPage = 1;
        loadCustomers(1);
    }, 300);
});

customFieldSelectValueFilter?.addEventListener("change", () => {
    currentPage = 1;
    loadCustomers(1);
});

// Excel Export Button handler
btnExportExcel?.addEventListener("click", () => {
    const params = new URLSearchParams();
    const kw = searchInput?.value.trim() || "";
    const cPhone = contactPhoneFilter?.value.trim() || "";
    const st = statusFilter?.value || "";
    const ind = industryFilter?.value || "";
    const sizeId = companySizeFilter?.value || "";
    const regId = regionFilter?.value || "";
    const own = ownerFilter?.value || "";
    const cfKey = customFieldSelectFilter?.value || "";
    let cfVal = "";
    const cfDef = customerCustomFields.find(f => f.key === cfKey);
    if (cfDef?.fieldType === "SELECT") {
        cfVal = customFieldSelectValueFilter?.value || "";
    } else {
        cfVal = customFieldValueFilter?.value.trim() || "";
    }

    if (kw) params.append("keyword", kw);
    if (cPhone) params.append("contactPhone", cPhone);
    if (st) params.append("status", st);
    if (ind) params.append("industryId", ind);
    if (sizeId) params.append("companySizeId", sizeId);
    if (regId) params.append("regionId", regId);
    if (own) {
        if (own === "MINE") params.append("ownerFilter", "MINE");
        else params.append("ownerUserId", own);
    }
    if (cfKey && cfVal) {
        params.append("customFieldKey", cfKey);
        params.append("customFieldValue", cfVal);
    }

    const url = `${API_BASE}/api/customers/export?${params.toString()}`;
    window.open(url, "_blank");
});

/* =========================================================
   CUSTOMER SEARCH & TABLE RENDER
========================================================= */

async function loadCustomers(targetPage = currentPage) {
    try {
        currentPage = targetPage;
        const params = new URLSearchParams();
        params.append("page", String(currentPage));
        params.append("size", String(pageSize));

        const kw = searchInput?.value.trim() || "";
        const cPhone = contactPhoneFilter?.value.trim() || "";
        const st = statusFilter?.value || "";
        const ind = industryFilter?.value || "";
        const sizeId = companySizeFilter?.value || "";
        const regId = regionFilter?.value || "";
        const own = ownerFilter?.value || "";
        const sGrade = scoreGradeFilter?.value || "";
        const aStatus = assignmentStatusFilter?.value || "";

        if (kw) params.append("keyword", kw);
        if (cPhone) params.append("contactPhone", cPhone);
        if (st) params.append("status", st);
        if (ind) params.append("industryId", ind);
        if (sizeId) params.append("companySizeId", sizeId);
        if (regId) params.append("regionId", regId);
        if (sGrade) params.append("scoreGrade", sGrade);
        if (aStatus) params.append("assignmentStatus", aStatus);
        if (isSortByScoreActive) params.append("sortBy", "score");
        if (isSlaBreachedActive) params.append("slaBreached", "true");
        if (own) {
            if (own === "MINE") params.append("ownerFilter", "MINE");
            else params.append("ownerUserId", own);
        }

        const cfKey = customFieldSelectFilter?.value || "";
        let cfVal = "";
        const cfDef = customerCustomFields.find(f => f.key === cfKey);
        if (cfDef?.fieldType === "SELECT") {
            cfVal = customFieldSelectValueFilter?.value || "";
        } else {
            cfVal = customFieldValueFilter?.value.trim() || "";
        }
        if (cfKey && cfVal) {
            params.append("customFieldKey", cfKey);
            params.append("customFieldValue", cfVal);
        }

        const data = await api(`/api/customers?${params.toString()}`);
        records = data?.items || [];
        totalItems = data?.totalItems !== undefined ? Number(data.totalItems) : records.length;
        totalPages = data?.totalPages !== undefined ? Math.max(1, Number(data.totalPages)) : 1;
        currentPage = data?.page !== undefined ? Number(data.page) : currentPage;

        updateFilterSummary(totalItems);
        render();
        renderPagination();
    } catch (error) {
        console.error("Lỗi tải danh sách khách hàng:", error);
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red; padding:20px;">${escapeHtml(error.message)}</td></tr>`;
        if (customerPagination) customerPagination.style.display = "none";
    }
}

function renderPagination() {
    if (!customerPagination) return;
    if (totalItems === 0 || records.length === 0) {
        customerPagination.style.display = "none";
        return;
    }

    customerPagination.style.display = "flex";

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    if (custPaginationRange) {
        custPaginationRange.textContent = `Hiển thị ${start} - ${end} / ${totalItems} khách hàng (Trang ${currentPage}/${totalPages})`;
    }

    if (custPageSizeSelect && custPageSizeSelect.value !== String(pageSize)) {
        custPageSizeSelect.value = String(pageSize);
    }

    if (!custPaginationControls) return;
    custPaginationControls.innerHTML = "";

    // 1. Nút Đầu «
    const btnFirst = createPageBtn("«", 1, currentPage <= 1, false, "Trang đầu");
    custPaginationControls.appendChild(btnFirst);

    // 2. Nút Trước ‹
    const btnPrev = createPageBtn("‹", currentPage - 1, currentPage <= 1, false, "Trang trước");
    custPaginationControls.appendChild(btnPrev);

    // 3. Số trang
    const pageNumbers = getPageRange(currentPage, totalPages);
    pageNumbers.forEach(p => {
        if (p === "...") {
            const ellipsis = document.createElement("span");
            ellipsis.className = "crm-pagination-ellipsis";
            ellipsis.textContent = "…";
            custPaginationControls.appendChild(ellipsis);
        } else {
            const btn = createPageBtn(String(p), p, false, p === currentPage);
            custPaginationControls.appendChild(btn);
        }
    });

    // 4. Nút Sau ›
    const btnNext = createPageBtn("›", currentPage + 1, currentPage >= totalPages, false, "Trang sau");
    custPaginationControls.appendChild(btnNext);

    // 5. Nút Cuối »
    const btnLast = createPageBtn("»", totalPages, currentPage >= totalPages, false, "Trang cuối");
    custPaginationControls.appendChild(btnLast);
}

function createPageBtn(label, targetPage, disabled, isActive = false, title = "") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `crm-pagination-btn ${isActive ? "active" : ""}`;
    btn.textContent = label;
    if (title) btn.title = title;
    if (disabled) {
        btn.disabled = true;
    } else if (!isActive) {
        btn.addEventListener("click", () => {
            loadCustomers(targetPage);
        });
    }
    return btn;
}

function getPageRange(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
}

function updateFilterSummary(total) {
    if (filterResultCount) {
        filterResultCount.innerHTML = `Tìm thấy <strong style="color:var(--crm-primary); font-size:13px;">${total}</strong> khách hàng phù hợp`;
    }

    if (!activeFilterTags) return;
    activeFilterTags.innerHTML = "";

    const tags = [];
    if (searchInput?.value.trim()) tags.push({ label: `Từ khóa: "${searchInput.value.trim()}"`, clear: () => { searchInput.value = ""; loadCustomers(); } });
    if (contactPhoneFilter?.value.trim()) tags.push({ label: `SĐT: ${contactPhoneFilter.value.trim()}`, clear: () => { contactPhoneFilter.value = ""; loadCustomers(); } });
    if (statusFilter?.value) tags.push({ label: `TT: ${statusFilter.options[statusFilter.selectedIndex]?.text}`, clear: () => { statusFilter.value = ""; loadCustomers(); } });
    if (industryFilter?.value) tags.push({ label: `Ngành: ${industryFilter.options[industryFilter.selectedIndex]?.text.replace(/^[^\s]+\s/, "")}`, clear: () => { industryFilter.value = ""; loadCustomers(); } });
    if (companySizeFilter?.value) tags.push({ label: `Quy mô: ${companySizeFilter.options[companySizeFilter.selectedIndex]?.text.replace(/^[^\s]+\s/, "")}`, clear: () => { companySizeFilter.value = ""; loadCustomers(); } });
    if (regionFilter?.value) tags.push({ label: `Khu vực: ${regionFilter.options[regionFilter.selectedIndex]?.text.replace(/^[^\s]+\s/, "")}`, clear: () => { regionFilter.value = ""; loadCustomers(); } });
    if (ownerFilter?.value) tags.push({ label: `Sở hữu: ${ownerFilter.options[ownerFilter.selectedIndex]?.text.replace(/^[^\s]+\s/, "")}`, clear: () => { ownerFilter.value = ""; loadCustomers(); } });
    if (isSlaBreachedActive) tags.push({ label: `🚨 Quá SLA phản hồi`, clear: () => { isSlaBreachedActive = false; if (btnSlaBreachedFilter) { btnSlaBreachedFilter.style.background = "#fef2f2"; btnSlaBreachedFilter.style.color = "#dc2626"; btnSlaBreachedFilter.innerHTML = "🚨 Quá SLA phản hồi"; } loadCustomers(); } });

    const activeCfKey = customFieldSelectFilter?.value;
    const activeCfDef = customerCustomFields.find(f => f.key === activeCfKey);
    let activeCfVal = "";
    if (activeCfDef?.fieldType === "SELECT") {
        activeCfVal = customFieldSelectValueFilter?.value || "";
    } else {
        activeCfVal = customFieldValueFilter?.value.trim() || "";
    }
    if (activeCfKey && activeCfVal && activeCfDef) {
        tags.push({
            label: `${activeCfDef.label}: "${activeCfVal}"`,
            clear: () => {
                customFieldSelectFilter.value = "";
                if (customFieldValueFilter) { customFieldValueFilter.value = ""; customFieldValueFilter.style.display = "none"; }
                if (customFieldSelectValueFilter) { customFieldSelectValueFilter.value = ""; customFieldSelectValueFilter.style.display = "none"; }
                loadCustomers();
            }
        });
    }

    tags.forEach(t => {
        const span = document.createElement("span");
        span.className = "filter-tag";
        span.innerHTML = `${escapeHtml(t.label)} <span class="tag-close">×</span>`;
        span.querySelector(".tag-close").addEventListener("click", t.clear);
        activeFilterTags.appendChild(span);
    });
}

function render() {
    tableBody.innerHTML = "";
    mobileList.innerHTML = "";

    desktopEmpty.style.display = records.length ? "none" : "flex";

    if (!records.length) {
        const empty = document.createElement("div");
        empty.className = "customer-mobile-empty";
        empty.textContent = "Không có bản ghi phù hợp với tiêu chí tìm kiếm và lọc.";
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

    // 1. Tên công ty & MST & Tập đoàn badge
    let corporateBadge = "";
    if (record.subsidiaryCount && record.subsidiaryCount > 0) {
        corporateBadge = `<span style="display:inline-block; margin-top:2px; font-size:11px; background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; padding:1px 6px; border-radius:10px;">🏛️ Tập đoàn (${record.subsidiaryCount} cty con)</span>`;
    } else if (record.parentName) {
        corporateBadge = `<span style="display:inline-block; margin-top:2px; font-size:11px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; padding:1px 6px; border-radius:10px;" title="Trực thuộc: ${escapeHtml(record.parentName)}">🏢 Thuộc: ${escapeHtml(record.parentName)}</span>`;
    }

    // 2. Người liên hệ & SĐT gọi ngay
    let contactHtml = "";
    if (record.primaryContactName) {
        const phone = record.primaryContactPhone || "";
        contactHtml = `
            <div style="display:flex; flex-direction:column; gap:2px;">
                <span style="font-weight:600; color:var(--crm-text);">${escapeHtml(record.primaryContactName)}</span>
                <span style="font-size:11.5px; color:var(--crm-muted);">${escapeHtml(record.primaryContactRole || "Liên hệ chính")}</span>
                ${phone ? `
                    <a href="tel:${escapeHtml(phone)}" class="call-btn" style="display:inline-flex; align-items:center; gap:4px; font-weight:700; color:#059669; font-size:12px; text-decoration:none; margin-top:1px;">
                        📞 ${escapeHtml(phone)}
                    </a>
                ` : `<span style="font-size:11px; color:#94a3b8;">Chưa có SĐT</span>`}
            </div>
        `;
    } else {
        contactHtml = `
            <div style="color:#94a3b8; font-size:12px; font-style:italic;">
                — Chưa có liên hệ
                ${record.phone ? `<br><a href="tel:${escapeHtml(record.phone)}" class="call-btn" style="color:#0284c7; text-decoration:none; font-size:11.5px; font-style:normal;">☎ Tổng đài: ${escapeHtml(record.phone)}</a>` : ""}
            </div>
        `;
    }

    tr.innerHTML = `
        <td>
            <input type="checkbox">
        </td>
        <td>
            <a class="customer-name" href="customer-360?id=${record.id}" style="font-weight:600;">
                ${escapeHtml(record.companyName || record.name)}
            </a>
            <span class="customer-sub">
                MST: ${escapeHtml(record.taxCode || "—")}
            </span>
            ${corporateBadge}
        </td>
        <td>
            ${contactHtml}
        </td>
        <td>
            <span style="font-weight:550; color:var(--crm-text);">${escapeHtml(record.industryName || "—")}</span>
            <span class="customer-sub" style="margin-top:2px;">
                👥 ${escapeHtml(record.companySizeName || "—")}
            </span>
        </td>
        <td>
            <span style="font-size:12.5px; font-weight:550; color:#334155;">📍 ${escapeHtml(record.regionName || "—")}</span>
            <span class="customer-sub" title="${escapeHtml(record.address || "")}" style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block; margin-top:2px;">
                ${escapeHtml(record.address || "—")}
            </span>
        </td>
        <td>
            <span class="status-pill ${statusClass(record.status)}">
                ${escapeHtml(statusLabel(record.status))}
            </span>
            ${record.leadSource ? `<div style="margin-top:3px;"><span style="font-size:10.5px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; padding:1px 6px; border-radius:8px;" title="Nguồn khách hàng">🌐 ${escapeHtml(record.leadSource)}</span></div>` : ""}
        </td>
        <td>
            ${(function() {
                const grade = record.scoreGrade || "COLD";
                let icon = "❄️", color = "#0284c7", bg = "#e0f2fe", border = "#bae6fd", label = "Lạnh";
                if (grade === "HOT") {
                    icon = "🔥"; color = "#dc2626"; bg = "#fee2e2"; border = "#fca5a5"; label = "NÓNG";
                } else if (grade === "WARM") {
                    icon = "☀️"; color = "#d97706"; bg = "#fef3c7"; border = "#fde68a"; label = "ẤM";
                }
                return `<div style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:12px; font-size:11.5px; font-weight:700; background:${bg}; color:${color}; border:1px solid ${border};" title="Điểm tiềm năng: ${record.leadScore || 0} điểm">
                    <span>${icon}</span>
                    <span>${record.leadScore || 0}đ (${label})</span>
                </div>`;
            })()}
        </td>
        <td>
            ${(function() {
                if (record.slaBreached) {
                    return `<div style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; background:#fef2f2; color:#dc2626; border:1px solid #f87171;" title="Quá hạn phản hồi SLA!">
                        <span>⚠️ Quá SLA</span>
                    </div>
                    ${record.slaBreachedAt ? `<div class="customer-sub" style="color:#ef4444; font-size:10.5px; margin-top:2px;">${escapeHtml(record.slaBreachedAt.substring(0, 16).replace('T', ' '))}</div>` : ''}`;
                } else if (record.status === "CONVERTED") {
                    return `<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; background:#f3e8ff; color:#7e22ce; border:1px solid #d8b4fe; padding:2px 8px; border-radius:10px; font-weight:600;">
                        👑 Đã chuyển đổi
                    </span>`;
                } else if (record.status === "DANG_CHAM_SOC") {
                    return `<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; padding:2px 8px; border-radius:10px; font-weight:600;">
                        📞 Đang chăm sóc
                    </span>`;
                } else if (record.slaDeadline) {
                    const deadline = new Date(record.slaDeadline);
                    const now = new Date();
                    const diffHours = (deadline - now) / (1000 * 60 * 60);
                    if (diffHours < 0) {
                        return `<span style="font-size:11px; font-weight:700; color:#dc2626;">⚠️ Quá hạn</span>`;
                    } else {
                        const h = Math.floor(diffHours);
                        const m = Math.floor((diffHours - h) * 60);
                        return `<div style="display:flex; flex-direction:column; gap:1px;">
                            <span style="font-size:11px; font-weight:600; color:#0284c7;">⏱️ Còn ${h}h ${m}m</span>
                            <span class="customer-sub" style="font-size:10px;">Hạn: ${escapeHtml(record.slaDeadline.substring(11, 16))}</span>
                        </div>`;
                    }
                } else if (record.assignmentStatus === "UNASSIGNED") {
                    return `<span style="font-size:11px; color:#94a3b8; font-style:italic;">Chờ phân bổ</span>`;
                } else {
                    return `<span style="font-size:11px; color:#94a3b8;">—</span>`;
                }
            })()}
        </td>
        <td>
            <span style="font-weight:500;">${escapeHtml(record.ownerName || record.owner || "—")}</span>
            ${record.assignmentStatus === "UNASSIGNED" ? `<span style="display:block; font-size:10.5px; color:#d97706; font-weight:600;">(Chờ phân bổ)</span>` : ""}
        </td>
        <td class="action-col">
            <div style="display:flex; align-items:center; gap:6px; justify-content:flex-end;">
                ${(function() {
                    if (record.status === "CONVERTED") {
                        return `<span style="font-size:11px; color:#6b21a8; font-weight:600; padding:2px 6px; background:#faf5ff; border:1px solid #e9d5ff; border-radius:4px;">🔒 Khóa</span>`;
                    }
                    let btns = "";
                    if ((record.status === "TIEM_NANG" || !record.status) && record.assignmentStatus === "ASSIGNED") {
                        btns += `
                            <button type="button" class="crm-btn" style="padding:4px 8px; font-size:11px; font-weight:700; background:#059669; color:#fff; border:none; border-radius:4px; cursor:pointer;" data-accept-id="${record.id}" title="Tiếp nhận lead này để chăm sóc">✅ Nhận</button>
                            <button type="button" class="crm-btn" style="padding:4px 8px; font-size:11px; font-weight:700; background:#dc2626; color:#fff; border:none; border-radius:4px; cursor:pointer;" data-reject-id="${record.id}" data-reject-name="${escapeHtml(record.companyName || record.name)}" title="Từ chối tiếp nhận lead (yêu cầu lý do)">❌ Từ chối</button>
                        `;
                    }
                    if (record.status !== "KHACH_HANG" && record.status !== "CHINH_THUC") {
                        btns += `
                            <button type="button" class="crm-btn" style="padding:4px 8px; font-size:11px; font-weight:700; background:#7c3aed; color:#fff; border:none; border-radius:4px; cursor:pointer;" data-convert-id="${record.id}" title="Chuyển đổi lead thành Khách hàng & Cơ hội bán hàng">⚡ Chuyển đổi</button>
                        `;
                    }
                    return btns;
                })()}
                <div class="row-action-wrap">
                    <button class="row-action-button" type="button" data-action-menu="${index}">
                        ⋮
                    </button>
                    <div class="row-action-menu" data-menu="${index}">
                        <a href="customer-360?id=${record.id}">
                            🔍 Xem chi tiết (360)
                        </a>
                        ${record.status === "CONVERTED" ? `
                            <button type="button" style="color:#94a3b8; cursor:not-allowed;" title="Lead đã chuyển đổi, không thể chỉnh sửa" onclick="alert('Lead này đã chuyển đổi thành khách hàng chính thức và đã bị khóa bảo vệ. Không thể chỉnh sửa trực tiếp thông tin lead gốc!')">
                                🔒 Sửa (Đã khóa)
                            </button>
                            <button type="button" style="color:#94a3b8; cursor:not-allowed;" title="Không thể xóa lead đã chuyển đổi" onclick="alert('Không thể xóa Lead đã chuyển đổi thành công để bảo toàn lịch sử dữ liệu!')">
                                🔒 Xóa (Đã khóa)
                            </button>
                        ` : `
                            <button type="button" data-edit="${index}">
                                ✏️ Sửa
                            </button>
                            <button type="button" class="danger" data-delete="${index}">
                                🗑️ Xóa
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </td>
    `;

    tableBody.appendChild(tr);
}

function renderMobileCard(record, index) {
    const card = document.createElement("article");
    card.className = "customer-mobile-card";

    let contactLine = "";
    if (record.primaryContactName) {
        contactLine = `<span>👤 Người liên hệ: <strong>${escapeHtml(record.primaryContactName)}</strong> (${escapeHtml(record.primaryContactPhone || "—")})</span>`;
    }

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
                    <span style="font-size:11px; color:#64748b; margin-left:6px;">📍 ${escapeHtml(record.regionName || "—")}</span>
                </div>
            </div>
            <button class="row-action-button" type="button" data-edit="${index}">
                ⋮
            </button>
        </div>
        <div class="mobile-card-contact">
            ${contactLine}
            <span>🏢 Ngành: ${escapeHtml(record.industryName || "—")} (${escapeHtml(record.companySizeName || "—")})</span>
            <span>👤 Phụ trách: ${escapeHtml(record.ownerName || record.owner || "—")}</span>
            ${record.slaBreached ? `<div style="margin-top:4px;"><span style="font-size:11px; font-weight:700; color:#dc2626; background:#fef2f2; border:1px solid #f87171; padding:2px 6px; border-radius:10px;">⚠️ Quá SLA phản hồi</span></div>` : ""}
        </div>
        <div style="display:flex; gap:6px; margin-top:10px; flex-wrap:wrap;">
            ${(function() {
                if (record.status === "CONVERTED") {
                    return `<span style="font-size:11.5px; color:#6b21a8; font-weight:600; padding:4px 8px; background:#faf5ff; border:1px solid #e9d5ff; border-radius:6px;">🔒 Lead đã chuyển đổi (Đã khóa)</span>`;
                }
                let btns = "";
                if ((record.status === "TIEM_NANG" || !record.status) && record.assignmentStatus === "ASSIGNED") {
                    btns += `
                        <button type="button" class="crm-btn" style="flex:1; padding:5px 8px; font-size:11.5px; font-weight:700; background:#059669; color:#fff; border:none; border-radius:6px;" data-accept-id="${record.id}">✅ Nhận lead</button>
                        <button type="button" class="crm-btn" style="flex:1; padding:5px 8px; font-size:11.5px; font-weight:700; background:#dc2626; color:#fff; border:none; border-radius:6px;" data-reject-id="${record.id}" data-reject-name="${escapeHtml(record.companyName || record.name)}">❌ Từ chối</button>
                    `;
                }
                if (record.status !== "KHACH_HANG" && record.status !== "CHINH_THUC") {
                    btns += `
                        <button type="button" class="crm-btn" style="flex:1; padding:5px 8px; font-size:11.5px; font-weight:700; background:#7c3aed; color:#fff; border:none; border-radius:6px;" data-convert-id="${record.id}">⚡ Chuyển đổi</button>
                    `;
                }
                return btns;
            })()}
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
            ${record.primaryContactPhone ? `
                <a href="tel:${escapeHtml(record.primaryContactPhone)}" class="crm-btn crm-btn-primary" style="flex:1; text-align:center; text-decoration:none; background:#059669; border-color:#059669;">
                    📞 Gọi ngay
                </a>
            ` : ""}
            <a href="customer-360?id=${record.id}" class="crm-btn crm-btn-secondary" style="flex:1; text-align:center; text-decoration:none;">
                Xem 360
            </a>
        </div>
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
        const idx = Number(editButton.dataset.edit);
        const record = records[idx];
        if (record && record.status === "CONVERTED") {
            alert("Lead này đã được chuyển đổi thành khách hàng chính thức và đã bị khóa bảo vệ. Không thể chỉnh sửa trực tiếp thông tin lead gốc!");
            return;
        }
        openDrawer(idx);
        return;
    }

    const deleteButton = event.target.closest("[data-delete]");
    if (deleteButton) {
        const index = Number(deleteButton.dataset.delete);
        const record = records[index];
        if (record && record.status === "CONVERTED") {
            alert("Không thể xóa Lead đã chuyển đổi thành công để bảo toàn dữ liệu lịch sử và chuỗi kiểm toán!");
            return;
        }
        if (record && confirm(`Bạn có chắc chắn muốn xóa khách hàng "${record.companyName || record.name}"?`)) {
            try {
                await api(`/api/customers/${record.id}`, { method: "DELETE" });
                await loadCustomers();
                await loadDuplicatePairs();
                if (typeof window.crmToast === "function") {
                    window.crmToast("Xóa khách hàng thành công!", "success");
                }
                alert("Xóa khách hàng thành công!");
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

async function openDrawer(index = null) {
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

        // Load detail to get full custom fields
        try {
            const detail = await api(`/api/customers/${record.id}`);
            renderCustomerCustomFieldInputs(detail?.customFields || {});
        } catch (e) {
            renderCustomerCustomFieldInputs({});
        }
    } else {
        renderCustomerCustomFieldInputs({});
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
        case "MOI":
        case "Mới":
            return "status-new-lead";
        case "DANG_CHAM_SOC":
            return "status-dealing";
        case "CONVERTED":
            return "status-customer";
        case "Đang giao dịch":
        case "DANG_GIAO_DICH":
            return "status-dealing";
        case "Khách hàng":
        case "CHINH_THUC":
        case "KHACH_HANG":
            return "status-customer";
        case "Ngừng hợp tác":
        case "NGUNG_HOP_TAC":
        case "NGUNG_HOAT_DONG":
            return "status-inactive";
        default:
            return "status-prospect";
    }
}

function statusLabel(status) {
    switch (status) {
        case "MOI":
            return "Mới (Lead)";
        case "TIEM_NANG":
            return "Tiềm năng";
        case "DANG_CHAM_SOC":
            return "Đang chăm sóc";
        case "CONVERTED":
            return "Đã chuyển đổi";
        case "KHACH_HANG":
        case "CHINH_THUC":
            return "Khách hàng";
        case "NGUNG_HOAT_DONG":
        case "NGUNG_HOP_TAC":
            return "Ngừng hoạt động";
        default:
            return status || "Tiềm năng";
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

async function loadOwnersIntoFilter() {
    if (!ownerFilter) return;
    try {
        const data = await api("/api/users?size=50");
        const users = data?.items || [];
        users.forEach(u => {
            const opt = document.createElement("option");
            opt.value = String(u.id);
            opt.textContent = `👤 ${u.fullName || u.email}`;
            ownerFilter.appendChild(opt);
        });
    } catch (e) {
        console.warn("Could not load users for owner filter:", e);
    }
}

/* =========================================================
   MANUAL LEAD CREATION MODAL (SCRUM-64)
========================================================= */
const btnOpenManualLeadModal = document.getElementById("btnOpenManualLeadModal");
const manualLeadModalOverlay = document.getElementById("manualLeadModalOverlay");
const btnCloseManualLeadModal = document.getElementById("btnCloseManualLeadModal");
const btnCancelManualLead = document.getElementById("btnCancelManualLead");
const manualLeadForm = document.getElementById("manualLeadForm");
const mlLeadSource = document.getElementById("mlLeadSource");

function initManualLeadModal() {
    btnOpenManualLeadModal?.addEventListener("click", openManualLeadModal);
    btnCloseManualLeadModal?.addEventListener("click", closeManualLeadModal);
    btnCancelManualLead?.addEventListener("click", closeManualLeadModal);
    manualLeadForm?.addEventListener("submit", handleManualLeadSubmit);

    manualLeadModalOverlay?.addEventListener("click", e => {
        if (e.target === manualLeadModalOverlay) closeManualLeadModal();
    });

    setupRealtimeDuplicateCheck();
}

function openManualLeadModal() {
    if (!manualLeadModalOverlay) return;
    manualLeadForm?.reset();
    clearManualLeadErrors();
    const warnBox = document.getElementById("mlDuplicateWarning");
    if (warnBox) warnBox.style.display = "none";
    loadLeadSourcesIntoSelect();
    loadCampaignsIntoSelect();
    manualLeadModalOverlay.style.display = "flex";
}

function closeManualLeadModal() {
    if (!manualLeadModalOverlay) return;
    manualLeadModalOverlay.style.display = "none";
}

function clearManualLeadErrors() {
    ["mlFullNameError", "mlPhoneError", "mlEmailError", "mlLeadSourceError"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = "";
            el.style.display = "none";
        }
    });
}

async function loadLeadSourcesIntoSelect() {
    if (!mlLeadSource) return;
    try {
        const res = await api("/api/leads/sources");
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
            mlLeadSource.innerHTML = `<option value="">-- Vui lòng chọn nguồn Lead (Bắt buộc) --</option>`;
            list.forEach(item => {
                const opt = document.createElement("option");
                opt.value = item.name || item.code;
                opt.textContent = item.name || item.code;
                if (item.code === "HOI_THAO") opt.selected = true;
                mlLeadSource.appendChild(opt);
            });
        }
    } catch (e) {
        console.warn("Could not load dynamic lead sources, using defaults:", e);
    }
}

async function loadCampaignsIntoSelect() {
    const mlCampaignId = document.getElementById("mlCampaignId");
    if (!mlCampaignId) return;
    try {
        const res = await api("/api/campaigns/options");
        const list = res?.data || res || [];
        mlCampaignId.innerHTML = `<option value="">-- Không gắn chiến dịch cụ thể --</option>`;
        list.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = `[${c.code}] ${c.name}`;
            mlCampaignId.appendChild(opt);
        });
    } catch (e) {
        console.warn("Could not load campaigns:", e);
    }
}

let dupCheckTimer;
function setupRealtimeDuplicateCheck() {
    ["mlPhone", "mlEmail", "mlCompany"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", () => {
            clearTimeout(dupCheckTimer);
            dupCheckTimer = setTimeout(checkManualLeadDuplicates, 450);
        });
    });
}

async function checkManualLeadDuplicates() {
    const phone = document.getElementById("mlPhone")?.value.trim() || "";
    const email = document.getElementById("mlEmail")?.value.trim() || "";
    const name = document.getElementById("mlCompany")?.value.trim() || document.getElementById("mlFullName")?.value.trim() || "";

    const warnBox = document.getElementById("mlDuplicateWarning");
    const msgEl = document.getElementById("mlDupMessage");
    const custIdEl = document.getElementById("mlDupCustId");
    const viewBtn = document.getElementById("mlBtnViewExisting");

    if (!phone && !email && !name) {
        if (warnBox) warnBox.style.display = "none";
        return;
    }

    try {
        const url = `/api/leads/check-duplicate?phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
        const res = await api(url);
        const dupes = res?.data || res || [];

        if (dupes.length > 0 && dupes[0].confidence >= 75) {
            const top = dupes[0];
            warnBox.style.display = "block";
            msgEl.textContent = `Khớp ${top.confidence}%: ${top.matchReasons.join(", ")} (Khách hàng: ${top.name}${top.ownerName ? " - Phụ trách: " + top.ownerName : ""}).`;
            custIdEl.textContent = top.id;
            if (viewBtn) viewBtn.href = `customers?id=${top.id}`;

            // Gợi ý gắn vào khách hàng đã có
            const btnLink = document.getElementById("mlBtnLinkToExisting");
            if (btnLink) {
                btnLink.onclick = async () => {
                    const leadFullName = document.getElementById("mlFullName")?.value.trim() || top.name;
                    if (!confirm(`Bạn có muốn gắn người liên hệ "${leadFullName}" trực tiếp vào Khách hàng #${top.id} (${top.name})?`)) return;
                    try {
                        await api("/api/contacts", {
                            method: "POST",
                            body: JSON.stringify({
                                customerId: top.id,
                                name: leadFullName,
                                title: document.getElementById("mlTitle")?.value.trim() || "Người liên hệ mới",
                                phone: phone || top.phone,
                                email: email || top.email,
                                notes: "Thu thập từ: " + (document.getElementById("mlLeadSource")?.value || "Sự kiện") + " - " + (document.getElementById("mlInterest")?.value.trim() || "")
                            })
                        });
                        alert(`✓ Đã gắn thành công người liên hệ vào khách hàng "${top.name}"!`);
                        closeManualLeadModal();
                        await loadCustomers();
                    } catch (err) {
                        alert("Lỗi khi gắn người liên hệ: " + err.message);
                    }
                };
            }
        } else {
            if (warnBox) warnBox.style.display = "none";
        }
    } catch (e) {
        // Silent fail
    }
}

async function handleManualLeadSubmit(e) {
    e.preventDefault();
    clearManualLeadErrors();

    const fullName = document.getElementById("mlFullName")?.value.trim() || "";
    const company = document.getElementById("mlCompany")?.value.trim() || "";
    const title = document.getElementById("mlTitle")?.value.trim() || "";
    const phone = document.getElementById("mlPhone")?.value.trim() || "";
    const email = document.getElementById("mlEmail")?.value.trim() || "";
    const leadSource = document.getElementById("mlLeadSource")?.value.trim() || "";
    const campaignId = document.getElementById("mlCampaignId")?.value || null;
    const eventName = document.getElementById("mlEventName")?.value.trim() || "";
    const interest = document.getElementById("mlInterest")?.value.trim() || "";

    let hasError = false;

    if (!fullName) {
        const el = document.getElementById("mlFullNameError");
        if (el) { el.textContent = "Họ và tên không được để trống"; el.style.display = "block"; }
        hasError = true;
    }

    if (!leadSource) {
        const el = document.getElementById("mlLeadSourceError");
        if (el) { el.textContent = "Mọi lead nhập vào đều bắt buộc có nguồn"; el.style.display = "block"; }
        hasError = true;
    }

    if (!phone) {
        const el = document.getElementById("mlPhoneError");
        if (el) { el.textContent = "Số điện thoại không được để trống"; el.style.display = "block"; }
        hasError = true;
    } else if (!/^[0-9+()\s.-]{8,20}$/.test(phone)) {
        const el = document.getElementById("mlPhoneError");
        if (el) { el.textContent = "Số điện thoại không hợp lệ (tối thiểu 8 chữ số)"; el.style.display = "block"; }
        hasError = true;
    }

    if (!email) {
        const el = document.getElementById("mlEmailError");
        if (el) { el.textContent = "Email không được để trống"; el.style.display = "block"; }
        hasError = true;
    } else if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
        const el = document.getElementById("mlEmailError");
        if (el) { el.textContent = "Email không đúng định dạng"; el.style.display = "block"; }
        hasError = true;
    }

    if (hasError) return;

    const btnSubmit = document.getElementById("btnSubmitManualLead");
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "⏳ Đang lưu...";
    }

    try {
        const res = await api("/api/leads/manual", {
            method: "POST",
            body: JSON.stringify({
                fullName,
                company,
                title,
                phone,
                email,
                leadSource,
                campaignId: campaignId ? Number(campaignId) : null,
                eventName,
                interest
            })
        });

        alert(`✓ Đã tạo thành công khách hàng tiềm năng: "${fullName}" từ nguồn "${leadSource}"!`);
        closeManualLeadModal();
        await loadCustomers();
    } catch (err) {
        alert("Lỗi khi tạo lead: " + (err.message || "Không thể kết nối đến máy chủ"));
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "💾 Lưu Lead vào hệ thống";
        }
    }
}

/* =========================================================
   SLA MANAGEMENT & LEAD CONVERSION (STORY 3 & 4)
========================================================= */

function openRejectModal(id, leadName) {
    const overlay = document.getElementById("rejectLeadModalOverlay");
    const idInput = document.getElementById("rejectLeadId");
    const subTitle = document.getElementById("rejectLeadSubtitle");
    const reasonSelect = document.getElementById("rejectReasonSelect");
    const reasonText = document.getElementById("rejectReasonText");
    const err = document.getElementById("rejectReasonError");

    if (idInput) idInput.value = id;
    if (subTitle) subTitle.textContent = `Lead: "${leadName}" (Mã: #${id}) - Sẽ trả về hàng chờ phân bổ`;
    if (reasonSelect) reasonSelect.value = "";
    if (reasonText) reasonText.value = "";
    if (err) { err.textContent = ""; err.style.display = "none"; }
    if (overlay) overlay.style.display = "flex";
}

async function openConvertModal(id) {
    const overlay = document.getElementById("convertLeadModalOverlay");
    const form = document.getElementById("convertLeadForm");
    const convertIdInput = document.getElementById("convertLeadId");
    const subTitle = document.getElementById("convertLeadSubtitle");
    const activitiesBadge = document.getElementById("convertActivitiesBadge");

    if (form) form.reset();
    if (convertIdInput) convertIdInput.value = id;

    try {
        const preview = await api(`/api/leads/${id}/convert-preview`);
        if (subTitle) subTitle.textContent = `Lead: "${preview.leadName || ''}" (SĐT: ${preview.leadPhone || '—'})`;
        if (activitiesBadge) {
            activitiesBadge.textContent = `Toàn bộ thông tin lead và ${preview.activitiesCount || 0} hoạt động tương tác trước đó sẽ được tự động chuyển sang Khách hàng & Cơ hội mới. Lead gốc sẽ khóa chỉnh sửa để bảo đảm lịch sử.`;
        }

        setValue("cvCustName", preview.suggestedCompanyName || preview.leadName);
        setValue("cvCustTaxCode", preview.leadTaxCode || "");
        setValue("cvCustPhone", preview.leadPhone || "");
        setValue("cvCustEmail", preview.leadEmail || "");
        setValue("cvCustWebsite", preview.leadWebsite || "");

        setValue("cvContactName", preview.leadContactName || preview.leadName);
        setValue("cvContactTitle", preview.leadContactTitle || "Đại diện");
        setValue("cvContactPhone", preview.leadPhone || "");
        setValue("cvContactEmail", preview.leadEmail || "");

        setValue("cvOppName", preview.suggestedOpportunityName || `Cơ hội - ${preview.suggestedCompanyName || preview.leadName}`);
        setValue("cvOppAmount", preview.suggestedDealAmount ? String(preview.suggestedDealAmount) : "10000000");

        const d = new Date();
        d.setDate(d.getDate() + 30);
        setValue("cvExpectedCloseDate", d.toISOString().substring(0, 10));

        const custModeNew = document.getElementById("custModeNew");
        if (custModeNew) custModeNew.checked = true;
        const wrapCustNew = document.getElementById("wrapCustNew");
        const wrapCustExist = document.getElementById("wrapCustExist");
        if (wrapCustNew) wrapCustNew.style.display = "block";
        if (wrapCustExist) wrapCustExist.style.display = "none";

        const cvCreateOpp = document.getElementById("cvCreateOpportunity");
        if (cvCreateOpp) cvCreateOpp.checked = true;
        const wrapOpp = document.getElementById("wrapOppFields");
        if (wrapOpp) wrapOpp.style.display = "block";

        if (overlay) overlay.style.display = "flex";
    } catch (err) {
        alert("Lỗi khi chuẩn bị chuyển đổi lead: " + err.message);
    }
}

async function loadExistingCustomersForSelect() {
    const sel = document.getElementById("cvExistingCustomerId");
    if (!sel) return;
    try {
        const res = await api("/api/customers?status=KHACH_HANG&size=100");
        const items = res?.items || [];
        sel.innerHTML = '<option value="">-- Chọn khách hàng doanh nghiệp có sẵn --</option>';
        items.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = `${c.companyName || c.name} (MST: ${c.taxCode || '—'})`;
            sel.appendChild(opt);
        });
    } catch (e) {
        console.warn("Could not load existing customers:", e);
    }
}

function initSlaAndConversion() {
    // 1. Reject Modal
    const rejectModal = document.getElementById("rejectLeadModalOverlay");
    const closeRejectBtn = document.getElementById("btnCloseRejectModal");
    const cancelRejectBtn = document.getElementById("btnCancelRejectModal");
    const rejectForm = document.getElementById("rejectLeadForm");
    const reasonSelect = document.getElementById("rejectReasonSelect");
    const reasonText = document.getElementById("rejectReasonText");

    const closeRejectModal = () => {
        if (rejectModal) rejectModal.style.display = "none";
        if (rejectForm) rejectForm.reset();
        const err = document.getElementById("rejectReasonError");
        if (err) { err.textContent = ""; err.style.display = "none"; }
    };

    closeRejectBtn?.addEventListener("click", closeRejectModal);
    cancelRejectBtn?.addEventListener("click", closeRejectModal);
    rejectModal?.addEventListener("click", e => {
        if (e.target === rejectModal) closeRejectModal();
    });

    reasonSelect?.addEventListener("change", () => {
        if (reasonSelect.value && reasonSelect.value !== "OTHER") {
            reasonText.value = reasonSelect.value;
        } else if (reasonSelect.value === "OTHER") {
            reasonText.value = "";
            reasonText.focus();
        }
    });

    rejectForm?.addEventListener("submit", async e => {
        e.preventDefault();
        const leadId = document.getElementById("rejectLeadId")?.value;
        const reason = reasonText?.value.trim();
        const err = document.getElementById("rejectReasonError");

        if (!reason) {
            if (err) {
                err.textContent = "Vui lòng nhập lý do từ chối (bắt buộc theo quy định SLA).";
                err.style.display = "block";
            }
            reasonText?.focus();
            return;
        }

        const submitBtn = rejectForm.querySelector('button[type="submit"]');
        const origText = submitBtn?.textContent || "";
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "⏳ Đang xử lý..."; }

        try {
            await api(`/api/leads/${leadId}/reject`, {
                method: "POST",
                body: JSON.stringify({ reason })
            });

            closeRejectModal();
            if (typeof window.crmToast === "function") {
                window.crmToast("✓ Đã từ chối tiếp nhận lead. Lead đã quay lại hàng chờ phân bổ.", "info");
            } else {
                alert("✓ Đã từ chối tiếp nhận lead. Lead đã quay lại hàng chờ phân bổ.");
            }
            await loadCustomers();
        } catch (error) {
            alert("Lỗi khi từ chối lead: " + error.message);
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origText; }
        }
    });

    // 2. Convert Modal
    const convertModal = document.getElementById("convertLeadModalOverlay");
    const closeConvertBtn = document.getElementById("btnCloseConvertModal");
    const cancelConvertBtn = document.getElementById("btnCancelConvertModal");
    const convertForm = document.getElementById("convertLeadForm");
    const custModeNew = document.getElementById("custModeNew");
    const custModeExist = document.getElementById("custModeExist");
    const wrapCustNew = document.getElementById("wrapCustNew");
    const wrapCustExist = document.getElementById("wrapCustExist");
    const cvCreateOpportunity = document.getElementById("cvCreateOpportunity");
    const wrapOppFields = document.getElementById("wrapOppFields");

    const closeConvertModal = () => {
        if (convertModal) convertModal.style.display = "none";
        if (convertForm) convertForm.reset();
    };

    closeConvertBtn?.addEventListener("click", closeConvertModal);
    cancelConvertBtn?.addEventListener("click", closeConvertModal);
    convertModal?.addEventListener("click", e => {
        if (e.target === convertModal) closeConvertModal();
    });

    custModeNew?.addEventListener("change", () => {
        if (wrapCustNew) wrapCustNew.style.display = "block";
        if (wrapCustExist) wrapCustExist.style.display = "none";
    });

    custModeExist?.addEventListener("change", () => {
        if (wrapCustNew) wrapCustNew.style.display = "none";
        if (wrapCustExist) wrapCustExist.style.display = "block";
        loadExistingCustomersForSelect();
    });

    cvCreateOpportunity?.addEventListener("change", () => {
        if (wrapOppFields) wrapOppFields.style.display = cvCreateOpportunity.checked ? "block" : "none";
    });

    convertForm?.addEventListener("submit", async e => {
        e.preventDefault();
        const leadId = document.getElementById("convertLeadId")?.value;
        const isNew = custModeNew?.checked;

        const payload = {
            customerMode: isNew ? "NEW" : "EXISTING",
            companyName: isNew ? value("cvCustName") : null,
            existingCustomerId: !isNew && value("cvExistingCustomerId") ? Number(value("cvExistingCustomerId")) : null,
            taxCode: value("cvCustTaxCode"),
            companyPhone: value("cvCustPhone"),
            companyEmail: value("cvCustEmail"),
            companyWebsite: value("cvCustWebsite"),

            contactName: value("cvContactName"),
            contactTitle: value("cvContactTitle"),
            contactPhone: value("cvContactPhone"),
            contactEmail: value("cvContactEmail"),
            buyingRole: value("cvBuyingRole") || "INFLUENCER",

            createOpportunity: cvCreateOpportunity?.checked ?? true,
            opportunityName: value("cvOppName"),
            opportunityAmount: value("cvOppAmount") ? Number(value("cvOppAmount")) : 0,
            pipelineStageId: value("cvStageId") ? Number(value("cvStageId")) : 1,
            expectedCloseDate: value("cvExpectedCloseDate") || null
        };

        if (isNew && !payload.companyName) {
            alert("Vui lòng nhập tên công ty / doanh nghiệp.");
            document.getElementById("cvCustName")?.focus();
            return;
        }
        if (!isNew && !payload.existingCustomerId) {
            alert("Vui lòng chọn khách hàng doanh nghiệp có sẵn từ danh sách.");
            document.getElementById("cvExistingCustomerId")?.focus();
            return;
        }
        if (!payload.contactName) {
            alert("Vui lòng nhập họ và tên người liên hệ.");
            document.getElementById("cvContactName")?.focus();
            return;
        }
        if (payload.createOpportunity && !payload.opportunityName) {
            alert("Vui lòng nhập tên cơ hội kinh doanh.");
            document.getElementById("cvOppName")?.focus();
            return;
        }

        const submitBtn = convertForm.querySelector('button[type="submit"]');
        const origText = submitBtn?.textContent || "";
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "⏳ Đang chuyển đổi..."; }

        try {
            const res = await api(`/api/leads/${leadId}/convert`, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            closeConvertModal();
            const msg = `🎉 Chuyển đổi Lead thành công!\n` +
                        `• Khách hàng doanh nghiệp: #${res.customerId} - ${res.companyName || ''}\n` +
                        `• Người liên hệ: #${res.contactId} - ${res.contactName || ''}\n` +
                        (res.opportunityId ? `• Cơ hội bán hàng: #${res.opportunityId} - ${res.opportunityName || ''}\n` : '') +
                        `• Đã chuyển ${res.activitiesMoved || 0} hoạt động tương tác vào khách hàng mới.\n` +
                        `Lead gốc đã được khóa bảo vệ.`;
            alert(msg);
            await loadCustomers();
        } catch (error) {
            alert("Lỗi khi chuyển đổi lead: " + error.message);
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origText; }
        }
    });

    // 3. Delegate Accept / Reject / Convert click
    document.addEventListener("click", async e => {
        const acceptBtn = e.target.closest("[data-accept-id]");
        if (acceptBtn) {
            const id = Number(acceptBtn.dataset.acceptId);
            if (!confirm("Bạn có chắc chắn muốn tiếp nhận lead này để chăm sóc?")) return;
            try {
                await api(`/api/leads/${id}/accept`, { method: "POST" });
                if (typeof window.crmToast === "function") {
                    window.crmToast("✓ Đã tiếp nhận lead thành công! Trạng thái chuyển sang Đang chăm sóc.", "success");
                } else {
                    alert("✓ Đã tiếp nhận lead thành công! Trạng thái chuyển sang Đang chăm sóc.");
                }
                await loadCustomers();
            } catch (err) {
                alert("Lỗi khi tiếp nhận lead: " + err.message);
            }
            return;
        }

        const rejectBtn = e.target.closest("[data-reject-id]");
        if (rejectBtn) {
            const id = Number(rejectBtn.dataset.rejectId);
            const name = rejectBtn.dataset.rejectName || "";
            openRejectModal(id, name);
            return;
        }

        const convertBtn = e.target.closest("[data-convert-id]");
        if (convertBtn) {
            const id = Number(convertBtn.dataset.convertId);
            await openConvertModal(id);
            return;
        }
    });
}

/* =========================================================
   INITIALIZATION
========================================================= */
async function init() {
    initManualLeadModal();
    initSlaAndConversion();
    await initUserProfile();
    await loadCustomerCustomFields();
    await loadOwnersIntoFilter();
    await loadSavedFilters();
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

let isInitialized = false;
async function safeInit() {
    if (isInitialized) return;
    isInitialized = true;
    await init();
}

document.addEventListener("DOMContentLoaded", safeInit);
if (document.readyState === "complete" || document.readyState === "interactive") {
    safeInit();
}