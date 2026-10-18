"use strict";

const API_BASE = "http://localhost:8080/crm";

let stages = [];
let opportunities = [];
let customers = [];
let winReasons = [];
let lossReasons = [];
let competitors = [];
let teams = [];
let currentUser = null;
let currentCustomerContacts = [];

let draggedOppId = null;
let closingOppId = null;
let editingOppId = null;
let productCatalog = [];
let currentOpportunityItems = [];
let pendingStageOverride = null;

const pipelineBoard = document.getElementById("pipelineBoard");
const opportunityDrawer = document.getElementById("opportunityDrawer");
const opportunityOverlay = document.getElementById("opportunityOverlay");
const opportunityForm = document.getElementById("opportunityForm");
const searchInput = document.getElementById("pipelineSearch");
const stageFilter = document.getElementById("stageFilter");
const ownerFilter = document.getElementById("ownerFilter");
const productFilter = document.getElementById("productFilter");
const amountMin = document.getElementById("amountMin");
const amountMax = document.getElementById("amountMax");
const teamFilter = document.getElementById("teamFilter");
const closeDatePreset = document.getElementById("closeDatePreset");
const customDateRangeWrap = document.getElementById("customDateRangeWrap");
const closeDateFrom = document.getElementById("closeDateFrom");
const closeDateTo = document.getElementById("closeDateTo");
const leadSourceFilter = document.getElementById("leadSourceFilter");

// Saved Filters state & elements (User Story 2)
let savedFiltersList = [];
const savedFiltersSelect = document.getElementById("savedFiltersSelect");
const btnSaveFilterModal = document.getElementById("btnSaveFilterModal");
const btnDeleteSavedFilter = document.getElementById("btnDeleteSavedFilter");
const saveFilterModal = document.getElementById("saveFilterModal");
const saveFilterOverlay = document.getElementById("saveFilterOverlay");
const saveFilterForm = document.getElementById("saveFilterForm");
const savedFilterNameInput = document.getElementById("savedFilterNameInput");
const saveFilterError = document.getElementById("saveFilterError");

// Custom Fields state & elements for Opportunity
let oppCustomFields = [];
const btnExportOppExcel = document.getElementById("btnExportOppExcel");
const oppCustomFieldSelect = document.getElementById("oppCustomFieldSelect");
const oppCustomFieldValue = document.getElementById("oppCustomFieldValue");
const oppCustomFieldSelectValue = document.getElementById("oppCustomFieldSelectValue");
const opportunityCustomFieldsSection = document.getElementById("opportunityCustomFieldsSection");
const opportunityCustomFieldsContainer = document.getElementById("opportunityCustomFieldsContainer");

// Story 1, 2, 3 state & elements
let reopeningOppId = null;
let stagnantFilterActive = false;
let activePipelineTab = "KANBAN"; // "KANBAN" or "FORECAST"
let currentForecastPeriod = "THIS_MONTH"; // THIS_MONTH, NEXT_MONTH, THIS_QUARTER
let currentForecastGroupBy = "USER"; // USER or TEAM

const tabKanbanView = document.getElementById("tabKanbanView");
const tabForecastView = document.getElementById("tabForecastView");
const tabStagnantView = document.getElementById("tabStagnantView");
const tabStagnantBadge = document.getElementById("tabStagnantBadge");
const pipelineFilterSection = document.getElementById("pipelineFilterSection");
const forecastSection = document.getElementById("forecastSection");
const stagnantSection = document.getElementById("stagnantSection");
const btnScanStagnantView = document.getElementById("btnScanStagnantView");

const btnStagnantFilter = document.getElementById("btnStagnantFilter");
const stagnantBadgeCount = document.getElementById("stagnantBadgeCount");
const btnScanStagnant = document.getElementById("btnScanStagnant");

const reopenDealModal = document.getElementById("reopenDealModal");
const reopenDealOverlay = document.getElementById("reopenDealOverlay");
const reopenDealForm = document.getElementById("reopenDealForm");
const reopenDealReason = document.getElementById("reopenDealReason");
const reopenDealError = document.getElementById("reopenDealError");
const btnDrawerReopenDeal = document.getElementById("btnDrawerReopenDeal");

// User Story: Opportunity Reassignment state & elements
let selectedOppIds = new Set();
let assignableUsersList = null;
let reassigningOppIds = [];
const btnDrawerReassignOpp = document.getElementById("btnDrawerReassignOpp");
const btnQuickReassignInDrawer = document.getElementById("btnQuickReassignInDrawer");
const reassignOpportunityModal = document.getElementById("reassignOpportunityModal");
const reassignOpportunityOverlay = document.getElementById("reassignOpportunityOverlay");
const reassignOpportunityForm = document.getElementById("reassignOpportunityForm");
const pipelineBulkActionBar = document.getElementById("pipelineBulkActionBar");
const bulkSelectedCount = document.getElementById("bulkSelectedCount");

const dealModal = document.getElementById("closeDealModal");
const dealOverlay = document.getElementById("closeDealOverlay");

/* =========================================================
   API HELPER
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
   INITIALIZATION
========================================================= */
async function initPipeline() {
    try {
        await loadSession();
        await Promise.all([
            loadStages(),
            loadWinLossAndCompetitors(),
            loadCustomers(),
            loadTeams(),
            loadUsersForFilter(),
            loadOppCustomFields(),
            loadProductCatalog(),
            loadSavedFilters()
        ]);
        populateStageFilter();
        populateProductFilter();
        setupOppProductEventListeners();
        setupStoryEventListeners();
        setupCollaborationAndFilterListeners();
        await loadOpportunities();
    } catch (err) {
        console.error("Initialization error:", err);
    }
}

async function loadSession() {
    try {
        const data = await api("/api/auth/session");
        if (data) {
            currentUser = data;
            const scope = data.dataScope || data.scope || "";
            // Criteria: Sales rep by default only sees their own opportunities
            if (scope === "SELF" || (!scope.includes("ALL") && !scope.includes("TEAM"))) {
                if (ownerFilter) ownerFilter.value = "MINE";
            }
            // Hiển thị tab Đình trệ riêng cho Trưởng nhóm trở lên (TEAM_LEAD, DIRECTOR, ADMIN)
            if (isTeamLeadOrAbove()) {
                if (tabStagnantView) tabStagnantView.style.display = "inline-flex";
            } else {
                if (tabStagnantView) tabStagnantView.style.display = "none";
            }
        }
    } catch (e) {
        console.warn("Could not load session:", e);
    }
}

async function loadStages() {
    try {
        const data = await api("/api/pipeline-stages?pipelineId=1");
        if (Array.isArray(data) && data.length > 0) {
            stages = data.map(s => ({
                id: s.id,
                name: s.name,
                orderNo: s.orderNo || s.stageOrder || 0,
                probability: s.probability !== undefined ? s.probability : (s.winProbability || 0),
                isWon: !!s.isWon,
                isLost: !!s.isLost
            })).sort((a, b) => a.orderNo - b.orderNo);
        }
    } catch (err) {
        console.warn("Could not load stages from API, using default stages:", err);
    }

    if (!stages || stages.length === 0) {
        stages = [
            { id: 1, name: "Khảo sát nhu cầu", orderNo: 1, probability: 10 },
            { id: 2, name: "Đánh giá & Xác định nhu cầu", orderNo: 2, probability: 25 },
            { id: 3, name: "Gửi đề xuất & Báo giá", orderNo: 3, probability: 50 },
            { id: 4, name: "Thương lượng & Đàm phán", orderNo: 4, probability: 75 },
            { id: 5, name: "Chốt thành công (Won)", orderNo: 5, probability: 100, isWon: true },
            { id: 6, name: "Đóng Thua (Lost)", orderNo: 6, probability: 0, isLost: true }
        ];
    }

    populateStageSelect();
}

async function loadWinLossAndCompetitors() {
    try {
        const reasons = await api("/api/win-loss-reasons");
        if (Array.isArray(reasons)) {
            winReasons = reasons.filter(r => (r.type || r.reasonType || "").toUpperCase() === "WIN" && (r.active !== false));
            lossReasons = reasons.filter(r => (r.type || r.reasonType || "").toUpperCase() === "LOSS" && (r.active !== false));
        }
    } catch (err) {
        console.warn("Could not load win/loss reasons:", err);
    }

    try {
        const comps = await api("/api/competitors");
        if (Array.isArray(comps)) {
            competitors = comps.filter(c => c.active !== false);
        }
    } catch (err) {
        console.warn("Could not load competitors:", err);
    }

    populateWinLossSelects();
}

async function loadCustomers() {
    try {
        const list = await api("/api/customers");
        if (Array.isArray(list)) {
            customers = list;
        }
    } catch (err) {
        console.warn("Could not load customers:", err);
    }
    populateCustomerSelect();
}

async function loadTeams() {
    try {
        const res = await api("/api/teams?active=true");
        const list = res?.teams || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
            teams = list;
            if (teamFilter) {
                teamFilter.innerHTML = '<option value="">Tất cả nhóm</option>';
                teams.forEach(t => {
                    const opt = document.createElement("option");
                    opt.value = t.id;
                    opt.textContent = t.name;
                    teamFilter.appendChild(opt);
                });
            }
        }
    } catch (e) {
        console.warn("Could not load teams:", e);
    }
}

async function loadUsersForFilter() {
    try {
        const res = await api("/api/users?size=100");
        const list = res?.items || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0 && ownerFilter) {
            const currentSelected = ownerFilter.value || "MINE";
            ownerFilter.innerHTML = `
                <option value="">Tất cả người sở hữu</option>
                <option value="MINE" ${currentSelected === "MINE" ? "selected" : ""}>Cơ hội của tôi</option>
            `;
            list.forEach(u => {
                const opt = document.createElement("option");
                opt.value = u.id;
                opt.textContent = u.fullName || u.email;
                if (String(u.id) === currentSelected) opt.selected = true;
                ownerFilter.appendChild(opt);
            });
        }
    } catch (e) {
        console.warn("Could not load users for filter:", e);
    }
}

async function loadContactsForCustomer(customerId, selectedContactId = null, fallbackName = "") {
    const contactSelect = document.getElementById("opportunityContact");
    const manualInput = document.getElementById("opportunityContactManual");
    if (!contactSelect) return;

    currentCustomerContacts = [];

    if (!customerId) {
        contactSelect.innerHTML = '<option value="">-- Chọn người liên hệ --</option><option value="__manual__">+ Nhập tên khác...</option>';
        if (manualInput) {
            manualInput.style.display = "none";
            manualInput.value = "";
        }
        return;
    }

    try {
        const data = await api(`/api/contacts?customerId=${customerId}`);
        currentCustomerContacts = Array.isArray(data) ? data : [];
    } catch (e) {
        console.warn("Could not load contacts:", e);
        currentCustomerContacts = [];
    }

    contactSelect.innerHTML = '<option value="">-- Chọn người liên hệ --</option>';
    let matched = false;

    currentCustomerContacts.forEach(ct => {
        const opt = document.createElement("option");
        opt.value = ct.id;
        const role = ct.title || ct.buyingRole || "";
        opt.textContent = `${ct.name}${role ? ' (' + role + ')' : ''}`;
        if (selectedContactId && String(ct.id) === String(selectedContactId)) {
            opt.selected = true;
            matched = true;
        } else if (!selectedContactId && (ct.isPrimary || ct.is_primary)) {
            opt.selected = true;
            matched = true;
        }
        contactSelect.appendChild(opt);
    });

    const manualOpt = document.createElement("option");
    manualOpt.value = "__manual__";
    manualOpt.textContent = "+ Nhập tên khác...";
    contactSelect.appendChild(manualOpt);

    if (!matched && fallbackName) {
        contactSelect.value = "__manual__";
        if (manualInput) {
            manualInput.style.display = "block";
            manualInput.value = fallbackName;
        }
    } else {
        if (manualInput) {
            manualInput.style.display = contactSelect.value === "__manual__" ? "block" : "none";
            if (contactSelect.value !== "__manual__") manualInput.value = "";
        }
    }
}

async function loadOpportunities() {
    try {
        const params = new URLSearchParams();

        const kw = (searchInput?.value || "").trim();
        if (kw) params.append("keyword", kw);

        const stageVal = stageFilter?.value || "";
        if (stageVal) params.append("stageId", stageVal);

        const ownerVal = ownerFilter?.value || "";
        if (ownerVal === "MINE" || ownerVal === "Tôi") {
            params.append("ownerFilter", "MINE");
        } else if (ownerVal && !isNaN(ownerVal)) {
            params.append("ownerId", ownerVal);
        }

        const prodVal = productFilter?.value || "";
        if (prodVal) params.append("productId", prodVal);

        const minAmt = amountMin?.value || "";
        if (minAmt) params.append("minAmount", minAmt);

        const maxAmt = amountMax?.value || "";
        if (maxAmt) params.append("maxAmount", maxAmt);

        const teamVal = teamFilter?.value || "";
        if (teamVal) params.append("teamId", teamVal);

        const leadSrcVal = leadSourceFilter?.value || "";
        if (leadSrcVal) params.append("leadSource", leadSrcVal);

        const preset = closeDatePreset?.value || "";
        if (preset === "CUSTOM") {
            if (closeDateFrom?.value) params.append("closeDateFrom", closeDateFrom.value);
            if (closeDateTo?.value) params.append("closeDateTo", closeDateTo.value);
        } else if (preset) {
            const range = getCloseDateRangeFromPreset(preset);
            if (range.from) params.append("closeDateFrom", range.from);
            if (range.to) params.append("closeDateTo", range.to);
        }

        const cfKey = oppCustomFieldSelect?.value || "";
        let cfVal = "";
        const cfDef = oppCustomFields.find(f => f.key === cfKey);
        if (cfDef?.fieldType === "SELECT") {
            cfVal = oppCustomFieldSelectValue?.value || "";
        } else {
            cfVal = oppCustomFieldValue?.value.trim() || "";
        }
        if (cfKey && cfVal) {
            params.append("customFieldKey", cfKey);
            params.append("customFieldValue", cfVal);
        }

        if (stagnantFilterActive) {
            params.append("stagnantOnly", "true");
        }

        const qs = params.toString() ? "?" + params.toString() : "";
        const list = await api("/api/opportunities" + qs);
        if (Array.isArray(list)) {
            opportunities = list;
            // Update stagnant badge count
            const stagnantCount = opportunities.filter(o => o.status === "OPEN" && (o.isStagnant === true || o.isStagnant === 1) && o.stagnantFlag && o.stagnantFlag !== "NONE").length;
            if (stagnantBadgeCount) {
                if (stagnantCount > 0) {
                    stagnantBadgeCount.textContent = stagnantCount;
                    stagnantBadgeCount.style.display = "inline-block";
                } else {
                    stagnantBadgeCount.style.display = "none";
                }
            }
            if (tabStagnantBadge) {
                tabStagnantBadge.textContent = stagnantCount;
                if (stagnantCount > 0) {
                    tabStagnantBadge.style.display = "inline-block";
                } else {
                    tabStagnantBadge.style.display = "none";
                }
            }
            if (activePipelineTab === "STAGNANT") {
                renderStagnantSection();
            }
            try {
                localStorage.setItem("crm_ui_opportunities", JSON.stringify(opportunities.map(o => ({
                    id: o.id,
                    name: o.name,
                    customer: o.customerName || "",
                    value: o.amount || 0,
                    stage: String(o.stageId),
                    probability: o.probability || 0,
                    closeDate: o.expectedCloseDate || "",
                    owner: o.ownerName || "Tôi",
                    status: o.status
                }))));
            } catch (_) {}
        }
    } catch (err) {
        console.warn("Could not load opportunities from backend, checking cache:", err);
        try {
            const cached = JSON.parse(localStorage.getItem("crm_ui_opportunities"));
            if (Array.isArray(cached)) opportunities = cached;
        } catch (_) {}
    }

    render();
}

function getCloseDateRangeFromPreset(preset) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (preset === "OVERDUE") {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return { from: "", to: formatDate(yesterday) };
    }
    if (preset === "THIS_MONTH") {
        const first = new Date(y, m, 1);
        const last = new Date(y, m + 1, 0);
        return { from: formatDate(first), to: formatDate(last) };
    }
    if (preset === "NEXT_MONTH") {
        const first = new Date(y, m + 1, 1);
        const last = new Date(y, m + 2, 0);
        return { from: formatDate(first), to: formatDate(last) };
    }
    if (preset === "THIS_QUARTER") {
        const quarterStartMonth = Math.floor(m / 3) * 3;
        const first = new Date(y, quarterStartMonth, 1);
        const last = new Date(y, quarterStartMonth + 3, 0);
        return { from: formatDate(first), to: formatDate(last) };
    }
    return { from: "", to: "" };
}

function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* =========================================================
   POPULATE DROPDOWNS
========================================================= */
function populateStageSelect() {
    const stageSelect = document.getElementById("opportunityStage");
    if (!stageSelect) return;
    stageSelect.innerHTML = "";
    stages.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st.id;
        opt.textContent = `${st.name} (${st.probability}%)`;
        stageSelect.appendChild(opt);
    });
}

function populateCustomerSelect() {
    const custSelect = document.getElementById("opportunityCustomer");
    if (!custSelect) return;
    custSelect.innerHTML = '<option value="">-- Chọn khách hàng --</option>';
    customers.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.code || c.phone || ""})`;
        custSelect.appendChild(opt);
    });
}

function populateWinLossSelects() {
    const winSelect = document.getElementById("winReason");
    if (winSelect) {
        winSelect.innerHTML = '<option value="">-- Chọn lý do Thắng --</option>';
        winReasons.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.id;
            opt.textContent = r.name || r.reasonText;
            winSelect.appendChild(opt);
        });
    }

    const lossSelect = document.getElementById("lossReason");
    if (lossSelect) {
        lossSelect.innerHTML = '<option value="">-- Chọn lý do Thua --</option>';
        lossReasons.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.id;
            opt.textContent = r.name || r.reasonText;
            lossSelect.appendChild(opt);
        });
    }

    const compSelect = document.getElementById("lossCompetitor");
    if (compSelect) {
        compSelect.innerHTML = '<option value="">-- Chọn đối thủ thắng thầu --</option>';
        competitors.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.name;
            compSelect.appendChild(opt);
        });
    }
}

/* =========================================================
   EVENT LISTENERS
========================================================= */
document.getElementById("addOpportunityButton")?.addEventListener("click", () => {
    openOpportunityDrawer();
});

document.getElementById("closeOpportunityDrawer")?.addEventListener("click", closeOpportunityDrawer);
document.getElementById("cancelOpportunity")?.addEventListener("click", closeOpportunityDrawer);
opportunityOverlay?.addEventListener("click", closeOpportunityDrawer);

document.getElementById("opportunityCustomer")?.addEventListener("change", async event => {
    const custId = event.target.value ? Number(event.target.value) : null;
    await loadContactsForCustomer(custId);
});

document.getElementById("opportunityContact")?.addEventListener("change", event => {
    const manualInput = document.getElementById("opportunityContactManual");
    if (manualInput) {
        manualInput.style.display = event.target.value === "__manual__" ? "block" : "none";
        if (event.target.value === "__manual__") manualInput.focus();
    }
});

document.getElementById("opportunityStage")?.addEventListener("change", event => {
    const stageId = Number(event.target.value);
    const selected = stages.find(s => s.id === stageId);
    if (selected) {
        const probInput = document.getElementById("opportunityProbability");
        if (probInput) probInput.value = selected.probability;
    }
});

searchInput?.addEventListener("input", debounce(loadOpportunities, 300));
ownerFilter?.addEventListener("change", loadOpportunities);
teamFilter?.addEventListener("change", loadOpportunities);
leadSourceFilter?.addEventListener("change", loadOpportunities);

closeDatePreset?.addEventListener("change", () => {
    if (customDateRangeWrap) {
        customDateRangeWrap.style.display = closeDatePreset.value === "CUSTOM" ? "flex" : "none";
    }
    if (closeDatePreset.value === "CUSTOM") {
        const advPanel = document.getElementById("pipelineAdvancedPanel");
        if (advPanel) advPanel.style.display = "block";
        document.getElementById("btnTogglePipelineAdvanced")?.classList.add("open");
    } else {
        loadOpportunities();
    }
});

closeDateFrom?.addEventListener("change", () => {
    if (closeDatePreset?.value === "CUSTOM") loadOpportunities();
});
closeDateTo?.addEventListener("change", () => {
    if (closeDatePreset?.value === "CUSTOM") loadOpportunities();
});

/* Custom Fields Logic for Opportunity */
async function loadOppCustomFields() {
    try {
        const res = await api("/api/custom-fields?entityType=OPPORTUNITY&active=true");
        oppCustomFields = Array.isArray(res?.data) ? res.data : [];
        populateOppCustomFieldFilterSelect();
    } catch (e) {
        console.warn("Could not load opportunity custom fields:", e);
        oppCustomFields = [];
    }
}

function populateOppCustomFieldFilterSelect() {
    if (!oppCustomFieldSelect) return;
    const currentVal = oppCustomFieldSelect.value;
    oppCustomFieldSelect.innerHTML = '<option value="">✨ Lọc trường tùy chỉnh</option>';
    oppCustomFields.forEach(cf => {
        const opt = document.createElement("option");
        opt.value = cf.key;
        opt.textContent = `${cf.label} (${cf.fieldType})`;
        oppCustomFieldSelect.appendChild(opt);
    });
    if (currentVal) oppCustomFieldSelect.value = currentVal;
}

function renderOppCustomFieldInputs(existingValues = {}) {
    if (!opportunityCustomFieldsContainer) return;
    opportunityCustomFieldsContainer.innerHTML = "";

    if (!oppCustomFields || oppCustomFields.length === 0) {
        if (opportunityCustomFieldsSection) opportunityCustomFieldsSection.style.display = "none";
        return;
    }

    if (opportunityCustomFieldsSection) opportunityCustomFieldsSection.style.display = "block";

    oppCustomFields.forEach(cf => {
        const wrap = document.createElement("div");
        wrap.className = "field-group";
        const val = existingValues[cf.key] !== undefined && existingValues[cf.key] !== null ? String(existingValues[cf.key]) : "";

        let inputHtml = "";
        const requiredAttr = cf.required ? 'data-required="true"' : 'data-required="false"';
        const requiredAsterisk = cf.required ? '<em style="color:#ef4444; font-weight:700;"> *</em>' : '';

        if (cf.fieldType === "TEXT") {
            inputHtml = `<input id="opp_cf_${cf.key}" class="crm-input opp-cf-input" type="text" data-key="${cf.key}" data-label="${escapeHtml(cf.label)}" ${requiredAttr} value="${escapeHtml(val)}" placeholder="Nhập ${escapeHtml(cf.label)}...">`;
        } else if (cf.fieldType === "NUMBER") {
            inputHtml = `<input id="opp_cf_${cf.key}" class="crm-input opp-cf-input" type="number" step="any" data-key="${cf.key}" data-label="${escapeHtml(cf.label)}" ${requiredAttr} value="${escapeHtml(val)}" placeholder="0">`;
        } else if (cf.fieldType === "DATE") {
            inputHtml = `<input id="opp_cf_${cf.key}" class="crm-input opp-cf-input" type="date" data-key="${cf.key}" data-label="${escapeHtml(cf.label)}" ${requiredAttr} value="${escapeHtml(val)}">`;
        } else if (cf.fieldType === "SELECT") {
            const options = Array.isArray(cf.options) ? cf.options : [];
            const optsHtml = options.map(opt => `<option value="${escapeHtml(opt)}" ${opt === val ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join("");
            inputHtml = `<select id="opp_cf_${cf.key}" class="crm-input opp-cf-input" data-key="${cf.key}" data-label="${escapeHtml(cf.label)}" ${requiredAttr}>
                <option value="">-- Chọn ${escapeHtml(cf.label)} --</option>
                ${optsHtml}
            </select>`;
        } else {
            inputHtml = `<input id="opp_cf_${cf.key}" class="crm-input opp-cf-input" type="text" data-key="${cf.key}" data-label="${escapeHtml(cf.label)}" ${requiredAttr} value="${escapeHtml(val)}">`;
        }

        wrap.innerHTML = `
            <label for="opp_cf_${cf.key}" style="font-weight:600; font-size:13px; color:var(--crm-text); margin-bottom:4px; display:block;">
                ${escapeHtml(cf.label)}${requiredAsterisk}
            </label>
            ${inputHtml}
        `;
        opportunityCustomFieldsContainer.appendChild(wrap);
    });
}

function collectOppCustomFields() {
    const customFields = {};
    if (!oppCustomFields || oppCustomFields.length === 0) return customFields;

    const inputs = document.querySelectorAll(".opp-cf-input");
    for (const input of inputs) {
        const key = input.dataset.key;
        const label = input.dataset.label || key;
        const isRequired = input.dataset.required === "true";
        const val = input.value.trim();

        if (isRequired && !val) {
            throw new Error(`Trường tùy chỉnh "${label}" là bắt buộc.`);
        }

        if (val) {
            const cfDef = oppCustomFields.find(f => f.key === key);
            if (cfDef?.fieldType === "NUMBER") {
                const num = Number(val);
                if (isNaN(num)) throw new Error(`Trường "${label}" phải là số.`);
                customFields[key] = num;
            } else {
                customFields[key] = val;
            }
        }
    }
    return customFields;
}

oppCustomFieldSelect?.addEventListener("change", () => {
    const selectedKey = oppCustomFieldSelect.value;
    if (!selectedKey) {
        if (oppCustomFieldValue) { oppCustomFieldValue.style.display = "none"; oppCustomFieldValue.value = ""; }
        if (oppCustomFieldSelectValue) { oppCustomFieldSelectValue.style.display = "none"; oppCustomFieldSelectValue.value = ""; }
        loadOpportunities();
        return;
    }

    const cfDef = oppCustomFields.find(f => f.key === selectedKey);
    if (cfDef && cfDef.fieldType === "SELECT") {
        if (oppCustomFieldValue) oppCustomFieldValue.style.display = "none";
        if (oppCustomFieldSelectValue) {
            oppCustomFieldSelectValue.style.display = "block";
            oppCustomFieldSelectValue.innerHTML = '<option value="">-- Tất cả --</option>';
            const options = Array.isArray(cfDef.options) ? cfDef.options : [];
            options.forEach(opt => {
                const o = document.createElement("option");
                o.value = opt;
                o.textContent = opt;
                oppCustomFieldSelectValue.appendChild(o);
            });
        }
    } else {
        if (oppCustomFieldSelectValue) oppCustomFieldSelectValue.style.display = "none";
        if (oppCustomFieldValue) {
            oppCustomFieldValue.style.display = "block";
            oppCustomFieldValue.placeholder = `Lọc theo ${cfDef ? cfDef.label : ''}...`;
        }
    }
});

oppCustomFieldValue?.addEventListener("input", debounce(loadOpportunities, 400));
oppCustomFieldSelectValue?.addEventListener("change", loadOpportunities);

btnExportOppExcel?.addEventListener("click", () => {
    const params = new URLSearchParams();
    const kw = (searchInput?.value || "").trim();
    if (kw) params.append("keyword", kw);

    const stageVal = stageFilter?.value || "";
    if (stageVal) params.append("stageId", stageVal);

    const productVal = productFilter?.value || "";
    if (productVal) params.append("productId", productVal);

    const minAmt = amountMin?.value ? amountMin.value.trim() : "";
    if (minAmt) params.append("minAmount", minAmt);

    const maxAmt = amountMax?.value ? amountMax.value.trim() : "";
    if (maxAmt) params.append("maxAmount", maxAmt);

    if (stagnantFilterActive) {
        params.append("stagnantOnly", "true");
    }

    const ownerVal = ownerFilter?.value || "";
    if (ownerVal === "MINE" || ownerVal === "Tôi") {
        params.append("ownerFilter", "MINE");
    } else if (ownerVal && !isNaN(ownerVal)) {
        params.append("ownerId", ownerVal);
    }

    const teamVal = teamFilter?.value || "";
    if (teamVal) params.append("teamId", teamVal);

    const leadSrcVal = leadSourceFilter?.value || "";
    if (leadSrcVal) params.append("leadSource", leadSrcVal);

    const preset = closeDatePreset?.value || "";
    if (preset === "CUSTOM") {
        if (closeDateFrom?.value) params.append("closeDateFrom", closeDateFrom.value);
        if (closeDateTo?.value) params.append("closeDateTo", closeDateTo.value);
    } else if (preset) {
        const range = getCloseDateRangeFromPreset(preset);
        if (range.from) params.append("closeDateFrom", range.from);
        if (range.to) params.append("closeDateTo", range.to);
    }

    const cfKey = oppCustomFieldSelect?.value || "";
    let cfVal = "";
    const cfDef = oppCustomFields.find(f => f.key === cfKey);
    if (cfDef?.fieldType === "SELECT") {
        cfVal = oppCustomFieldSelectValue?.value || "";
    } else {
        cfVal = oppCustomFieldValue?.value.trim() || "";
    }
    if (cfKey && cfVal) {
        params.append("customFieldKey", cfKey);
        params.append("customFieldValue", cfVal);
    }

    const url = `${API_BASE}/api/opportunities/export?${params.toString()}`;
    window.location.href = url;
});

document.getElementById("resetPipelineFilter")?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (stageFilter) stageFilter.value = "";
    if (productFilter) productFilter.value = "";
    if (amountMin) amountMin.value = "";
    if (amountMax) amountMax.value = "";
    if (savedFiltersSelect) savedFiltersSelect.value = "";
    if (btnDeleteSavedFilter) btnDeleteSavedFilter.disabled = true;
    if (ownerFilter) {
        const scope = currentUser?.dataScope || "";
        ownerFilter.value = (scope === "SELF" || (!scope.includes("ALL") && !scope.includes("TEAM"))) ? "MINE" : "";
    }
    if (teamFilter) teamFilter.value = "";
    if (leadSourceFilter) leadSourceFilter.value = "";
    if (closeDatePreset) closeDatePreset.value = "";
    if (customDateRangeWrap) customDateRangeWrap.style.display = "none";
    if (closeDateFrom) closeDateFrom.value = "";
    if (closeDateTo) closeDateTo.value = "";
    if (oppCustomFieldSelect) oppCustomFieldSelect.value = "";
    if (oppCustomFieldValue) { oppCustomFieldValue.value = ""; oppCustomFieldValue.style.display = "none"; }
    if (oppCustomFieldSelectValue) { oppCustomFieldSelectValue.value = ""; oppCustomFieldSelectValue.style.display = "none"; }
    stagnantFilterActive = false;
    if (btnStagnantFilter) {
        btnStagnantFilter.classList.remove("active");
        btnStagnantFilter.classList.remove("crm-btn-primary");
        btnStagnantFilter.classList.add("crm-btn-secondary");
        btnStagnantFilter.style.background = "";
        btnStagnantFilter.style.borderColor = "";
        btnStagnantFilter.style.color = "";
    }
    const pipelineAdvancedPanel = document.getElementById("pipelineAdvancedPanel");
    if (pipelineAdvancedPanel) pipelineAdvancedPanel.style.display = "none";
    document.getElementById("btnTogglePipelineAdvanced")?.classList.remove("open");
    const advBadge = document.getElementById("pipelineAdvancedBadge");
    if (advBadge) advBadge.style.display = "none";
    loadOpportunities();
});

/* Drawer form submit */
opportunityForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const name = fieldValue("opportunityName");
    const nameError = document.getElementById("opportunityNameError");
    if (!name) {
        if (nameError) nameError.textContent = "Vui lòng nhập tên cơ hội.";
        return;
    }
    if (nameError) nameError.textContent = "";

    const customerIdVal = document.getElementById("opportunityCustomer")?.value;
    const custError = document.getElementById("opportunityCustomerError");
    if (!customerIdVal) {
        if (custError) custError.textContent = "Vui lòng chọn khách hàng.";
        return;
    }
    if (custError) custError.textContent = "";

    const customerId = Number(customerIdVal);

    // Contact handling
    const contactSelectVal = document.getElementById("opportunityContact")?.value;
    let contactId = null;
    let contactName = null;
    if (contactSelectVal === "__manual__") {
        contactName = fieldValue("opportunityContactManual");
    } else if (contactSelectVal) {
        contactId = Number(contactSelectVal);
        const selectedContact = currentCustomerContacts.find(c => c.id === contactId);
        if (selectedContact) {
            contactName = selectedContact.name;
        }
    }

    const leadSource = document.getElementById("opportunityLeadSource")?.value || null;

    // Expected close date validation (SCRUM-72 Criteria 4: Ngày dự kiến chốt không được ở quá khứ khi tạo mới)
    const expectedCloseDate = fieldValue("opportunityCloseDate") || null;
    const closeDateError = document.getElementById("opportunityCloseDateError");
    if (!editingOppId) {
        if (!expectedCloseDate) {
            if (closeDateError) closeDateError.textContent = "Vui lòng chọn ngày dự kiến chốt.";
            return;
        }
        if (expectedCloseDate < todayString()) {
            if (closeDateError) closeDateError.textContent = "Ngày dự kiến chốt không được ở trong quá khứ khi tạo mới cơ hội.";
            return;
        }
    }
    if (closeDateError) closeDateError.textContent = "";

    const stageId = Number(document.getElementById("opportunityStage").value) || stages[0]?.id;
    const probability = clamp(Number(document.getElementById("opportunityProbability").value) || 0, 0, 100);
    const probabilityNote = fieldValue("opportunityProbabilityNote") || null;
    const amount = Math.max(0, Number(document.getElementById("opportunityValue").value) || 0);

    let customFields = {};
    try {
        customFields = collectOppCustomFields();
    } catch (cfErr) {
        alert(cfErr.message);
        return;
    }

    const payload = {
        name,
        customerId,
        contactId,
        contactName,
        leadSource,
        stageId,
        probability,
        probabilityNote,
        amount,
        expectedCloseDate,
        customFields,
        items: currentOpportunityItems
    };

    try {
        if (editingOppId) {
            await api(`/api/opportunities/${editingOppId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
        } else {
            await api("/api/opportunities", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        }

        closeOpportunityDrawer();
        await loadOpportunities();
    } catch (err) {
        alert("Lỗi khi lưu cơ hội: " + err.message);
    }
});

/* =========================================================
   WIN / LOSS MODAL HANDLERS
========================================================= */
document.querySelectorAll(".deal-mode").forEach(button => {
    button.addEventListener("click", () => {
        setDealMode(button.dataset.dealMode);
    });
});

document.querySelectorAll("[data-close-deal]").forEach(button => {
    button.addEventListener("click", closeDeal);
});

document.getElementById("closeDealX")?.addEventListener("click", closeDeal);
dealOverlay?.addEventListener("click", closeDeal);

document.getElementById("wonForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const value = Number(document.getElementById("wonValue").value);
    const date = document.getElementById("wonDate").value;
    const winReasonIdVal = document.getElementById("winReason")?.value;
    const error = document.getElementById("wonError");

    if (!value || value <= 0 || !date) {
        if (error) error.textContent = "Vui lòng nhập giá trị chốt và ngày ký.";
        return;
    }
    if (!winReasonIdVal) {
        if (error) error.textContent = "Vui lòng chọn Lý do Thắng.";
        return;
    }
    if (error) error.textContent = "";

    try {
        await api(`/api/opportunities/${closingOppId}/close`, {
            method: "POST",
            body: JSON.stringify({
                status: "WON",
                winReasonId: Number(winReasonIdVal),
                actualAmount: value,
                amount: value,
                actualCloseDate: date
            })
        });

        closeDeal();
        await loadOpportunities();
    } catch (err) {
        if (error) error.textContent = err.message;
        else alert("Lỗi đóng cơ hội Thắng: " + err.message);
    }
});

document.getElementById("lostForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const reasonIdVal = document.getElementById("lossReason").value;
    const compIdVal = document.getElementById("lossCompetitor")?.value;
    const error = document.getElementById("lostError");

    if (!reasonIdVal) {
        if (error) error.textContent = "Vui lòng chọn lý do thua.";
        return;
    }
    if (error) error.textContent = "";

    try {
        await api(`/api/opportunities/${closingOppId}/close`, {
            method: "POST",
            body: JSON.stringify({
                status: "LOST",
                lossReasonId: Number(reasonIdVal),
                competitorId: compIdVal ? Number(compIdVal) : null
            })
        });

        closeDeal();
        await loadOpportunities();
    } catch (err) {
        if (error) error.textContent = err.message;
        else alert("Lỗi đóng cơ hội Thua: " + err.message);
    }
});

/* =========================================================
   CARD MENU AND ACTION DISPATCHER
========================================================= */
document.addEventListener("click", async event => {
    const menuButton = event.target.closest("[data-card-menu]");
    if (menuButton) {
        event.stopPropagation();
        const id = menuButton.dataset.cardMenu;
        document.querySelectorAll(".card-menu").forEach(menu => {
            if (menu.dataset.menu !== id) menu.classList.remove("open");
        });
        document.querySelector(`[data-menu="${id}"]`)?.classList.toggle("open");
        return;
    }

    const editBtn = event.target.closest("[data-edit-opportunity]");
    if (editBtn) {
        openOpportunityDrawer(Number(editBtn.dataset.editOpportunity));
        return;
    }

    const deleteBtn = event.target.closest("[data-delete-opportunity]");
    if (deleteBtn) {
        const id = Number(deleteBtn.dataset.deleteOpportunity);
        if (confirm("Bạn có chắc chắn muốn xóa cơ hội bán hàng này không?")) {
            try {
                await api(`/api/opportunities/${id}`, { method: "DELETE" });
                await loadOpportunities();
            } catch (err) {
                alert("Lỗi khi xóa cơ hội: " + err.message);
            }
        }
        return;
    }

    const nextBtn = event.target.closest("[data-next-stage]");
    if (nextBtn) {
        const id = Number(nextBtn.dataset.nextStage);
        await moveStageRelatively(id, 1);
        return;
    }

    const prevBtn = event.target.closest("[data-prev-stage]");
    if (prevBtn) {
        const id = Number(prevBtn.dataset.prevStage);
        await moveStageRelatively(id, -1);
        return;
    }

    const wonBtn = event.target.closest("[data-close-won]");
    if (wonBtn) {
        openCloseDeal(Number(wonBtn.dataset.closeWon), "won");
        return;
    }

    const lostBtn = event.target.closest("[data-close-lost]");
    if (lostBtn) {
        openCloseDeal(Number(lostBtn.dataset.closeLost), "lost");
        return;
    }

    const reopenBtn = event.target.closest("[data-reopen-opportunity]");
    if (reopenBtn) {
        openReopenDealModal(Number(reopenBtn.dataset.reopenOpportunity));
        return;
    }

    const reassignBtn = event.target.closest("[data-reassign-opportunity]");
    if (reassignBtn) {
        openReassignModal([Number(reassignBtn.dataset.reassignOpportunity)]);
        return;
    }

    if (!event.target.closest(".opportunity-card")) {
        document.querySelectorAll(".card-menu").forEach(menu => menu.classList.remove("open"));
    }
});

/* =========================================================
   STAGE ADVANCEMENT & TRANSITION
========================================================= */
async function moveStageRelatively(oppId, direction) {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;

    if (opp.status === "WON" || opp.status === "LOST") {
        alert("Cơ hội đã đóng (Thắng/Thua) nên không thể chuyển giai đoạn. Chỉ Trưởng nhóm trở lên mới có quyền Mở lại cơ hội.");
        return;
    }

    const currentStageIndex = stages.findIndex(s => s.id === opp.stageId);
    if (currentStageIndex < 0) return;

    const nextStageIndex = currentStageIndex + direction;
    if (nextStageIndex < 0 || nextStageIndex >= stages.length) return;

    const targetStage = stages[nextStageIndex];

    if (targetStage.isWon) {
        openCloseDeal(oppId, "won");
        return;
    }
    if (targetStage.isLost) {
        openCloseDeal(oppId, "lost");
        return;
    }

    try {
        await api(`/api/opportunities/${oppId}/stage`, {
            method: "POST",
            body: JSON.stringify({ stageId: targetStage.id })
        });
        await loadOpportunities();
    } catch (err) {
        if (err.data?.conditionBlocked) {
            openStageConditionModal(oppId, targetStage.id, err.data);
            return;
        }
        alert("Không thể chuyển giai đoạn: " + err.message);
    }
}

async function moveStageTo(oppId, targetStageId) {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp || opp.stageId === targetStageId) return;

    if (opp.status === "WON" || opp.status === "LOST") {
        alert("Cơ hội đã đóng (Thắng/Thua) nên không thể chuyển giai đoạn. Chỉ Trưởng nhóm trở lên mới có quyền Mở lại cơ hội.");
        render();
        return;
    }

    const targetStage = stages.find(s => s.id === targetStageId);
    if (!targetStage) return;

    if (targetStage.isWon) {
        openCloseDeal(oppId, "won");
        return;
    }
    if (targetStage.isLost) {
        openCloseDeal(oppId, "lost");
        return;
    }

    try {
        await api(`/api/opportunities/${oppId}/stage`, {
            method: "POST",
            body: JSON.stringify({ stageId: targetStageId })
        });
        await loadOpportunities();
    } catch (err) {
        if (err.data?.conditionBlocked) {
            openStageConditionModal(oppId, targetStageId, err.data);
            render();
            return;
        }
        alert("Không thể chuyển giai đoạn: " + err.message);
        render(); // Rollback UI
    }
}

/* =========================================================
   RENDER BOARD & CARDS (Kanban Pipeline & Stagnation Alerts)
========================================================= */
const STAGE_THEME_COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444"];

function render() {
    if (!pipelineBoard) return;
    pipelineBoard.innerHTML = "";

    stages.forEach((st, idx) => {
        const themeColor = STAGE_THEME_COLORS[idx % STAGE_THEME_COLORS.length];

        const col = document.createElement("article");
        col.className = "pipeline-column";
        col.dataset.stage = String(st.id);

        const stageOpps = opportunities.filter(o => o.stageId === st.id);
        const stageTotal = stageOpps.reduce((sum, o) => sum + Number(o.amount || 0), 0);

        col.innerHTML = `
            <header class="column-head" style="border-top-color: ${themeColor}">
                <div>
                    <strong>${escapeHtml(st.name)}</strong>
                    <span class="column-count">${stageOpps.length} cơ hội</span>
                </div>
                <b class="column-total">${formatMoney(stageTotal)}</b>
            </header>
            <div class="column-body" data-drop-zone="${st.id}"></div>
        `;

        const body = col.querySelector(".column-body");
        stageOpps.forEach(opp => {
            body.appendChild(createCard(opp));
        });

        setupDropZone(body, st.id);
        pipelineBoard.appendChild(col);
    });
}

function createCard(record) {
    const card = document.createElement("article");
    card.className = "opportunity-card";
    const isWon = (record.status || "").toUpperCase() === "WON";
    const isLost = (record.status || "").toUpperCase() === "LOST";
    const isClosed = isWon || isLost;

    card.draggable = !isClosed && (window.innerWidth > 768);
    card.dataset.id = String(record.id);

    const currentStageIndex = stages.findIndex(s => s.id === record.stageId);
    const canPrev = currentStageIndex > 0;
    const canNext = currentStageIndex < stages.length - 1;

    // Stagnation & Overdue alert calculations
    const today = todayString();
    const isOpen = !isClosed;
    const isOverdue = isOpen && record.expectedCloseDate && record.expectedCloseDate < today;

    let overdueDays = 0;
    if (isOverdue) {
        if (record.daysOverdue !== undefined && record.daysOverdue > 0) {
            overdueDays = record.daysOverdue;
        } else {
            const diffMs = new Date() - new Date(record.expectedCloseDate);
            overdueDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }
    }

    let daysInStage = 0;
    if (record.daysInStage !== undefined) {
        daysInStage = record.daysInStage;
    } else if (record.stageUpdatedAt) {
        const diffMs = new Date() - new Date(record.stageUpdatedAt);
        daysInStage = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    const isStagnant = Boolean((record.isStagnant === true || record.isStagnant === 1) && record.stagnantFlag && record.stagnantFlag !== "NONE");
    if (isStagnant) {
        card.style.borderLeft = "4px solid #ef4444";
        card.style.background = "#fffbfa";
    }

    // Contact info HTML
    let contactHtml = "";
    if (record.contactName) {
        contactHtml = `<div class="opp-contact-info" title="Người liên hệ chính">👤 <span>${escapeHtml(record.contactName)}</span></div>`;
    }

    // Lead source badge HTML
    let sourceHtml = "";
    if (record.leadSource) {
        sourceHtml = `<span class="opp-badge opp-badge-source" title="Nguồn cơ hội">📍 ${escapeHtml(record.leadSource)}</span>`;
    }

    // Alerts HTML
    let alertsHtml = "";
    if (isWon) {
        alertsHtml += `<div class="opp-badge" style="background:#dcfce7; color:#15803d; font-weight:700; border:1px solid #bbf7d0;">✓ THÀNH CÔNG (WON)</div>`;
    } else if (isLost) {
        alertsHtml += `<div class="opp-badge" style="background:#fee2e2; color:#b91c1c; font-weight:700; border:1px solid #fecaca;">✕ ĐÃ ĐÓNG (LOST)</div>`;
    } else {
        if (isOverdue) {
            alertsHtml += `<div class="opp-badge opp-badge-danger" title="Cơ hội đã quá ngày dự kiến chốt">⚠️ Quá hạn chốt (${overdueDays} ngày)</div>`;
        }
        if (isStagnant) {
            const stagReason = record.stagnantReason || (record.stagnantFlag === "OVERDUE_CLOSE" ? `Quá hạn chốt (${overdueDays} ngày)` : `Đình trệ (${daysInStage} ngày ở giai đoạn này)`);
            alertsHtml += `<div class="opp-badge opp-badge-danger" style="background:#fef2f2; border:1px solid #fecaca; color:#dc2626; font-weight:700;" title="Cảnh báo đình trệ: ${escapeHtml(stagReason)}">🚨 ĐÌNH TRỆ: ${escapeHtml(stagReason)}</div>`;
        }
    }

    let cardMenuHtml = "";
    if (isClosed) {
        cardMenuHtml = `
            <button type="button" data-edit-opportunity="${record.id}">👁 Xem chi tiết (Đã đóng)</button>
            ${isTeamLeadOrAbove() ? `<button type="button" style="color:#0284c7; font-weight:600;" data-reassign-opportunity="${record.id}">🔄 Phân bổ lại</button>` : ""}
            ${isTeamLeadOrAbove() ? `<button type="button" style="color:#2563eb; font-weight:600;" data-reopen-opportunity="${record.id}">🔓 Mở lại cơ hội</button>` : ""}
            ${isTeamLeadOrAbove() ? `<button type="button" style="color:#ef4444;" data-delete-opportunity="${record.id}">🗑 Xóa</button>` : ""}
        `;
    } else {
        cardMenuHtml = `
            <button type="button" data-edit-opportunity="${record.id}">Sửa</button>
            <button type="button" style="color:#059669; font-weight:600;" onclick="window.location.href='quote-editor?opportunityId=${record.id}'">📄 Soạn báo giá</button>
            ${isTeamLeadOrAbove() ? `<button type="button" style="color:#0284c7; font-weight:600;" data-reassign-opportunity="${record.id}">🔄 Phân bổ lại</button>` : ""}
            ${canPrev ? `<button type="button" data-prev-stage="${record.id}">← Giai đoạn trước</button>` : ""}
            ${canNext ? `<button type="button" data-next-stage="${record.id}">Giai đoạn tiếp →</button>` : ""}
            <button type="button" class="won" data-close-won="${record.id}">✓ Đóng Thắng</button>
            <button type="button" class="lost" data-close-lost="${record.id}">✕ Đóng Thua</button>
            <button type="button" style="color:#ef4444;" data-delete-opportunity="${record.id}">🗑 Xóa</button>
        `;
    }

    card.innerHTML = `
        <button class="card-menu-btn" type="button" data-card-menu="${record.id}">⋮</button>

        <div class="card-menu" data-menu="${record.id}">
            ${cardMenuHtml}
        </div>

        <h3>${escapeHtml(record.name)}</h3>

        <div class="opportunity-customer">
            🏢 ${escapeHtml(record.customerName || "Chưa chọn khách hàng")}
        </div>

        ${contactHtml}

        <strong class="opportunity-value">
            ${formatMoney(isWon && record.actualAmount ? record.actualAmount : (record.amount || 0))}
        </strong>

        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:6px;">
            ${sourceHtml}
            ${alertsHtml}
        </div>

        <div class="opportunity-meta">
            <span>${record.probability ?? 0}% xác suất</span>
            <span>📅 ${escapeHtml(isWon && record.actualCloseDate ? record.actualCloseDate : (record.expectedCloseDate || "—"))}</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
            <small style="color:#64748b;font-size:10px;">
                ${escapeHtml(record.stageName || "")}
            </small>
            <div class="card-avatar" title="${escapeHtml(record.ownerName || 'Chưa phân công')}">
                ${initials(record.ownerName || "U")}
            </div>
        </div>
    `;

    card.addEventListener("dragstart", event => {
        if (isClosed) return;
        draggedOppId = record.id;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(record.id));
        requestAnimationFrame(() => card.classList.add("dragging"));
    });

    card.addEventListener("dragend", () => {
        draggedOppId = null;
        card.classList.remove("dragging");
        document.querySelectorAll(".column-body").forEach(zone => zone.classList.remove("drag-over"));
    });

    card.addEventListener("click", event => {
        if (event.target.closest(".card-menu-btn") || event.target.closest(".card-menu") || event.target.closest("button")) return;
        openEditOpportunity(record.id);
    });

    return card;
}

function setupDropZone(zone, stageId) {
    zone.addEventListener("dragover", event => {
        event.preventDefault();
        zone.classList.add("drag-over");
    });
    zone.addEventListener("dragenter", event => {
        event.preventDefault();
        zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", event => {
        if (!zone.contains(event.relatedTarget)) {
            zone.classList.remove("drag-over");
        }
    });
    zone.addEventListener("drop", async event => {
        event.preventDefault();
        zone.classList.remove("drag-over");
        const idVal = draggedOppId || Number(event.dataTransfer.getData("text/plain"));
        if (!idVal) return;
        draggedOppId = null;
        await moveStageTo(Number(idVal), stageId);
    });
}

function setOpportunityFormDisabled(disabled) {
    if (!opportunityForm) return;
    const elements = opportunityForm.querySelectorAll("input, select, textarea");
    elements.forEach(el => {
        el.disabled = disabled;
    });
    const addProdBtn = document.getElementById("btnAddOppProductLine");
    if (addProdBtn) addProdBtn.disabled = disabled;
    document.querySelectorAll(".btn-remove-opp-item").forEach(b => b.disabled = disabled);
}

/* =========================================================
   DRAWER OPEN / CLOSE
========================================================= */
async function openOpportunityDrawer(id = null) {
    editingOppId = id;
    const titleEl = document.getElementById("opportunityDrawerTitle");
    const nameErr = document.getElementById("opportunityNameError");
    const custErr = document.getElementById("opportunityCustomerError");
    const closeDateErr = document.getElementById("opportunityCloseDateError");
    if (nameErr) nameErr.textContent = "";
    if (custErr) custErr.textContent = "";
    if (closeDateErr) closeDateErr.textContent = "";

    const closeDateInput = document.getElementById("opportunityCloseDate");
    const opp = id !== null ? opportunities.find(o => o.id === id) : null;
    const isClosed = opp && (opp.status === "WON" || opp.status === "LOST");
    const bannerEl = document.getElementById("oppClosedAlertBanner");
    const badgeEl = document.getElementById("oppClosedStatusBadge");
    const detailsEl = document.getElementById("oppClosedDetails");
    const saveBtn = document.getElementById("saveOpportunityBtn");
    const reopenBtn = document.getElementById("btnDrawerReopenDeal");

    if (id !== null) {
        if (opp) {
            if (isClosed) {
                if (titleEl) titleEl.textContent = `Chi tiết cơ hội [${opp.status}]`;
                if (bannerEl) bannerEl.style.display = "block";
                if (badgeEl) {
                    badgeEl.textContent = opp.status === "WON" ? "THÀNH CÔNG (WON)" : "THẤT BẠI (LOST)";
                    badgeEl.style.background = opp.status === "WON" ? "#10b981" : "#ef4444";
                }
                if (detailsEl) {
                    let details = "";
                    if (opp.status === "WON") {
                        details = `<strong>Lý do thắng:</strong> ${escapeHtml(opp.winReasonName || 'Chưa ghi')} &bull; <strong>Doanh số chốt:</strong> ${formatMoney(opp.actualAmount || opp.amount)} &bull; <strong>Ngày ký:</strong> ${escapeHtml(opp.actualCloseDate || '—')}`;
                    } else {
                        details = `<strong>Lý do thua:</strong> ${escapeHtml(opp.lossReasonName || 'Chưa ghi')}${opp.competitorName ? ` &bull; <strong>Đối thủ:</strong> ${escapeHtml(opp.competitorName)}` : ''}`;
                    }
                    if (opp.reopenedReason) {
                        details += `<div style="margin-top: 4px; color: #2563eb;"><strong>Lịch sử mở lại:</strong> ${escapeHtml(opp.reopenedReason)}</div>`;
                    }
                    detailsEl.innerHTML = details;
                }
                setOpportunityFormDisabled(true);
                if (saveBtn) saveBtn.style.display = "none";
                if (reopenBtn) reopenBtn.style.display = isTeamLeadOrAbove() ? "inline-block" : "none";
            } else {
                if (titleEl) titleEl.textContent = "Sửa cơ hội";
                if (bannerEl) bannerEl.style.display = "none";
                setOpportunityFormDisabled(false);
                if (saveBtn) saveBtn.style.display = "inline-block";
                if (reopenBtn) reopenBtn.style.display = "none";
            }

            setField("opportunityName", opp.name);
            setField("opportunityCustomer", opp.customerId);
            await loadContactsForCustomer(opp.customerId, opp.contactId, opp.contactName);
            setField("opportunityLeadSource", opp.leadSource);
            setField("opportunityValue", opp.amount);
            if (closeDateInput) closeDateInput.removeAttribute("min");
            setField("opportunityCloseDate", opp.expectedCloseDate);
            setField("opportunityStage", opp.stageId);
            setField("opportunityProbability", opp.probability);
            setField("opportunityProbabilityNote", opp.probabilityNote);
            setField("opportunityOwner", opp.ownerName);

            try {
                const detail = await api(`/api/opportunities/${id}`);
                renderOppCustomFieldInputs(detail?.customFields || {});
                currentOpportunityItems = Array.isArray(detail?.items) ? detail.items : [];
            } catch (e) {
                renderOppCustomFieldInputs({});
                currentOpportunityItems = [];
            }
            renderOpportunityItemsTable();
            if (isClosed) {
                setOpportunityFormDisabled(true);
            }

            const canReassign = isTeamLeadOrAbove();
            if (btnDrawerReassignOpp) btnDrawerReassignOpp.style.display = canReassign ? "inline-block" : "none";
            if (btnQuickReassignInDrawer) btnQuickReassignInDrawer.style.display = canReassign ? "inline-block" : "none";
            const btnCreateQuote = document.getElementById("btnDrawerCreateQuote");
            if (btnCreateQuote) {
                btnCreateQuote.style.display = "inline-block";
                btnCreateQuote.onclick = () => {
                    window.location.href = `quote-editor?opportunityId=${id}`;
                };
            }
            loadAndRenderAssignmentHistory(id);
            loadAndRenderFieldHistory(id);
            loadAndRenderOpportunityTeam(id);
            loadAndRenderOpportunityAttachments(id);
            const timeInput = document.getElementById("quickActivityTime");
            if (timeInput) {
                timeInput.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            }
        }
    } else {
        if (titleEl) titleEl.textContent = "Thêm cơ hội";
        if (bannerEl) bannerEl.style.display = "none";
        setOpportunityFormDisabled(false);
        if (saveBtn) saveBtn.style.display = "inline-block";
        if (reopenBtn) reopenBtn.style.display = "none";
        if (btnDrawerReassignOpp) btnDrawerReassignOpp.style.display = "none";
        if (btnQuickReassignInDrawer) btnQuickReassignInDrawer.style.display = "none";
        const btnCreateQuoteNew = document.getElementById("btnDrawerCreateQuote");
        if (btnCreateQuoteNew) btnCreateQuoteNew.style.display = "none";
        const histSection = document.getElementById("opportunityAssignmentHistorySection");
        if (histSection) histSection.style.display = "none";
        const fieldHistSection = document.getElementById("opportunityFieldHistorySection");
        if (fieldHistSection) fieldHistSection.style.display = "none";
        const teamSection = document.getElementById("opportunityTeamSection");
        if (teamSection) teamSection.style.display = "none";
        const attSection = document.getElementById("opportunityAttachmentsSection");
        if (attSection) attSection.style.display = "none";

        opportunityForm.reset();
        currentOpportunityItems = [];
        renderOpportunityItemsTable();
        if (closeDateInput) {
            closeDateInput.min = todayString();
        }
        await loadContactsForCustomer(null);
        if (stages.length > 0) {
            setField("opportunityStage", stages[0].id);
            setField("opportunityProbability", stages[0].probability);
        }
        setField("opportunityOwner", currentUser?.fullName || "Tôi");
        renderOppCustomFieldInputs({});
    }

    opportunityDrawer?.classList.add("open");
    opportunityOverlay?.classList.add("open");
}

function closeOpportunityDrawer() {
    opportunityDrawer?.classList.remove("open");
    opportunityOverlay?.classList.remove("open");
    editingOppId = null;
    setOpportunityFormDisabled(false);
    const bannerEl = document.getElementById("oppClosedAlertBanner");
    if (bannerEl) bannerEl.style.display = "none";
    const saveBtn = document.getElementById("saveOpportunityBtn");
    if (saveBtn) saveBtn.style.display = "inline-block";
    const reopenBtn = document.getElementById("btnDrawerReopenDeal");
    if (reopenBtn) reopenBtn.style.display = "none";
}

/* =========================================================
   CLOSE DEAL MODAL
========================================================= */
function openCloseDeal(oppId, mode) {
    closingOppId = oppId;
    const opp = opportunities.find(o => o.id === oppId);

    document.getElementById("wonForm")?.reset();
    document.getElementById("lostForm")?.reset();

    if (opp && mode === "won") {
        setField("wonValue", opp.amount || 0);
        setField("wonDate", todayString());
    }

    const wonErr = document.getElementById("wonError");
    const lostErr = document.getElementById("lostError");
    if (wonErr) wonErr.textContent = "";
    if (lostErr) lostErr.textContent = "";

    setDealMode(mode);
    dealModal?.classList.add("open");
    dealOverlay?.classList.add("open");
}

function closeDeal() {
    dealModal?.classList.remove("open");
    dealOverlay?.classList.remove("open");
    closingOppId = null;
}

function setDealMode(mode) {
    const won = mode === "won";
    document.querySelectorAll(".deal-mode").forEach(button => {
        button.classList.toggle("active", button.dataset.dealMode === mode);
    });

    const wonForm = document.getElementById("wonForm");
    const lostForm = document.getElementById("lostForm");
    if (wonForm) wonForm.hidden = !won;
    if (lostForm) lostForm.hidden = won;

    const emojiEl = document.getElementById("closeDealEmoji");
    const titleEl = document.getElementById("closeDealTitle");
    if (emojiEl) emojiEl.textContent = won ? "🎉" : "☹️";
    if (titleEl) titleEl.textContent = won ? "Đóng Thắng Cơ Hội" : "Đóng Thua Cơ Hội";
}

/* =========================================================
   UTILITIES
========================================================= */
function fieldValue(id) {
    return (document.getElementById(id)?.value || "").trim();
}

function setField(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? "";
}

function formatMoney(val) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(val) || 0);
}

function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function clamp(val, min, max) {
    if (!Number.isFinite(val)) return min;
    return Math.min(max, Math.max(min, val));
}

function escapeHtml(val) {
    return String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function debounce(fn, ms) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

/* =========================================================
   USER STORY 1: OPPORTUNITY PRODUCTS & CONTRACT VALUE (ACV)
========================================================= */
async function loadProductCatalog() {
    try {
        const res = await api("/api/products?size=500");
        productCatalog = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
        console.warn("Could not load products catalog:", e);
        productCatalog = [];
    }
}

function recalculateItemAmounts(item) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const discount = Math.min(100, Math.max(0, Number(item.discountPercent) || 0));
    const factor = 1 - (discount / 100);
    const netUnitPrice = unitPrice * factor;
    const type = (item.productType || "ONE_TIME").toUpperCase();
    const cycle = (item.billingCycle || "MONTHLY").toUpperCase();
    const duration = Math.max(1, Number(item.billingDuration) || 1);

    if (type.includes("RECURRING") || type.includes("SUBSCRIPTION")) {
        item.amount = Math.round(netUnitPrice * qty * duration);
        let acv = 0;
        if (cycle === "YEARLY") {
            acv = Math.round(netUnitPrice * qty);
        } else if (cycle === "QUARTERLY") {
            acv = Math.round(netUnitPrice * qty * 4);
        } else {
            acv = Math.round(netUnitPrice * qty * 12);
        }
        item.annualContractValue = acv;
    } else {
        item.amount = Math.round(netUnitPrice * qty);
        item.annualContractValue = item.amount;
    }
}

function updateOpportunityTotalsFromItems() {
    let totalAmt = 0;
    let totalAcv = 0;
    currentOpportunityItems.forEach(item => {
        recalculateItemAmounts(item);
        totalAmt += Number(item.amount || 0);
        totalAcv += Number(item.annualContractValue || 0);
    });

    const badgeCount = document.getElementById("oppProductBadgeCount");
    if (badgeCount) badgeCount.textContent = `${currentOpportunityItems.length} dòng`;

    const acvDisplay = document.getElementById("oppTotalAcvDisplay");
    if (acvDisplay) acvDisplay.textContent = formatMoney(totalAcv);

    const amtDisplay = document.getElementById("oppTotalAmountDisplay");
    if (amtDisplay) amtDisplay.textContent = formatMoney(totalAmt);

    const valInput = document.getElementById("opportunityValue");
    if (valInput) {
        if (currentOpportunityItems.length > 0) {
            valInput.value = totalAmt;
            valInput.readOnly = true;
            valInput.style.backgroundColor = "var(--crm-bg-subtle, #f1f5f9)";
            valInput.title = "Giá trị được tính tự động từ các dòng sản phẩm của cơ hội";
        } else {
            valInput.readOnly = false;
            valInput.style.backgroundColor = "";
            valInput.title = "";
        }
    }
}

function renderOpportunityItemsTable() {
    const tbody = document.getElementById("oppProductsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (currentOpportunityItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #94a3b8; padding: 16px 10px;">
                    Chưa có sản phẩm hoặc dịch vụ nào được thêm vào cơ hội. Bấm <b>"+ Thêm sản phẩm"</b> để định giá hợp đồng có căn cứ.
                </td>
            </tr>
        `;
        updateOpportunityTotalsFromItems();
        return;
    }

    currentOpportunityItems.forEach((item, index) => {
        recalculateItemAmounts(item);
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";
        const isSub = (item.productType || "").toUpperCase().includes("SUBSCRIPTION") || (item.productType || "").toUpperCase().includes("RECURRING");

        tr.innerHTML = `
            <td style="padding: 6px 8px;">
                <select class="crm-input opp-item-prod" data-index="${index}" style="font-size: 12px; padding: 4px 6px; width: 100%;">
                    <option value="">-- Chọn sản phẩm --</option>
                    ${productCatalog.map(p => `<option value="${p.id}" ${p.id == item.productId ? 'selected' : ''}>${escapeHtml(p.name)} (${escapeHtml(p.code || '')}) - ${formatMoney(p.listPrice || 0)}</option>`).join("")}
                </select>
                ${item.notes ? `<div style="font-size: 11px; color:#64748b; margin-top:2px;">${escapeHtml(item.notes)}</div>` : ''}
            </td>
            <td style="padding: 6px;">
                <input class="crm-input opp-item-qty" data-index="${index}" type="number" min="1" value="${item.quantity || 1}" style="font-size: 12px; padding: 4px; width: 100%;">
            </td>
            <td style="padding: 6px;">
                <input class="crm-input opp-item-price" data-index="${index}" type="number" min="0" step="1000" value="${item.unitPrice || 0}" style="font-size: 12px; padding: 4px; width: 100%;" title="Đơn giá niêm yết (có thể điều chỉnh)">
            </td>
            <td style="padding: 6px;">
                <input class="crm-input opp-item-discount" data-index="${index}" type="number" min="0" max="100" value="${item.discountPercent || 0}" style="font-size: 12px; padding: 4px; width: 100%;">
            </td>
            <td style="padding: 6px;">
                ${isSub ? `
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <select class="crm-input opp-item-cycle" data-index="${index}" style="font-size: 11px; padding: 3px; flex: 1;">
                            <option value="MONTHLY" ${item.billingCycle === 'MONTHLY' ? 'selected' : ''}>Tháng</option>
                            <option value="QUARTERLY" ${item.billingCycle === 'QUARTERLY' ? 'selected' : ''}>Quý</option>
                            <option value="YEARLY" ${item.billingCycle === 'YEARLY' ? 'selected' : ''}>Năm</option>
                        </select>
                        <input class="crm-input opp-item-duration" data-index="${index}" type="number" min="1" value="${item.billingDuration || 12}" title="Số kỳ thuê bao (VD: 12 tháng)" style="font-size: 11px; padding: 3px; width: 45px;">
                    </div>
                ` : `
                    <span style="color: #64748b; font-size: 11.5px;">Một lần</span>
                `}
            </td>
            <td style="padding: 6px 8px; text-align: right; font-weight: 600; color: #1e293b;">
                ${formatMoney(item.amount)}
            </td>
            <td style="padding: 6px 8px; text-align: right; font-weight: 600; color: #0284c7;">
                ${formatMoney(item.annualContractValue)}
            </td>
            <td style="padding: 6px 4px; text-align: center;">
                <button type="button" class="btn-remove-opp-item" data-index="${index}" style="background: none; border: none; color: #ef4444; font-size: 14px; cursor: pointer; padding: 2px;" title="Xóa dòng">✕</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateOpportunityTotalsFromItems();
}

function setupOppProductEventListeners() {
    const btnAdd = document.getElementById("btnAddOppProductLine");
    btnAdd?.addEventListener("click", () => {
        currentOpportunityItems.push({
            id: null,
            productId: null,
            productCode: "",
            productName: "",
            productType: "ONE_TIME",
            quantity: 1,
            unitPrice: 0,
            discountPercent: 0,
            billingCycle: "MONTHLY",
            billingDuration: 12,
            amount: 0,
            annualContractValue: 0
        });
        renderOpportunityItemsTable();
    });

    const tbody = document.getElementById("oppProductsTableBody");
    tbody?.addEventListener("change", event => {
        const target = event.target;
        const index = Number(target.dataset.index);
        if (isNaN(index) || !currentOpportunityItems[index]) return;
        const item = currentOpportunityItems[index];

        if (target.classList.contains("opp-item-prod")) {
            const prodId = Number(target.value);
            const prod = productCatalog.find(p => p.id === prodId);
            if (prod) {
                item.productId = prod.id;
                item.productCode = prod.code;
                item.productName = prod.name;
                item.productType = prod.type || "PHYSICAL";
                item.unit = prod.unit || "";
                item.unitPrice = Number(prod.listPrice || 0);
                if (String(prod.type).toUpperCase().includes("SUBSCRIPTION") || String(prod.type).toUpperCase().includes("RECURRING")) {
                    item.billingCycle = "MONTHLY";
                    item.billingDuration = 12;
                } else {
                    item.billingCycle = "ONE_TIME";
                    item.billingDuration = 1;
                }
            } else {
                item.productId = null;
                item.productName = "";
                item.unitPrice = 0;
            }
            renderOpportunityItemsTable();
            return;
        }

        if (target.classList.contains("opp-item-qty")) {
            item.quantity = Math.max(1, Number(target.value) || 1);
        } else if (target.classList.contains("opp-item-price")) {
            item.unitPrice = Math.max(0, Number(target.value) || 0);
        } else if (target.classList.contains("opp-item-discount")) {
            item.discountPercent = Math.min(100, Math.max(0, Number(target.value) || 0));
        } else if (target.classList.contains("opp-item-cycle")) {
            item.billingCycle = target.value;
        } else if (target.classList.contains("opp-item-duration")) {
            item.billingDuration = Math.max(1, Number(target.value) || 1);
        }

        renderOpportunityItemsTable();
    });

    tbody?.addEventListener("click", event => {
        const removeBtn = event.target.closest(".btn-remove-opp-item");
        if (removeBtn) {
            const index = Number(removeBtn.dataset.index);
            if (!isNaN(index) && currentOpportunityItems[index]) {
                currentOpportunityItems.splice(index, 1);
                renderOpportunityItemsTable();
            }
        }
    });
}

/* =========================================================
   USER STORY 2: MANDATORY STAGE EXIT CRITERIA & OVERRIDE
========================================================= */
function openStageConditionModal(oppId, targetStageId, conditionData) {
    pendingStageOverride = { oppId, targetStageId };

    const modal = document.getElementById("stageConditionModal");
    const overlay = document.getElementById("stageConditionOverlay");
    const stageNameEl = document.getElementById("scModalStageName");
    const missingEl = document.getElementById("scModalMissingDetail");
    const overrideSection = document.getElementById("scOverrideSection");
    const noOverrideNotice = document.getElementById("scNoOverrideNotice");
    const reasonInput = document.getElementById("scOverrideReason");

    if (stageNameEl) stageNameEl.innerHTML = `Giai đoạn: <strong>${escapeHtml(conditionData.stageName || "Hiện tại")}</strong>`;
    if (missingEl) missingEl.textContent = conditionData.missingReason || conditionData.exitCondition || "Chưa đạt điều kiện rời giai đoạn theo cấu hình.";
    if (reasonInput) reasonInput.value = "";

    const canOverride = Boolean(conditionData.canOverride);
    if (overrideSection) overrideSection.style.display = canOverride ? "block" : "none";
    if (noOverrideNotice) noOverrideNotice.style.display = canOverride ? "none" : "block";

    const confirmBtn = document.getElementById("btnConfirmStageOverride");
    if (confirmBtn) confirmBtn.style.display = canOverride ? "inline-block" : "none";

    if (modal) modal.style.display = "block";
    if (overlay) overlay.style.display = "block";
}

function closeStageConditionModal() {
    const modal = document.getElementById("stageConditionModal");
    const overlay = document.getElementById("stageConditionOverlay");
    if (modal) modal.style.display = "none";
    if (overlay) overlay.style.display = "none";
    pendingStageOverride = null;
}

document.getElementById("closeStageConditionModal")?.addEventListener("click", closeStageConditionModal);
document.getElementById("cancelStageConditionModal")?.addEventListener("click", closeStageConditionModal);
document.getElementById("stageConditionOverlay")?.addEventListener("click", closeStageConditionModal);

document.getElementById("btnConfirmStageOverride")?.addEventListener("click", async () => {
    if (!pendingStageOverride) return;
    const reasonInput = document.getElementById("scOverrideReason");
    const reason = (reasonInput?.value || "").trim();

    if (!reason) {
        alert("Bắt buộc phải nhập lý do đặc cách ghi đè để lưu lịch sử kiểm toán.");
        reasonInput?.focus();
        return;
    }

    try {
        await api(`/api/opportunities/${pendingStageOverride.oppId}/stage`, {
            method: "POST",
            body: JSON.stringify({
                stageId: pendingStageOverride.targetStageId,
                overrideReason: reason
            })
        });
        closeStageConditionModal();
        await loadOpportunities();
    } catch (err) {
        alert("Lỗi khi ghi đè chuyển giai đoạn: " + err.message);
    }
});

/* =========================================================
   USER STORY 1, 2, 3: PERMISSIONS, REOPEN, STAGNATION & FORECAST
========================================================= */
function isTeamLeadOrAbove() {
    if (!currentUser) return false;
    const scope = (currentUser.dataScope || "").toUpperCase();
    if (scope === "ALL" || scope === "TEAM") return true;
    const role = (currentUser.role || "").toUpperCase();
    if (role === "ADMIN" || role === "DIRECTOR" || role === "TEAM_LEAD" || role === "MANAGER") return true;
    if (Array.isArray(currentUser.roles)) {
        return currentUser.roles.some(r => {
            const code = typeof r === "object" ? (r.name || r.code || "") : String(r);
            const u = code.toUpperCase();
            return u === "ADMIN" || u === "DIRECTOR" || u === "TEAM_LEAD" || u === "MANAGER"
                || u.includes("LEAD") || u.includes("GIAM DOC") || u.includes("QUAN TRI") || u.includes("TRUONG");
        });
    }
    return false;
}

function openReopenDealModal(id) {
    reopeningOppId = id;
    const opp = opportunities.find(o => o.id === id);
    const titleEl = document.getElementById("reopenModalOppTitle");
    const reasonInput = document.getElementById("reopenDealReason");
    const errorEl = document.getElementById("reopenDealError");

    if (titleEl) {
        titleEl.textContent = `Cơ hội: ${opp?.name || '#' + id} (${opp?.customerName || ''})`;
    }
    if (reasonInput) reasonInput.value = "";
    if (errorEl) errorEl.textContent = "";

    if (reopenDealModal) reopenDealModal.style.display = "block";
    if (reopenDealOverlay) reopenDealOverlay.style.display = "block";
}

function closeReopenDealModal() {
    if (reopenDealModal) reopenDealModal.style.display = "none";
    if (reopenDealOverlay) reopenDealOverlay.style.display = "none";
    reopeningOppId = null;
}

function setPipelineTab(tab) {
    activePipelineTab = tab;
    if (tabKanbanView) tabKanbanView.className = tab === "KANBAN" ? "pipeline-view-tab active" : "pipeline-view-tab";
    if (tabForecastView) tabForecastView.className = tab === "FORECAST" ? "pipeline-view-tab active" : "pipeline-view-tab";
    if (tabStagnantView) tabStagnantView.className = tab === "STAGNANT" ? "pipeline-view-tab active" : "pipeline-view-tab";

    if (tab === "KANBAN") {
        if (pipelineFilterSection) pipelineFilterSection.style.display = "block";
        if (pipelineBoard) pipelineBoard.style.display = "grid";
        if (forecastSection) forecastSection.style.display = "none";
        if (stagnantSection) stagnantSection.style.display = "none";
    } else if (tab === "FORECAST") {
        if (pipelineFilterSection) pipelineFilterSection.style.display = "none";
        if (pipelineBoard) pipelineBoard.style.display = "none";
        if (forecastSection) forecastSection.style.display = "block";
        if (stagnantSection) stagnantSection.style.display = "none";
        loadForecastData();
    } else if (tab === "STAGNANT") {
        if (pipelineFilterSection) pipelineFilterSection.style.display = "none";
        if (pipelineBoard) pipelineBoard.style.display = "none";
        if (forecastSection) forecastSection.style.display = "none";
        if (stagnantSection) stagnantSection.style.display = "block";
        renderStagnantSection();
    }
}

async function loadForecastData() {
    try {
        const data = await api(`/api/forecasts?period=${currentForecastPeriod}&groupBy=${currentForecastGroupBy}`);
        if (!data) return;

        const range = data.periodRange || { label: data.periodLabel, from: data.startDate, to: data.endDate };
        const summary = data.summary || {};
        const breakdowns = Array.isArray(data.breakdown) ? data.breakdown : (Array.isArray(data.breakdowns) ? data.breakdowns : []);

        // Update Period Label
        const labelEl = document.getElementById("forecastPeriodLabel");
        if (labelEl) {
            labelEl.textContent = `(${range.label || currentForecastPeriod}: ${range.from || ''} ~ ${range.to || ''})`;
        }

        // Update KPI Cards
        const targetEl = document.getElementById("kpiTargetAmount");
        if (targetEl) targetEl.textContent = formatMoney(summary.targetAmount || 0);

        const wonEl = document.getElementById("kpiWonAmount");
        if (wonEl) wonEl.textContent = formatMoney(summary.wonAmount || 0);

        const wonDealsCountEl = document.getElementById("kpiWonDealsCount");
        if (wonDealsCountEl) wonDealsCountEl.textContent = summary.wonDealsCount || 0;

        const weightedEl = document.getElementById("kpiWeightedAmount");
        if (weightedEl) weightedEl.textContent = formatMoney(summary.weightedForecastAmount || 0);

        const openDealsCountEl = document.getElementById("kpiOpenDealsCount");
        if (openDealsCountEl) openDealsCountEl.textContent = summary.openDealsCount || 0;

        const pipelineEl = document.getElementById("kpiPipelineAmount");
        if (pipelineEl) pipelineEl.textContent = formatMoney(summary.totalPipelineAmount || 0);

        const projectedEl = document.getElementById("kpiProjectedAmount");
        if (projectedEl) projectedEl.textContent = formatMoney(summary.totalProjectedAmount || 0);

        const pct = Number(summary.achievementPercent !== undefined ? summary.achievementPercent : (summary.achievementPct || 0));
        const achPctEl = document.getElementById("kpiAchievementPct");
        if (achPctEl) achPctEl.textContent = pct.toFixed(1) + "%";

        const barEl = document.getElementById("kpiProgressBar");
        if (barEl) {
            const barWidth = Math.min(100, Math.max(0, pct));
            barEl.style.width = barWidth + "%";
            if (pct >= 100) {
                barEl.style.background = "linear-gradient(90deg, #10b981, #059669)";
            } else if (pct >= 80) {
                barEl.style.background = "linear-gradient(90deg, #3b82f6, #10b981)";
            } else if (pct >= 50) {
                barEl.style.background = "linear-gradient(90deg, #f59e0b, #3b82f6)";
            } else {
                barEl.style.background = "linear-gradient(90deg, #ef4444, #f59e0b)";
            }
        }

        const overallStatusEl = document.getElementById("kpiOverallStatus");
        if (overallStatusEl) {
            if (pct >= 100) {
                overallStatusEl.textContent = "🏆 VƯỢT CHỈ TIÊU";
                overallStatusEl.style.background = "#dcfce7";
                overallStatusEl.style.color = "#15803d";
            } else if (pct >= 80) {
                overallStatusEl.textContent = "⭐ TRIỂN VỌNG CAO";
                overallStatusEl.style.background = "#dbeafe";
                overallStatusEl.style.color = "#1e40af";
            } else if (pct >= 50) {
                overallStatusEl.textContent = "⚡ CẦN TĂNG TỐC";
                overallStatusEl.style.background = "#fef3c7";
                overallStatusEl.style.color = "#92400e";
            } else {
                overallStatusEl.textContent = "⚠️ NGUY CƠ HỤT";
                overallStatusEl.style.background = "#fee2e2";
                overallStatusEl.style.color = "#991b1b";
            }
        }

        // Breakdown Table
        const tableTitle = document.getElementById("forecastTableTitle");
        if (tableTitle) {
            tableTitle.textContent = currentForecastGroupBy === "TEAM"
                ? "Chi tiết Dự báo theo Nhóm kinh doanh"
                : "Chi tiết Dự báo theo Nhân viên kinh doanh";
        }

        const tbody = document.getElementById("forecastTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (breakdowns.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">
                        Không có dữ liệu dự báo cho kỳ đã chọn.
                    </td>
                </tr>
            `;
            return;
        }

        breakdowns.forEach(item => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #f1f5f9";
            const rowPct = Number(item.achievementPercent !== undefined ? item.achievementPercent : (item.achievementPct || 0));

            let statusBadge = "";
            if (rowPct >= 100) {
                statusBadge = '<span style="background: #dcfce7; color: #166534; font-weight: 700; padding: 3px 8px; border-radius: 6px; font-size: 11.5px;">✓ Đạt chỉ tiêu</span>';
            } else if (rowPct >= 75) {
                statusBadge = '<span style="background: #dbeafe; color: #1e40af; font-weight: 700; padding: 3px 8px; border-radius: 6px; font-size: 11.5px;">Khả quan</span>';
            } else if (rowPct >= 50) {
                statusBadge = '<span style="background: #fef3c7; color: #92400e; font-weight: 700; padding: 3px 8px; border-radius: 6px; font-size: 11.5px;">Cần nỗ lực</span>';
            } else {
                statusBadge = '<span style="background: #fee2e2; color: #991b1b; font-weight: 700; padding: 3px 8px; border-radius: 6px; font-size: 11.5px;">Nguy cơ hụt</span>';
            }

            const miniBarWidth = Math.min(100, Math.max(0, rowPct));
            const barColor = rowPct >= 100 ? '#10b981' : (rowPct >= 75 ? '#3b82f6' : (rowPct >= 50 ? '#f59e0b' : '#ef4444'));

            tr.innerHTML = `
                <td style="padding: 12px 14px; font-weight: 600; color: #0f172a;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>${currentForecastGroupBy === "TEAM" ? "👥" : "👤"}</span>
                        <div>
                            <div>${escapeHtml(item.name || "—")}</div>
                            <small style="color: #64748b; font-weight: normal; font-size: 11.5px;">
                                ${currentForecastGroupBy === "TEAM" ? "Nhóm kinh doanh" : "Chuyên viên bán hàng"}
                            </small>
                        </div>
                    </div>
                </td>
                <td style="padding: 12px 14px; font-weight: 600; color: #475569;">
                    ${formatMoney(item.targetAmount || 0)}
                </td>
                <td style="padding: 12px 14px; color: #10b981; font-weight: 700;">
                    ${formatMoney(item.wonAmount || 0)}
                    <div style="font-size: 11px; color: #64748b; font-weight: normal;">${item.wonDealsCount || 0} HĐ chốt</div>
                </td>
                <td style="padding: 12px 14px; color: #2563eb; font-weight: 700;">
                    ${formatMoney(item.weightedForecastAmount || 0)}
                    <div style="font-size: 11px; color: #64748b; font-weight: normal;">${item.openDealsCount || 0} cơ hội mở</div>
                </td>
                <td style="padding: 12px 14px; font-weight: 800; color: #6d28d9;">
                    ${formatMoney(item.totalProjectedAmount || 0)}
                </td>
                <td style="padding: 12px 14px;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                        <span style="font-weight: 700; color: ${barColor};">${rowPct.toFixed(1)}%</span>
                    </div>
                    <div style="height: 6px; width: 100%; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: ${miniBarWidth}%; background: ${barColor}; border-radius: 3px;"></div>
                    </div>
                </td>
                <td style="padding: 12px 14px; text-align: center;">
                    ${statusBadge}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading forecast:", err);
    }
}

/* =========================================================
   USER STORY 2: DANH SÁCH CƠ HỘI ĐÌNH TRỆ DÀNH RIÊNG CHO TRƯỞNG NHÓM
========================================================= */
function renderStagnantSection() {
    const totalEl = document.getElementById("stagKpiTotal");
    const inactiveEl = document.getElementById("stagKpiInactive");
    const overdueEl = document.getElementById("stagKpiOverdue");
    const amountEl = document.getElementById("stagKpiAmount");
    const tbody = document.getElementById("stagnantTableBody");
    const emptyState = document.getElementById("stagnantEmptyState");
    const stageSelect = document.getElementById("stagStageFilter");
    const ownerSelect = document.getElementById("stagOwnerFilter");
    const searchInput = document.getElementById("stagSearch");
    const flagSelect = document.getElementById("stagFlagTypeFilter");

    if (!tbody) return;

    // Lọc các cơ hội đang MỞ (OPEN) bị gắn cờ đình trệ hoặc quá hạn
    const allStag = opportunities.filter(o => o.status === "OPEN" && (o.isStagnant === true || o.isStagnant === 1) && o.stagnantFlag && o.stagnantFlag !== "NONE");

    // Điền danh sách giai đoạn vào bộ lọc nếu chưa có
    if (stageSelect && stageSelect.options.length <= 1) {
        stages.forEach(st => {
            const opt = document.createElement("option");
            opt.value = st.id;
            opt.textContent = `${st.name} (mốc: ${st.stagnantDays || 7} ngày)`;
            stageSelect.appendChild(opt);
        });
    }

    // Điền danh sách nhân viên phụ trách vào bộ lọc nếu chưa có
    if (ownerSelect && ownerSelect.options.length <= 1) {
        const ownerMap = new Map();
        opportunities.forEach(o => {
            if (o.ownerUserId && o.ownerName && !ownerMap.has(o.ownerUserId)) {
                ownerMap.set(o.ownerUserId, o.ownerName);
            }
        });
        ownerMap.forEach((name, id) => {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = name;
            ownerSelect.appendChild(opt);
        });
    }

    // Cập nhật 4 thẻ KPI tổng quan
    const totalCount = allStag.length;
    const inactiveCount = allStag.filter(o => o.stagnantFlag === "INACTIVE" || o.stagnantFlag === "BOTH").length;
    const overdueCount = allStag.filter(o => o.stagnantFlag === "OVERDUE" || o.stagnantFlag === "BOTH").length;
    const totalRiskAmount = allStag.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    if (totalEl) totalEl.textContent = totalCount;
    if (inactiveEl) inactiveEl.textContent = inactiveCount;
    if (overdueEl) overdueEl.textContent = overdueCount;
    if (amountEl) amountEl.textContent = formatMoney(totalRiskAmount);

    // Áp dụng bộ lọc tìm kiếm & loại cờ
    const searchKw = (searchInput?.value || "").trim().toLowerCase();
    const flagFilter = flagSelect?.value || "";
    const stageFilter = stageSelect?.value || "";
    const ownerFilterVal = ownerSelect?.value || "";

    const filtered = allStag.filter(o => {
        if (searchKw) {
            const nameMatch = (o.name || "").toLowerCase().includes(searchKw);
            const custMatch = (o.customerName || "").toLowerCase().includes(searchKw);
            const ownerMatch = (o.ownerName || "").toLowerCase().includes(searchKw);
            if (!nameMatch && !custMatch && !ownerMatch) return false;
        }
        if (flagFilter && o.stagnantFlag !== flagFilter) return false;
        if (stageFilter && String(o.stageId) !== String(stageFilter)) return false;
        if (ownerFilterVal && String(o.ownerUserId) !== String(ownerFilterVal)) return false;
        return true;
    });

    tbody.innerHTML = "";
    if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = "block";
        return;
    }

    if (emptyState) emptyState.style.display = "none";

    filtered.forEach(o => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid var(--crm-border, #e2e8f0)";
        tr.style.transition = "background 0.15s ease";
        tr.onmouseenter = () => tr.style.background = "#fef2f2";
        tr.onmouseleave = () => tr.style.background = "";

        // Badge loại cờ cảnh báo
        let badgeHtml = "";
        if (o.stagnantFlag === "BOTH") {
            badgeHtml = `<span class="opp-badge" style="background:#fee2e2; border:1px solid #fecaca; color:#991b1b; font-weight:700; padding:3px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;">🚨 Cả hai (Đình trệ & Quá hạn)</span>`;
        } else if (o.stagnantFlag === "OVERDUE") {
            badgeHtml = `<span class="opp-badge" style="background:#fee2e2; border:1px solid #fecaca; color:#dc2626; font-weight:700; padding:3px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;">⚠️ Quá hạn chốt</span>`;
        } else {
            badgeHtml = `<span class="opp-badge" style="background:#fef3c7; border:1px solid #fde68a; color:#b45309; font-weight:700; padding:3px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;">⏳ Không tương tác (> N ngày)</span>`;
        }

        const stage = stages.find(s => s.id === o.stageId);
        const stageName = stage?.name || o.stageName || "Không xác định";
        const stagnantThreshold = o.stageStagnantDays || 7;

        const isChecked = selectedOppIds.has(o.id);
        tr.innerHTML = `
            <td style="padding: 12px 10px; width: 36px; text-align: center;">
                <input type="checkbox" class="opp-checkbox stagnant-opp-checkbox" data-opp-id="${o.id}" ${isChecked ? 'checked' : ''}>
            </td>
            <td style="padding: 12px 16px;">
                <div style="font-weight: 700; color: #0f172a; cursor: pointer; text-decoration: underline;" onclick="openEditOpportunity(${o.id})">
                    ${escapeHtml(o.name || 'Cơ hội #' + o.id)}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                    🏢 ${escapeHtml(o.customerName || 'Chưa gắn khách hàng')}
                </div>
            </td>
            <td style="padding: 12px 14px;">
                <div style="font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                    <span style="display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; border-radius:50%; background:#e0e7ff; color:#3730a3; font-size:11px; font-weight:700;">
                        ${(o.ownerName || 'U').charAt(0).toUpperCase()}
                    </span>
                    ${escapeHtml(o.ownerName || 'Chưa phân bổ')}
                </div>
                ${o.teamName ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${escapeHtml(o.teamName)}</div>` : ''}
            </td>
            <td style="padding: 12px 14px;">
                <span class="opp-stage-pill" style="font-size: 12px; font-weight: 600; background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 4px; display: inline-block;">
                    ${escapeHtml(stageName)}
                </span>
                <div style="font-size: 11px; color: #92400e; background: #fef3c7; padding: 1px 6px; border-radius: 3px; display: inline-block; margin-top: 4px; font-weight: 600;">
                    Mốc N ngày: ${stagnantThreshold} ngày
                </div>
            </td>
            <td style="padding: 12px 14px;">
                <div>${badgeHtml}</div>
                <div style="font-size: 12px; color: #7f1d1d; margin-top: 4px; line-height: 1.4; max-width: 320px;">
                    ${escapeHtml(o.stagnantReason || 'Không có tương tác gần đây')}
                </div>
            </td>
            <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: #0f172a;">
                ${formatMoney(o.amount || 0)}
                <div style="font-size: 11px; color: #64748b; font-weight: 500;">XS: ${o.probability || 0}%</div>
            </td>
            <td style="padding: 12px 14px; font-size: 12.5px;">
                <span style="color: #dc2626; font-weight: 600;">
                    ${o.expectedCloseDate || 'Chưa đặt'}
                </span>
            </td>
            <td style="padding: 12px 16px; text-align: center;">
                <div style="display: flex; gap: 6px; justify-content: center; align-items: center; flex-wrap: wrap;">
                    <button type="button" class="crm-btn crm-btn-secondary" style="padding: 5px 8px; font-size: 12px; font-weight: 600;" onclick="openEditOpportunity(${o.id})" title="Xem chi tiết hồ sơ cơ hội">
                        👁️ Xem
                    </button>
                    ${isTeamLeadOrAbove() ? `
                    <button type="button" class="crm-btn" style="padding: 5px 8px; font-size: 12px; font-weight: 600; background:#0284c7; color:#fff; border-color:#0284c7;" onclick="openReassignModal([${o.id}])" title="Phân bổ lại cơ hội cho người khác">
                        🔄 Phân bổ
                    </button>` : ''}
                    <button type="button" class="crm-btn crm-btn-primary" style="padding: 5px 8px; font-size: 12px; font-weight: 600; background:#2563eb;" onclick="openInterventionAction(${o.id}, '${escapeHtml(o.name || '')}')" title="Can thiệp và tạo hoạt động đốc thúc">
                        📞 Can thiệp
                    </button>
                </div>
            </td>
        `;

        const rowCb = tr.querySelector(".stagnant-opp-checkbox");
        rowCb?.addEventListener("change", (e) => {
            if (e.target.checked) {
                selectedOppIds.add(o.id);
            } else {
                selectedOppIds.delete(o.id);
            }
            updateBulkActionBar();
            const selectAllBox = document.getElementById("selectAllStagnantOpps");
            if (selectAllBox) {
                selectAllBox.checked = filtered.length > 0 && filtered.every(item => selectedOppIds.has(item.id));
            }
        });

        tbody.appendChild(tr);
    });

    // Cập nhật trạng thái ô checkbox Chọn tất cả
    const selectAllBox = document.getElementById("selectAllStagnantOpps");
    if (selectAllBox) {
        selectAllBox.checked = filtered.length > 0 && filtered.every(item => selectedOppIds.has(item.id));
        selectAllBox.onchange = () => {
            if (selectAllBox.checked) {
                filtered.forEach(item => selectedOppIds.add(item.id));
            } else {
                filtered.forEach(item => selectedOppIds.delete(item.id));
            }
            tbody.querySelectorAll(".stagnant-opp-checkbox").forEach(cb => {
                const oppId = Number(cb.dataset.oppId);
                cb.checked = selectedOppIds.has(oppId);
            });
            updateBulkActionBar();
        };
    }
}

function openInterventionAction(oppId, oppName) {
    if (confirm(`Can thiệp thương vụ: "${oppName}"\n\nBạn có muốn mở Drawer chi tiết cơ hội để xem lịch sử tương tác, phân bổ lại người phụ trách hoặc tạo hoạt động đôn đốc nhân viên không?`)) {
        openEditOpportunity(oppId);
    }
}

window.openInterventionAction = openInterventionAction;
window.renderStagnantSection = renderStagnantSection;

function setupStoryEventListeners() {
    // Tab switching
    tabKanbanView?.addEventListener("click", () => setPipelineTab("KANBAN"));
    tabForecastView?.addEventListener("click", () => setPipelineTab("FORECAST"));
    tabStagnantView?.addEventListener("click", () => setPipelineTab("STAGNANT"));

    // Event listeners cho các bộ lọc của màn hình Cơ hội đình trệ
    document.getElementById("stagSearch")?.addEventListener("input", renderStagnantSection);
    document.getElementById("stagFlagTypeFilter")?.addEventListener("change", renderStagnantSection);
    document.getElementById("stagStageFilter")?.addEventListener("change", renderStagnantSection);
    document.getElementById("stagOwnerFilter")?.addEventListener("change", renderStagnantSection);

    // Nút quét đình trệ trên thanh banner
    btnScanStagnantView?.addEventListener("click", async () => {
        btnScanStagnantView.disabled = true;
        const oldText = btnScanStagnantView.innerHTML;
        btnScanStagnantView.innerHTML = "⏳ Đang quét...";
        try {
            const res = await api("/api/opportunities/scan-stagnation", { method: "POST" });
            alert(`Hoàn tất đánh giá đình trệ:\n- Số cơ hội bị gắn cờ cảnh báo: ${res.flaggedCount || 0} cơ hội`);
            await loadOpportunities();
        } catch (e) {
            alert("Lỗi khi quét cơ hội đình trệ: " + e.message);
        } finally {
            btnScanStagnantView.disabled = false;
            btnScanStagnantView.innerHTML = oldText;
        }
    });

    // Toggle bộ lọc nâng cao
    const btnTogglePipelineAdvanced = document.getElementById("btnTogglePipelineAdvanced");
    const pipelineAdvancedPanel = document.getElementById("pipelineAdvancedPanel");
    btnTogglePipelineAdvanced?.addEventListener("click", () => {
        const isHidden = !pipelineAdvancedPanel || pipelineAdvancedPanel.style.display === "none";
        if (pipelineAdvancedPanel) {
            pipelineAdvancedPanel.style.display = isHidden ? "block" : "none";
        }
        btnTogglePipelineAdvanced.classList.toggle("open", isHidden);
    });


    // Stagnation filter & scan
    btnStagnantFilter?.addEventListener("click", () => {
        stagnantFilterActive = !stagnantFilterActive;
        btnStagnantFilter.classList.toggle("active", stagnantFilterActive);
        if (stagnantFilterActive) {
            btnStagnantFilter.style.background = "#ef4444";
            btnStagnantFilter.style.borderColor = "#ef4444";
            btnStagnantFilter.style.color = "#ffffff";
        } else {
            btnStagnantFilter.style.background = "";
            btnStagnantFilter.style.borderColor = "";
            btnStagnantFilter.style.color = "";
        }
        loadOpportunities();
    });

    btnScanStagnant?.addEventListener("click", async () => {
        btnScanStagnant.disabled = true;
        const oldText = btnScanStagnant.innerHTML;
        btnScanStagnant.innerHTML = "⏳ Đang quét...";
        try {
            const res = await api("/api/opportunities/scan-stagnation", { method: "POST" });
            alert(`Hoàn tất đánh giá đình trệ:\n- Quét tổng cộng: ${res.scannedCount || 0} cơ hội\n- Gắn cờ cảnh báo: ${res.flaggedCount || 0} cơ hội\n- Giải tỏa cờ: ${res.clearedCount || 0} cơ hội`);
            await loadOpportunities();
        } catch (e) {
            alert("Lỗi khi quét cơ hội đình trệ: " + e.message);
        } finally {
            btnScanStagnant.disabled = false;
            btnScanStagnant.innerHTML = oldText;
        }
    });

    // Reopen modal listeners
    document.getElementById("closeReopenDealModalX")?.addEventListener("click", closeReopenDealModal);
    document.getElementById("cancelReopenDealBtn")?.addEventListener("click", closeReopenDealModal);
    reopenDealOverlay?.addEventListener("click", closeReopenDealModal);

    btnDrawerReopenDeal?.addEventListener("click", () => {
        if (editingOppId) {
            openReopenDealModal(editingOppId);
        }
    });

    reopenDealForm?.addEventListener("submit", async event => {
        event.preventDefault();
        if (!reopeningOppId) return;

        const reason = (reopenDealReason?.value || "").trim();
        if (!reason) {
            if (reopenDealError) reopenDealError.textContent = "Bắt buộc phải nhập lý do mở lại cơ hội.";
            return;
        }
        if (reopenDealError) reopenDealError.textContent = "";

        try {
            await api(`/api/opportunities/${reopeningOppId}/reopen`, {
                method: "POST",
                body: JSON.stringify({ reopenReason: reason })
            });
            closeReopenDealModal();
            closeOpportunityDrawer();
            await loadOpportunities();
            alert("Đã mở lại cơ hội bán hàng thành công.");
        } catch (err) {
            if (reopenDealError) reopenDealError.textContent = err.message || "Lỗi khi mở lại cơ hội";
            else alert("Lỗi khi mở lại cơ hội: " + err.message);
        }
    });

    // Forecast Period Pills
    document.querySelectorAll(".forecast-period-pills .period-pill").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".forecast-period-pills .period-pill").forEach(b => {
                b.classList.remove("active");
                b.style.background = "transparent";
                b.style.color = "#64748b";
                b.style.boxShadow = "none";
            });
            btn.classList.add("active");
            btn.style.background = "#fff";
            btn.style.color = "#0f172a";
            btn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            currentForecastPeriod = btn.dataset.period || "THIS_MONTH";
            loadForecastData();
        });
    });

    // Forecast Group Pills
    const btnGroupUser = document.getElementById("btnGroupUser");
    const btnGroupTeam = document.getElementById("btnGroupTeam");

    btnGroupUser?.addEventListener("click", () => {
        currentForecastGroupBy = "USER";
        btnGroupUser.classList.add("active");
        btnGroupUser.style.background = "#fff";
        btnGroupUser.style.color = "#0f172a";
        btnGroupUser.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
        if (btnGroupTeam) {
            btnGroupTeam.classList.remove("active");
            btnGroupTeam.style.background = "transparent";
            btnGroupTeam.style.color = "#64748b";
            btnGroupTeam.style.boxShadow = "none";
        }
        loadForecastData();
    });

    btnGroupTeam?.addEventListener("click", () => {
        currentForecastGroupBy = "TEAM";
        btnGroupTeam.classList.add("active");
        btnGroupTeam.style.background = "#fff";
        btnGroupTeam.style.color = "#0f172a";
        btnGroupTeam.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
        if (btnGroupUser) {
            btnGroupUser.classList.remove("active");
            btnGroupUser.style.background = "transparent";
            btnGroupUser.style.color = "#64748b";
            btnGroupUser.style.boxShadow = "none";
        }
        loadForecastData();
    });

    document.getElementById("btnRefreshForecast")?.addEventListener("click", loadForecastData);

    // Reassignment modal & buttons listeners
    document.getElementById("closeReassignModalX")?.addEventListener("click", closeReassignModal);
    document.getElementById("cancelReassignModalBtn")?.addEventListener("click", closeReassignModal);
    document.getElementById("reassignOpportunityOverlay")?.addEventListener("click", closeReassignModal);

    document.getElementById("reassignReasonPreset")?.addEventListener("change", (e) => {
        const val = e.target.value;
        const reasonInput = document.getElementById("reassignReason");
        if (val && val !== "Khác" && reasonInput) {
            reasonInput.value = val;
        }
    });

    btnDrawerReassignOpp?.addEventListener("click", () => {
        if (editingOppId) {
            openReassignModal([editingOppId]);
        }
    });

    btnQuickReassignInDrawer?.addEventListener("click", () => {
        if (editingOppId) {
            openReassignModal([editingOppId]);
        }
    });

    // Bulk bar buttons
    document.getElementById("btnBulkReassign")?.addEventListener("click", () => {
        if (selectedOppIds.size > 0) {
            openReassignModal(Array.from(selectedOppIds));
        }
    });

    document.getElementById("btnBulkDeselect")?.addEventListener("click", () => {
        selectedOppIds.clear();
        document.querySelectorAll(".stagnant-opp-checkbox").forEach(cb => cb.checked = false);
        const selectAllBox = document.getElementById("selectAllStagnantOpps");
        if (selectAllBox) selectAllBox.checked = false;
        updateBulkActionBar();
    });

    // Reassign form submit
    document.getElementById("reassignOpportunityForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!reassigningOppIds || reassigningOppIds.length === 0) return;

        const toUserIdVal = document.getElementById("reassignToUser")?.value;
        const reasonVal = (document.getElementById("reassignReason")?.value || "").trim();
        const notesVal = (document.getElementById("reassignNotes")?.value || "").trim();
        const errorEl = document.getElementById("reassignError");
        const submitBtn = document.getElementById("submitReassignBtn");

        if (!toUserIdVal) {
            if (errorEl) errorEl.textContent = "Vui lòng chọn nhân sự tiếp nhận.";
            return;
        }
        if (!reasonVal) {
            if (errorEl) errorEl.textContent = "Bắt buộc phải nhập lý do phân bổ lại cơ hội.";
            return;
        }
        if (errorEl) errorEl.textContent = "";

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Đang chuyển giao...";
        }

        try {
            const resp = await api("/api/opportunities/reassign", {
                method: "POST",
                body: JSON.stringify({
                    opportunityIds: reassigningOppIds,
                    toUserId: Number(toUserIdVal),
                    reason: reasonVal,
                    notes: notesVal
                })
            });

            const count = resp?.reassignedCount || reassigningOppIds.length;
            closeReassignModal();
            selectedOppIds.clear();
            updateBulkActionBar();
            await loadOpportunities();

            if (editingOppId && reassigningOppIds.includes(editingOppId)) {
                await openOpportunityDrawer(editingOppId);
            }

            alert(`Phân bổ lại thành công ${count} cơ hội bán hàng!`);
        } catch (err) {
            if (errorEl) errorEl.textContent = err.message || "Lỗi khi chuyển giao cơ hội";
            else alert("Lỗi khi chuyển giao cơ hội: " + err.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "🔄 Xác nhận chuyển giao";
            }
        }
    });
}

/* =========================================================
   USER STORY: OPPORTUNITY REASSIGNMENT (SINGLE & BULK)
========================================================= */

function updateBulkActionBar() {
    const bar = document.getElementById("pipelineBulkActionBar");
    const countEl = document.getElementById("bulkSelectedCount");
    if (!bar) return;
    if (selectedOppIds.size > 0) {
        if (countEl) countEl.textContent = selectedOppIds.size;
        bar.classList.add("visible");
    } else {
        bar.classList.remove("visible");
    }
}

async function loadAssignableUsers() {
    const select = document.getElementById("reassignToUser");
    if (!select) return;
    try {
        const users = await api("/api/opportunities/assignable-users");
        assignableUsersList = Array.isArray(users) ? users : [];
        select.innerHTML = '<option value="">-- Chọn nhân sự tiếp nhận --</option>';

        // Group users by team
        const teamsMap = new Map();
        assignableUsersList.forEach(u => {
            const teamName = u.teamName || "Khác";
            if (!teamsMap.has(teamName)) {
                teamsMap.set(teamName, []);
            }
            teamsMap.get(teamName).push(u);
        });

        teamsMap.forEach((teamUsers, teamName) => {
            const group = document.createElement("optgroup");
            group.label = `👥 ${teamName}`;
            teamUsers.forEach(u => {
                const opt = document.createElement("option");
                opt.value = u.id;
                const roleStr = u.roleName || u.roleCode || "";
                opt.textContent = `${u.fullName}${roleStr ? ` (${roleStr})` : ''} - ${u.email}`;
                group.appendChild(opt);
            });
            select.appendChild(group);
        });
    } catch (err) {
        console.error("Lỗi khi tải danh sách nhân sự phân bổ:", err);
        select.innerHTML = '<option value="">(Không thể tải danh sách nhân sự)</option>';
    }
}

async function openReassignModal(oppIds) {
    if (!oppIds || oppIds.length === 0) return;
    reassigningOppIds = oppIds;

    const modal = document.getElementById("reassignOpportunityModal");
    const overlay = document.getElementById("reassignOpportunityOverlay");
    const countTitle = document.getElementById("reassignTargetCountTitle");
    const countBadge = document.getElementById("reassignTargetCountBadge");
    const contextDetails = document.getElementById("reassignContextDetails");
    const reasonInput = document.getElementById("reassignReason");
    const reasonPreset = document.getElementById("reassignReasonPreset");
    const notesInput = document.getElementById("reassignNotes");
    const errorEl = document.getElementById("reassignError");

    if (oppIds.length === 1) {
        const opp = opportunities.find(o => o.id === oppIds[0]);
        if (countTitle) countTitle.textContent = `Chuyển giao cơ hội: ${opp?.name || '#' + oppIds[0]}`;
        if (countBadge) countBadge.textContent = "1 DEAL";
        if (contextDetails) {
            contextDetails.innerHTML = `Người phụ trách hiện tại: <strong>${escapeHtml(opp?.ownerName || 'Chưa gán')}</strong> (${escapeHtml(opp?.customerName || 'Chưa có KH')}, ${formatMoney(opp?.amount || 0)}).`;
        }
    } else {
        if (countTitle) countTitle.textContent = `Đang phân bổ hàng loạt ${oppIds.length} cơ hội đã chọn`;
        if (countBadge) countBadge.textContent = `${oppIds.length} DEALS`;
        if (contextDetails) {
            contextDetails.innerHTML = `Toàn bộ <strong>${oppIds.length} cơ hội</strong> này sẽ được đổi người sở hữu, bảo lưu đầy đủ lịch sử hoạt động và ghi nhật ký phân bổ kèm lý do.`;
        }
    }

    if (reasonInput) reasonInput.value = "";
    if (reasonPreset) reasonPreset.value = "";
    if (notesInput) notesInput.value = "";
    if (errorEl) errorEl.textContent = "";

    await loadAssignableUsers();

    if (modal) modal.style.display = "block";
    if (overlay) overlay.style.display = "block";
}

function closeReassignModal() {
    const modal = document.getElementById("reassignOpportunityModal");
    const overlay = document.getElementById("reassignOpportunityOverlay");
    if (modal) modal.style.display = "none";
    if (overlay) overlay.style.display = "none";
    reassigningOppIds = [];
}

async function loadAndRenderAssignmentHistory(oppId) {
    const section = document.getElementById("opportunityAssignmentHistorySection");
    const list = document.getElementById("assignmentTimelineList");
    const countBadge = document.getElementById("assignmentHistoryCountBadge");
    const emptyEl = document.getElementById("assignmentHistoryEmpty");
    if (!section || !list) return;

    try {
        const history = await api(`/api/opportunities/${oppId}/assignment-history`);
        if (Array.isArray(history) && history.length > 0) {
            section.style.display = "block";
            if (countBadge) countBadge.textContent = `${history.length} lần`;
            if (emptyEl) emptyEl.style.display = "none";
            list.innerHTML = history.map(item => {
                const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "—";
                return `
                    <div class="assignment-timeline-item">
                        <div class="assignment-item-header">
                            <div class="assignment-users">
                                <span>${escapeHtml(item.fromUserName || 'Chưa gán')}</span>
                                <span style="color: #0284c7; margin: 0 4px;">➔</span>
                                <span style="color: #0284c7; font-weight: 700;">${escapeHtml(item.toUserName || 'N/A')}</span>
                            </div>
                            <span class="assignment-time">${timeStr}</span>
                        </div>
                        <div class="assignment-reason-box">
                            <strong>Lý do:</strong> ${escapeHtml(item.reason || 'Bàn giao')}
                            ${item.notes ? `<div style="font-size: 11.5px; color: #64748b; margin-top: 2px;"><em>Ghi chú:</em> ${escapeHtml(item.notes)}</div>` : ''}
                        </div>
                        <div class="assignment-actor">
                            👤 Người chuyển giao: <strong>${escapeHtml(item.assignedByName || 'Hệ thống')}</strong>
                        </div>
                    </div>
                `;
            }).join("");
        } else {
            section.style.display = "block";
            if (countBadge) countBadge.textContent = "0 lần";
            if (emptyEl) emptyEl.style.display = "block";
            list.innerHTML = "";
        }
    } catch (err) {
        section.style.display = "none";
    }
}

/* =========================================================
   USER STORY 1: AUDIT & FIELD CHANGE HISTORY
========================================================= */
async function loadAndRenderFieldHistory(oppId) {
    const section = document.getElementById("opportunityFieldHistorySection");
    const tableBody = document.getElementById("oppFieldHistoryTableBody");
    const countBadge = document.getElementById("oppFieldHistoryCountBadge");
    if (!tableBody) return;
    if (section) section.style.display = "block";

    try {
        const history = await api(`/api/opportunities/${oppId}/history`);
        if (Array.isArray(history) && history.length > 0) {
            if (countBadge) countBadge.textContent = `${history.length} thay đổi`;
            tableBody.innerHTML = history.map(item => {
                const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                }) : "—";

                let label = item.fieldLabel || item.fieldName;
                if (item.fieldName === "STAGE") label = "Giai đoạn";
                else if (item.fieldName === "AMOUNT") label = "Giá trị cơ hội";
                else if (item.fieldName === "EXPECTED_CLOSE_DATE") label = "Ngày dự kiến chốt";
                else if (item.fieldName === "OWNER") label = "Người sở hữu";

                return `
                    <tr>
                        <td style="color: #64748b; font-size: 11.5px; white-space: nowrap;">${timeStr}</td>
                        <td style="font-weight: 600; color: #1e293b;">${escapeHtml(item.changedByName || 'Hệ thống')}</td>
                        <td><span class="field-name-badge">${escapeHtml(label)}</span></td>
                        <td>
                            <span class="diff-badge-old">${escapeHtml(item.oldValue || '—')}</span>
                            <span class="diff-badge-arrow">➔</span>
                            <span class="diff-badge-new">${escapeHtml(item.newValue || '—')}</span>
                        </td>
                        <td style="color: #475569; font-size: 11.5px;">${escapeHtml(item.reason || '—')}</td>
                    </tr>
                `;
            }).join("");
        } else {
            if (countBadge) countBadge.textContent = "0 thay đổi";
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #94a3b8; padding: 16px; font-style: italic;">
                        Chưa có lịch sử thay đổi trường thông tin nào cho cơ hội này.
                    </td>
                </tr>
            `;
        }
    } catch (err) {
        console.warn("Could not load field history:", err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #ef4444; padding: 12px;">
                    Không thể tải lịch sử thay đổi.
                </td>
            </tr>
        `;
    }
}

/* =========================================================
   USER STORY 2: SAVED FILTERS & MULTI-CRITERIA FILTERING
========================================================= */
function populateStageFilter() {
    if (!stageFilter) return;
    const cur = stageFilter.value;
    stageFilter.innerHTML = '<option value="">🎯 Tất cả giai đoạn</option>';
    stages.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name;
        if (String(s.id) === String(cur)) opt.selected = true;
        stageFilter.appendChild(opt);
    });
}

function populateProductFilter() {
    if (!productFilter) return;
    const cur = productFilter.value;
    productFilter.innerHTML = '<option value="">📦 Tất cả sản phẩm</option>';
    productCatalog.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        const price = p.listPrice || p.price || 0;
        opt.textContent = `${p.name}${price > 0 ? ' (' + formatMoney(price) + ')' : ''}`;
        if (String(p.id) === String(cur)) opt.selected = true;
        productFilter.appendChild(opt);
    });
}

async function loadSavedFilters() {
    if (!savedFiltersSelect) return;
    try {
        const data = await api("/api/saved-filters?module=OPPORTUNITY");
        savedFiltersList = Array.isArray(data) ? data : [];
        savedFiltersSelect.innerHTML = '<option value="">⭐ Bộ lọc đã lưu...</option>';
        savedFiltersList.forEach(f => {
            const opt = document.createElement("option");
            opt.value = f.id;
            opt.textContent = (f.isPreset ? "📌 " : "💾 ") + f.name;
            savedFiltersSelect.appendChild(opt);
        });
        if (btnDeleteSavedFilter) btnDeleteSavedFilter.disabled = true;
    } catch (e) {
        console.warn("Could not load saved filters:", e);
    }
}

function handleSelectSavedFilter() {
    const selectedId = savedFiltersSelect?.value;
    if (!selectedId) {
        if (btnDeleteSavedFilter) btnDeleteSavedFilter.disabled = true;
        return;
    }

    const filterObj = savedFiltersList.find(f => String(f.id) === String(selectedId));
    if (!filterObj) return;

    if (btnDeleteSavedFilter) {
        btnDeleteSavedFilter.disabled = !!filterObj.isPreset;
    }

    let criteria = {};
    try {
        criteria = typeof filterObj.filterCriteria === "string" 
            ? JSON.parse(filterObj.filterCriteria) 
            : (filterObj.filterCriteria || {});
    } catch (e) {
        criteria = {};
    }

    if (criteria.stageId && stageFilter) stageFilter.value = criteria.stageId;
    else if (stageFilter) stageFilter.value = "";

    if (criteria.ownerFilter && ownerFilter) ownerFilter.value = criteria.ownerFilter;
    else if (criteria.ownerId && ownerFilter) ownerFilter.value = criteria.ownerId;
    else if (ownerFilter) ownerFilter.value = "";

    if (criteria.productId && productFilter) productFilter.value = criteria.productId;
    else if (productFilter) productFilter.value = "";

    if (criteria.minAmount !== undefined && criteria.minAmount !== null && amountMin) amountMin.value = criteria.minAmount;
    else if (amountMin) amountMin.value = "";

    if (criteria.maxAmount !== undefined && criteria.maxAmount !== null && amountMax) amountMax.value = criteria.maxAmount;
    else if (amountMax) amountMax.value = "";

    if (criteria.closeDatePreset && closeDatePreset) {
        closeDatePreset.value = criteria.closeDatePreset;
        if (customDateRangeWrap) {
            customDateRangeWrap.style.display = criteria.closeDatePreset === "CUSTOM" ? "flex" : "none";
        }
    } else if (closeDatePreset) {
        closeDatePreset.value = "";
        if (customDateRangeWrap) customDateRangeWrap.style.display = "none";
    }

    if (criteria.closeDateFrom && closeDateFrom) closeDateFrom.value = criteria.closeDateFrom;
    else if (closeDateFrom) closeDateFrom.value = "";

    if (criteria.closeDateTo && closeDateTo) closeDateTo.value = criteria.closeDateTo;
    else if (closeDateTo) closeDateTo.value = "";

    if (criteria.keyword && searchInput) searchInput.value = criteria.keyword;
    else if (criteria.productKeyword && searchInput) searchInput.value = criteria.productKeyword;

    if (criteria.minAmount || criteria.maxAmount || criteria.closeDatePreset === "CUSTOM") {
        const advPanel = document.getElementById("pipelineAdvancedPanel");
        if (advPanel) advPanel.style.display = "block";
        document.getElementById("btnTogglePipelineAdvanced")?.classList.add("open");
    }

    loadOpportunities();
}

function openSaveFilterModal() {
    if (saveFilterModal) saveFilterModal.style.display = "block";
    if (saveFilterOverlay) saveFilterOverlay.style.display = "block";
    if (savedFilterNameInput) {
        savedFilterNameInput.value = "";
        savedFilterNameInput.focus();
    }
    if (saveFilterError) saveFilterError.textContent = "";
}

function closeSaveFilterModal() {
    if (saveFilterModal) saveFilterModal.style.display = "none";
    if (saveFilterOverlay) saveFilterOverlay.style.display = "none";
    if (saveFilterError) saveFilterError.textContent = "";
}

async function handleSaveFilter(e) {
    if (e) e.preventDefault();
    const name = savedFilterNameInput?.value.trim();
    if (!name) {
        if (saveFilterError) saveFilterError.textContent = "Vui lòng nhập tên bộ lọc.";
        return;
    }

    const criteria = {};
    if (searchInput?.value.trim()) criteria.keyword = searchInput.value.trim();
    if (stageFilter?.value) criteria.stageId = stageFilter.value;
    if (ownerFilter?.value) criteria.ownerFilter = ownerFilter.value;
    if (productFilter?.value) criteria.productId = productFilter.value;
    if (amountMin?.value) criteria.minAmount = amountMin.value;
    if (amountMax?.value) criteria.maxAmount = amountMax.value;
    if (closeDatePreset?.value) criteria.closeDatePreset = closeDatePreset.value;
    if (closeDateFrom?.value) criteria.closeDateFrom = closeDateFrom.value;
    if (closeDateTo?.value) criteria.closeDateTo = closeDateTo.value;

    try {
        await api("/api/saved-filters", {
            method: "POST",
            body: JSON.stringify({
                name: name,
                module: "OPPORTUNITY",
                filterCriteria: criteria
            })
        });
        closeSaveFilterModal();
        await loadSavedFilters();
        const found = savedFiltersList.find(f => f.name === name);
        if (found && savedFiltersSelect) {
            savedFiltersSelect.value = found.id;
            if (btnDeleteSavedFilter) btnDeleteSavedFilter.disabled = false;
        }
        alert("Đã lưu bộ lọc thành công!");
    } catch (err) {
        if (saveFilterError) saveFilterError.textContent = err.message || "Lỗi lưu bộ lọc.";
    }
}

async function handleDeleteSavedFilter() {
    const selectedId = savedFiltersSelect?.value;
    if (!selectedId) return;
    const filterObj = savedFiltersList.find(f => String(f.id) === String(selectedId));
    if (!filterObj || filterObj.isPreset) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa bộ lọc "${filterObj.name}" không?`)) return;

    try {
        await api(`/api/saved-filters/${selectedId}`, { method: "DELETE" });
        await loadSavedFilters();
        if (savedFiltersSelect) savedFiltersSelect.value = "";
        if (btnDeleteSavedFilter) btnDeleteSavedFilter.disabled = true;
        alert("Đã xóa bộ lọc thành công!");
    } catch (err) {
        alert("Không thể xóa bộ lọc: " + err.message);
    }
}

/* =========================================================
   USER STORY 3: OPPORTUNITY TEAM & COLLABORATION
========================================================= */
let currentOppDetail = null;

async function loadAndRenderOpportunityTeam(oppId) {
    const section = document.getElementById("opportunityTeamSection");
    const membersListEl = document.getElementById("opportunityMembersList");
    const countBadge = document.getElementById("oppMemberCountBadge");
    const noticeEl = document.getElementById("collaboratorRoleNotice");
    const newMemberUserSelect = document.getElementById("newMemberUserSelect");
    const addMemberFormWrap = document.getElementById("oppAddMemberFormWrap");

    if (!membersListEl) return;
    if (section) section.style.display = "block";

    try {
        const [detail, members, activities] = await Promise.all([
            api(`/api/opportunities/${oppId}`),
            api(`/api/opportunities/${oppId}/members`),
            api(`/api/opportunities/${oppId}/activities`)
        ]);

        currentOppDetail = detail;
        const ownerId = detail?.ownerUserId;
        const isOwner = currentUser && ownerId === currentUser.id;
        const isCollaborator = Array.isArray(members) && members.some(m => m.userId === currentUser?.id);
        const canManage = isTeamLeadOrAbove() || isOwner;

        if (isCollaborator && !canManage) {
            if (noticeEl) noticeEl.style.display = "block";
            const ownerInput = document.getElementById("opportunityOwner");
            if (ownerInput) ownerInput.disabled = true;
            if (btnQuickReassignInDrawer) btnQuickReassignInDrawer.style.display = "none";
            if (btnDrawerReassignOpp) btnDrawerReassignOpp.style.display = "none";
            if (addMemberFormWrap) addMemberFormWrap.style.display = "none";
        } else {
            if (noticeEl) noticeEl.style.display = "none";
            if (addMemberFormWrap) addMemberFormWrap.style.display = "flex";
        }

        const totalCount = 1 + (Array.isArray(members) ? members.length : 0);
        if (countBadge) countBadge.textContent = `${totalCount} thành viên`;

        let html = `
            <div class="opp-member-card is-owner">
                <div class="opp-member-info">
                    <div class="opp-member-avatar" style="background: #a855f7;">
                        ${(detail?.ownerName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="opp-member-name">${escapeHtml(detail?.ownerName || 'Chủ sở hữu')}</div>
                        <div style="font-size: 11px; color: #64748b;">${escapeHtml(detail?.ownerEmail || '')}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="opp-member-role-tag owner">⭐ Người phụ trách chính</span>
                </div>
            </div>
        `;

        if (Array.isArray(members) && members.length > 0) {
            members.forEach(m => {
                const canRemove = canManage || (currentUser && m.userId === currentUser.id);
                html += `
                    <div class="opp-member-card">
                        <div class="opp-member-info">
                            <div class="opp-member-avatar" style="background: #0284c7;">
                                ${(m.userName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="opp-member-name">${escapeHtml(m.userName || 'Thành viên')}</div>
                                <div style="font-size: 11px; color: #64748b;">${escapeHtml(m.userEmail || '')}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="opp-member-role-tag collaborator">🤝 ${escapeHtml(m.roleInOpportunity || 'Thành viên phối hợp')}</span>
                            ${canRemove ? `
                                <button type="button" class="btn-remove-member" title="Xóa thành viên khỏi cơ hội" onclick="handleRemoveMember(${m.userId}, '${escapeHtml(m.userName || '')}')">
                                    ✕
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
        }

        membersListEl.innerHTML = html;

        if (newMemberUserSelect) {
            if (!assignableUsersList) {
                try {
                    const uRes = await api("/api/users?size=100");
                    assignableUsersList = uRes?.items || (Array.isArray(uRes) ? uRes : []);
                } catch (_) {
                    assignableUsersList = [];
                }
            }

            const existingUserIds = new Set([ownerId]);
            if (Array.isArray(members)) {
                members.forEach(m => existingUserIds.add(m.userId));
            }

            newMemberUserSelect.innerHTML = '<option value="">-- Chọn nhân sự --</option>';
            assignableUsersList.forEach(u => {
                if (!existingUserIds.has(u.id)) {
                    const opt = document.createElement("option");
                    opt.value = u.id;
                    opt.textContent = `${u.fullName || u.email} (${u.role || 'Sales'})`;
                    newMemberUserSelect.appendChild(opt);
                }
            });
        }

        renderOpportunityActivities(activities);

        // Load contacts for quick activity contact dropdown
        if (detail?.customerId) {
            try {
                const contactsRes = await api(`/api/contacts?customerId=${detail.customerId}`);
                const contactSelect = document.getElementById("quickActivityContact");
                if (contactSelect) {
                    contactSelect.innerHTML = '<option value="">-- Người liên hệ --</option>';
                    if (Array.isArray(contactsRes)) {
                        contactsRes.forEach(c => {
                            const opt = document.createElement("option");
                            opt.value = c.id;
                            opt.textContent = `${c.name || 'Người liên hệ'} (${c.phone || c.email || 'Liên hệ'})`;
                            if (detail.contactId && c.id === detail.contactId) {
                                opt.selected = true;
                            }
                            contactSelect.appendChild(opt);
                        });
                    }
                }
            } catch (_) {}
        }
    } catch (e) {
        console.warn("Could not load opportunity team:", e);
    }
}

function renderOpportunityActivities(activities) {
    const actListEl = document.getElementById("opportunityActivitiesList");
    if (!actListEl) return;

    if (Array.isArray(activities) && activities.length > 0) {
        actListEl.innerHTML = activities.slice(0, 15).map(act => {
            const timeStr = act.dueDate ? new Date(act.dueDate).toLocaleString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
            }) : (act.createdAt ? new Date(act.createdAt).toLocaleString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
            }) : "—");

            const typeEmoji = act.type === "CALL" ? "📞" : act.type === "MEETING" ? "🤝" : act.type === "EMAIL" ? "✉️" : "📝";
            const typeLabel = act.type === "CALL" ? "Cuộc gọi" : act.type === "MEETING" ? "Cuộc gặp" : act.type === "EMAIL" ? "Email" : "Ghi chú";

            return `
                <div class="opp-activity-item" style="border-left: 3px solid #3b82f6; background: #ffffff; border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
                    <div class="opp-activity-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                        <div>
                            <span style="display: inline-block; background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 4px; margin-right: 4px;">${typeEmoji} ${typeLabel}</span>
                            <strong style="font-size: 12.5px; color: #0f172a;">${escapeHtml(act.subject || 'Hoạt động')}</strong>
                        </div>
                        <span style="font-size: 11px; color: #64748b; white-space: nowrap;">📅 ${timeStr}</span>
                    </div>

                    ${act.description ? `<div style="color: #334155; font-size: 12px; margin: 4px 0; line-height: 1.4;">${escapeHtml(act.description)}</div>` : ''}

                    <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 4px; font-size: 11px;">
                        ${act.contactName ? `<span style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px;">👤 ${escapeHtml(act.contactName)}</span>` : ''}
                        ${act.durationMinutes ? `<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: 600;">⏱️ ${act.durationMinutes} phút</span>` : ''}
                        ${act.outcome ? `<span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 600;">🎯 ${escapeHtml(act.outcome)}</span>` : ''}
                        <span style="color: #94a3b8; margin-left: auto;">Người ghi: <strong>${escapeHtml(act.ownerName || 'Thành viên')}</strong></span>
                    </div>
                </div>
            `;
        }).join("");
    } else {
        actListEl.innerHTML = '<div style="font-size: 11.5px; color: #94a3b8; font-style: italic; padding: 4px 0;">Chưa có hoạt động nào được ghi nhận cho cơ hội này.</div>';
    }
}

async function handleAddMember() {
    if (!editingOppId) return;
    const userSelect = document.getElementById("newMemberUserSelect");
    const roleSelect = document.getElementById("newMemberRoleSelect");
    const userId = userSelect?.value;
    const role = roleSelect?.value || "Thành viên phối hợp";

    if (!userId) {
        alert("Vui lòng chọn nhân sự để thêm vào cơ hội.");
        return;
    }

    try {
        await api(`/api/opportunities/${editingOppId}/members`, {
            method: "POST",
            body: JSON.stringify({
                userId: Number(userId),
                roleInOpportunity: role
            })
        });
        await loadAndRenderOpportunityTeam(editingOppId);
        await loadAndRenderFieldHistory(editingOppId);
    } catch (err) {
        alert("Lỗi khi thêm thành viên: " + err.message);
    }
}

async function handleRemoveMember(userId, userName) {
    if (!editingOppId) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa thành viên "${userName}" khỏi cơ hội này?`)) return;

    try {
        await api(`/api/opportunities/${editingOppId}/members/${userId}`, {
            method: "DELETE"
        });
        await loadAndRenderOpportunityTeam(editingOppId);
        await loadAndRenderFieldHistory(editingOppId);
    } catch (err) {
        alert("Lỗi khi xóa thành viên: " + err.message);
    }
}

async function handleLogOpportunityActivity() {
    if (!editingOppId) return;
    const type = document.getElementById("quickActivityType")?.value || "NOTE";
    const subject = document.getElementById("quickActivitySubject")?.value.trim();
    const desc = document.getElementById("quickActivityDescription")?.value.trim();
    const contactId = document.getElementById("quickActivityContact")?.value || null;
    const timeVal = document.getElementById("quickActivityTime")?.value || null;
    const duration = document.getElementById("quickActivityDuration")?.value || 30;
    const outcome = document.getElementById("quickActivityOutcome")?.value.trim() || null;
    const msgEl = document.getElementById("quickActivityMsg");

    if (!subject) {
        alert("Vui lòng nhập tiêu đề hoạt động.");
        return;
    }

    try {
        await api(`/api/opportunities/${editingOppId}/activities`, {
            method: "POST",
            body: JSON.stringify({
                activityType: type,
                subject: subject,
                description: desc,
                contactId: contactId ? Number(contactId) : null,
                dueDate: timeVal ? `${timeVal.replace('T', ' ')}:00` : null,
                durationMinutes: Number(duration) || 0,
                outcome: outcome
            })
        });

        const subInput = document.getElementById("quickActivitySubject");
        const descInput = document.getElementById("quickActivityDescription");
        const outcomeInput = document.getElementById("quickActivityOutcome");
        if (subInput) subInput.value = "";
        if (descInput) descInput.value = "";
        if (outcomeInput) outcomeInput.value = "";

        if (msgEl) {
            msgEl.style.display = "inline";
            setTimeout(() => { msgEl.style.display = "none"; }, 3000);
        }

        const activities = await api(`/api/opportunities/${editingOppId}/activities`);
        renderOpportunityActivities(activities);
    } catch (err) {
        alert("Lỗi khi ghi hoạt động: " + err.message);
    }
}

/* =========================================================
   USER STORY 1: OPPORTUNITY ATTACHMENTS (HỒ SƠ THẦU, BIÊN BẢN HỌP)
========================================================= */
function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const dm = 1;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function getFileIcon(type, name) {
    const ext = (name && name.includes(".")) ? name.split(".").pop().toUpperCase() : (type || "").toUpperCase();
    if (ext.includes("PDF")) return "📕";
    if (ext.includes("DOC") || ext.includes("DOCX")) return "📘";
    if (ext.includes("XLS") || ext.includes("XLSX") || ext.includes("CSV")) return "📗";
    if (ext.includes("PNG") || ext.includes("JPG") || ext.includes("JPEG") || ext.includes("WEBP")) return "🖼️";
    if (ext.includes("ZIP") || ext.includes("RAR")) return "🗜️";
    return "📄";
}

async function loadAndRenderOpportunityAttachments(oppId) {
    const section = document.getElementById("opportunityAttachmentsSection");
    const countBadge = document.getElementById("oppAttachmentsCountBadge");
    const listEl = document.getElementById("oppAttachmentsList");

    if (!section || !listEl) return;
    section.style.display = "block";

    try {
        const res = await api(`/api/attachments?opportunityId=${oppId}`);
        const attachments = Array.isArray(res) ? res : [];
        if (countBadge) countBadge.textContent = `${attachments.length} tệp`;

        if (attachments.length === 0) {
            listEl.innerHTML = '<div style="font-size: 11.5px; color: #94a3b8; font-style: italic; padding: 6px 0;">Chưa có tài liệu hay hồ sơ thầu nào được đính kèm vào cơ hội này.</div>';
            return;
        }

        listEl.innerHTML = attachments.map(att => {
            const timeStr = att.createdAt ? new Date(att.createdAt).toLocaleString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
            }) : "—";
            const icon = getFileIcon(att.fileType, att.name);
            const sizeStr = formatBytes(att.fileSize);

            return `
                <div class="opp-att-item" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px;">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                        <span style="font-size: 20px;">${icon}</span>
                        <div style="min-width: 0;">
                            <div style="font-weight: 600; font-size: 12.5px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(att.name)}">
                                ${escapeHtml(att.name)}
                            </div>
                            <div style="font-size: 11px; color: #64748b; display: flex; gap: 8px; align-items: center; margin-top: 2px;">
                                <span>${sizeStr}</span>
                                <span>•</span>
                                <span>Người tải: <strong>${escapeHtml(att.uploadedBy || 'Người dùng')}</strong></span>
                                <span>•</span>
                                <span>📅 ${timeStr}</span>
                            </div>
                            ${att.notes ? `<div style="font-size: 10.5px; color: #475569; font-style: italic; margin-top: 2px;">"${escapeHtml(att.notes)}"</div>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <button type="button" class="crm-btn crm-btn-secondary" style="padding: 4px 10px; font-size: 11.5px; white-space: nowrap;" onclick="handleDownloadAttachment(${att.id})">
                            📥 Tải về
                        </button>
                        <button type="button" class="crm-btn" style="padding: 4px 8px; font-size: 11px; color: #ef4444; border: 1px solid #fee2e2; background: #fff;" title="Xóa tài liệu" onclick="handleDeleteAttachment(${att.id}, '${escapeHtml(att.name)}')">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    } catch (e) {
        console.warn("Could not load attachments:", e);
        listEl.innerHTML = '<div style="font-size: 11.5px; color: #dc2626;">Lỗi tải danh sách tài liệu.</div>';
    }
}

async function handleOppFileUpload(files) {
    if (!editingOppId || !files || files.length === 0) return;
    const msgEl = document.getElementById("oppAttachmentUploadMsg");

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 20 * 1024 * 1024) { // 20MB check
            alert(`⚠️ Tệp "${file.name}" có dung lượng ${(file.size / (1024 * 1024)).toFixed(1)}MB, vượt quá giới hạn tối đa 20MB theo quy định.`);
            return;
        }
    }

    const formData = new FormData();
    formData.append("opportunityId", String(editingOppId));
    if (currentOppDetail?.customerId) {
        formData.append("customerId", String(currentOppDetail.customerId));
    }
    for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
    }

    if (msgEl) {
        msgEl.style.display = "block";
        msgEl.style.color = "#2563eb";
        msgEl.textContent = `⏳ Đang tải lên ${files.length} tệp...`;
    }

    try {
        const res = await fetch(`${API_BASE}/api/attachments`, {
            method: "POST",
            credentials: "include",
            body: formData
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result?.message || `HTTP ${res.status}`);
        }
        if (msgEl) {
            msgEl.style.display = "block";
            msgEl.style.color = "#16a34a";
            msgEl.textContent = `✅ Đã tải lên thành công ${files.length} tệp!`;
            setTimeout(() => { msgEl.style.display = "none"; }, 4000);
        }
        const fileInput = document.getElementById("oppAttachmentFileInput");
        if (fileInput) fileInput.value = "";
        await loadAndRenderOpportunityAttachments(editingOppId);
    } catch (err) {
        if (msgEl) {
            msgEl.style.display = "block";
            msgEl.style.color = "#dc2626";
            msgEl.textContent = `❌ Lỗi: ${err.message}`;
        } else {
            alert("Lỗi khi tải tệp: " + err.message);
        }
    }
}

async function handleDownloadAttachment(id) {
    try {
        const resp = await fetch(`${API_BASE}/api/attachments/${id}/download`, { credentials: "include" });
        if (resp.status === 403) {
            let msg = "Bạn không có quyền tải xuống tài liệu này. Chỉ người sở hữu cơ hội và các cộng tác viên được chia sẻ trong đội ngũ mới được tải xuống.";
            try {
                const j = await resp.json();
                if (j?.message) msg = j.message;
            } catch (_) {}
            alert("⛔ PHÂN QUYỀN BẢO MẬT:\n" + msg);
            return;
        }
        if (!resp.ok) {
            alert("Không thể tải tài liệu: HTTP " + resp.status);
            return;
        }
        const blob = await resp.blob();
        let filename = "tai_lieu_" + id;
        const disp = resp.headers.get("Content-Disposition");
        if (disp && disp.includes("filename=")) {
            const match = disp.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
            if (match && match[1]) filename = decodeURIComponent(match[1]);
        }
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (err) {
        alert("Lỗi tải tài liệu: " + err.message);
    }
}

async function handleDeleteAttachment(id, name) {
    if (!confirm(`Bạn có chắc chắn muốn xóa tệp "${name}" khỏi cơ hội này?`)) return;
    try {
        await api(`/api/attachments/${id}`, { method: "DELETE" });
        await loadAndRenderOpportunityAttachments(editingOppId);
    } catch (err) {
        alert("Lỗi khi xóa tệp: " + err.message);
    }
}

/* =========================================================
   USER STORY 3: GLOBAL QUICK ACTIVITY MODAL (MOBILE FRIENDLY)
========================================================= */
let globalCustomersList = [];

async function openGlobalQuickActivityModal() {
    const modal = document.getElementById("globalQuickActivityModal");
    const overlay = document.getElementById("globalQuickActivityOverlay");
    const custSelect = document.getElementById("modalActivityCustomerSelect");
    const contactSelect = document.getElementById("modalActivityContactSelect");
    const oppSelect = document.getElementById("modalActivityOppSelect");
    const timeInput = document.getElementById("modalActivityTimeInput");
    const errorMsg = document.getElementById("modalActivityErrorMsg");

    if (!modal) return;
    if (errorMsg) errorMsg.style.display = "none";

    // Reset default time to now
    if (timeInput) {
        timeInput.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    modal.style.display = "block";
    if (overlay) overlay.style.display = "block";

    // Load customers list
    try {
        if (custSelect) {
            custSelect.innerHTML = '<option value="">-- Đang tải danh sách khách hàng... --</option>';
            const res = await api("/api/customers");
            globalCustomersList = Array.isArray(res) ? res : (res?.items || []);
            custSelect.innerHTML = '<option value="">-- Chọn khách hàng --</option>';
            globalCustomersList.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = c.name || `Khách hàng #${c.id}`;
                custSelect.appendChild(opt);
            });
        }
    } catch (err) {
        if (custSelect) custSelect.innerHTML = '<option value="">Lỗi tải danh sách khách hàng</option>';
    }
}

function closeGlobalQuickActivityModal() {
    const modal = document.getElementById("globalQuickActivityModal");
    const overlay = document.getElementById("globalQuickActivityOverlay");
    if (modal) modal.style.display = "none";
    if (overlay) overlay.style.display = "none";
}

async function onModalCustomerChanged() {
    const custId = document.getElementById("modalActivityCustomerSelect")?.value;
    const contactSelect = document.getElementById("modalActivityContactSelect");
    const oppSelect = document.getElementById("modalActivityOppSelect");

    if (!custId) {
        if (contactSelect) contactSelect.innerHTML = '<option value="">-- Chọn khách trước --</option>';
        if (oppSelect) oppSelect.innerHTML = '<option value="">-- Không gắn cơ hội --</option>';
        return;
    }

    // Load contacts of this customer
    try {
        if (contactSelect) {
            contactSelect.innerHTML = '<option value="">-- Đang tải người liên hệ... --</option>';
            const contacts = await api(`/api/contacts?customerId=${custId}`);
            contactSelect.innerHTML = '<option value="">-- Chọn người liên hệ --</option>';
            if (Array.isArray(contacts)) {
                contacts.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.id;
                    opt.textContent = `${c.name || 'Người liên hệ'} (${c.phone || c.email || 'Liên hệ'})`;
                    contactSelect.appendChild(opt);
                });
            }
        }
    } catch (_) {
        if (contactSelect) contactSelect.innerHTML = '<option value="">-- Không có người liên hệ --</option>';
    }

    // Load opportunities of this customer
    try {
        if (oppSelect) {
            oppSelect.innerHTML = '<option value="">-- Đang tải cơ hội... --</option>';
            const opps = await api(`/api/opportunities?customerId=${custId}`);
            oppSelect.innerHTML = '<option value="">-- Không gắn cơ hội --</option>';
            if (Array.isArray(opps)) {
                opps.forEach(o => {
                    const opt = document.createElement("option");
                    opt.value = o.id;
                    opt.textContent = `${o.name || 'Cơ hội'} (${o.stageName || 'OPEN'})`;
                    oppSelect.appendChild(opt);
                });
            }
        }
    } catch (_) {
        if (oppSelect) oppSelect.innerHTML = '<option value="">-- Không có cơ hội --</option>';
    }
}

async function handleGlobalQuickActivitySubmit(e) {
    e.preventDefault();
    const type = document.getElementById("modalActivityTypeVal")?.value || "CALL";
    const custId = document.getElementById("modalActivityCustomerSelect")?.value;
    const contactId = document.getElementById("modalActivityContactSelect")?.value || null;
    const oppId = document.getElementById("modalActivityOppSelect")?.value || null;
    const subject = document.getElementById("modalActivitySubjectInput")?.value.trim();
    const timeVal = document.getElementById("modalActivityTimeInput")?.value || null;
    const duration = document.getElementById("modalActivityDurationInput")?.value || 30;
    const desc = document.getElementById("modalActivityDescriptionInput")?.value.trim();
    const outcome = document.getElementById("modalActivityOutcomeInput")?.value.trim() || null;
    const errorMsg = document.getElementById("modalActivityErrorMsg");

    if (!custId) {
        if (errorMsg) {
            errorMsg.textContent = "Vui lòng chọn khách hàng liên quan.";
            errorMsg.style.display = "block";
        }
        return;
    }

    if (!subject) {
        if (errorMsg) {
            errorMsg.textContent = "Vui lòng nhập tiêu đề hoạt động.";
            errorMsg.style.display = "block";
        }
        return;
    }

    try {
        await api("/api/activities", {
            method: "POST",
            body: JSON.stringify({
                type: type,
                subject: subject,
                description: desc,
                customerId: Number(custId),
                contactId: contactId ? Number(contactId) : null,
                opportunityId: oppId ? Number(oppId) : null,
                dueDate: timeVal ? `${timeVal.replace('T', ' ')}:00` : null,
                durationMinutes: Number(duration) || 0,
                outcome: outcome,
                status: "COMPLETED"
            })
        });

        alert("✅ Đã ghi nhận hoạt động thành công!");
        closeGlobalQuickActivityModal();

        // If editing opportunity is open, refresh activities
        if (editingOppId) {
            const activities = await api(`/api/opportunities/${editingOppId}/activities`);
            renderOpportunityActivities(activities);
        }
    } catch (err) {
        if (errorMsg) {
            errorMsg.textContent = "Lỗi: " + err.message;
            errorMsg.style.display = "block";
        } else {
            alert("Lỗi khi ghi hoạt động: " + err.message);
        }
    }
}

// Helpers for quick activity chips
window.setQuickActivityDuration = function(mins) {
    const input = document.getElementById("quickActivityDuration");
    if (input) input.value = mins;
};

window.setQuickActivityOutcome = function(val) {
    const input = document.getElementById("quickActivityOutcome");
    if (input) input.value = val;
};

window.setModalDuration = function(mins) {
    const input = document.getElementById("modalActivityDurationInput");
    if (input) input.value = mins;
};

window.setModalOutcome = function(val) {
    const input = document.getElementById("modalActivityOutcomeInput");
    if (input) input.value = val;
};

function setupCollaborationAndFilterListeners() {
    stageFilter?.addEventListener("change", loadOpportunities);
    productFilter?.addEventListener("change", loadOpportunities);
    amountMin?.addEventListener("input", debounce(loadOpportunities, 400));
    amountMax?.addEventListener("input", debounce(loadOpportunities, 400));

    savedFiltersSelect?.addEventListener("change", handleSelectSavedFilter);
    btnSaveFilterModal?.addEventListener("click", openSaveFilterModal);
    btnDeleteSavedFilter?.addEventListener("click", handleDeleteSavedFilter);

    document.getElementById("closeSaveFilterModalX")?.addEventListener("click", closeSaveFilterModal);
    document.getElementById("cancelSaveFilterModalBtn")?.addEventListener("click", closeSaveFilterModal);
    saveFilterOverlay?.addEventListener("click", closeSaveFilterModal);
    saveFilterForm?.addEventListener("submit", handleSaveFilter);

    document.getElementById("btnAddMemberBtn")?.addEventListener("click", handleAddMember);
    document.getElementById("btnLogOpportunityActivity")?.addEventListener("click", handleLogOpportunityActivity);

    // Attachment file input listener
    document.getElementById("oppAttachmentFileInput")?.addEventListener("change", function() {
        handleOppFileUpload(this.files);
    });

    // Global Quick Activity Modal listeners
    document.getElementById("btnQuickLogActivityGlobal")?.addEventListener("click", openGlobalQuickActivityModal);
    document.getElementById("closeGlobalQuickActivityModalX")?.addEventListener("click", closeGlobalQuickActivityModal);
    document.getElementById("cancelGlobalQuickActivityBtn")?.addEventListener("click", closeGlobalQuickActivityModal);
    document.getElementById("globalQuickActivityOverlay")?.addEventListener("click", closeGlobalQuickActivityModal);
    document.getElementById("modalActivityCustomerSelect")?.addEventListener("change", onModalCustomerChanged);
    document.getElementById("globalQuickActivityForm")?.addEventListener("submit", handleGlobalQuickActivitySubmit);

    // Activity Type pills in modal
    document.querySelectorAll(".act-type-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".act-type-btn").forEach(b => {
                b.classList.remove("active");
                b.style.borderColor = "#cbd5e1";
                b.style.background = "#fff";
                b.style.color = "#475569";
            });
            this.classList.add("active");
            this.style.borderColor = "#2563eb";
            this.style.background = "#eff6ff";
            this.style.color = "#1d4ed8";
            const val = this.dataset.type;
            const hidden = document.getElementById("modalActivityTypeVal");
            if (hidden) hidden.value = val;
        });
    });
}

window.handleRemoveMember = handleRemoveMember;
window.openReassignModal = openReassignModal;
window.closeReassignModal = closeReassignModal;
window.updateBulkActionBar = updateBulkActionBar;
window.handleDownloadAttachment = handleDownloadAttachment;
window.handleDeleteAttachment = handleDeleteAttachment;
window.handleOppFileUpload = handleOppFileUpload;
window.openGlobalQuickActivityModal = openGlobalQuickActivityModal;
window.closeGlobalQuickActivityModal = closeGlobalQuickActivityModal;

// Start
initPipeline();


