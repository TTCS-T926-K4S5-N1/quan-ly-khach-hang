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
const ownerFilter = document.getElementById("ownerFilter");
const teamFilter = document.getElementById("teamFilter");
const closeDatePreset = document.getElementById("closeDatePreset");
const customDateRangeWrap = document.getElementById("customDateRangeWrap");
const closeDateFrom = document.getElementById("closeDateFrom");
const closeDateTo = document.getElementById("closeDateTo");
const leadSourceFilter = document.getElementById("leadSourceFilter");

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
const pipelineFilterSection = document.getElementById("pipelineFilterSection");
const forecastSection = document.getElementById("forecastSection");

const btnStagnantFilter = document.getElementById("btnStagnantFilter");
const stagnantBadgeCount = document.getElementById("stagnantBadgeCount");
const btnScanStagnant = document.getElementById("btnScanStagnant");

const reopenDealModal = document.getElementById("reopenDealModal");
const reopenDealOverlay = document.getElementById("reopenDealOverlay");
const reopenDealForm = document.getElementById("reopenDealForm");
const reopenDealReason = document.getElementById("reopenDealReason");
const reopenDealError = document.getElementById("reopenDealError");
const btnDrawerReopenDeal = document.getElementById("btnDrawerReopenDeal");

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
            loadProductCatalog()
        ]);
        setupOppProductEventListeners();
        setupStoryEventListeners();
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

        if (stagnantFilterActive) {
            params.append("stagnantOnly", "true");
        }

        const qs = params.toString() ? "?" + params.toString() : "";
        const list = await api("/api/opportunities" + qs);
        if (Array.isArray(list)) {
            opportunities = list;
            // Update stagnant badge count
            const stagnantCount = opportunities.filter(o => (o.isStagnant === true || o.isStagnant === 1) && o.stagnantFlag && o.stagnantFlag !== "NONE").length;
            if (stagnantBadgeCount) {
                if (stagnantCount > 0) {
                    stagnantBadgeCount.textContent = stagnantCount;
                    stagnantBadgeCount.style.display = "inline-block";
                } else {
                    stagnantBadgeCount.style.display = "none";
                }
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
        customDateRangeWrap.style.display = closeDatePreset.value === "CUSTOM" ? "inline-flex" : "none";
    }
    if (closeDatePreset.value !== "CUSTOM") {
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
        btnStagnantFilter.classList.remove("crm-btn-primary");
        btnStagnantFilter.classList.add("crm-btn-secondary");
        btnStagnantFilter.style.background = "";
        btnStagnantFilter.style.borderColor = "";
        btnStagnantFilter.style.color = "";
    }
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
            ${isTeamLeadOrAbove() ? `<button type="button" style="color:#2563eb; font-weight:600;" data-reopen-opportunity="${record.id}">🔓 Mở lại cơ hội</button>` : ""}
            ${isTeamLeadOrAbove() ? `<button type="button" style="color:#ef4444;" data-delete-opportunity="${record.id}">🗑 Xóa</button>` : ""}
        `;
    } else {
        cardMenuHtml = `
            <button type="button" data-edit-opportunity="${record.id}">Sửa</button>
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
        }
    } else {
        if (titleEl) titleEl.textContent = "Thêm cơ hội";
        if (bannerEl) bannerEl.style.display = "none";
        setOpportunityFormDisabled(false);
        if (saveBtn) saveBtn.style.display = "inline-block";
        if (reopenBtn) reopenBtn.style.display = "none";

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
    if (tab === "KANBAN") {
        if (tabKanbanView) {
            tabKanbanView.className = "crm-btn crm-btn-primary";
        }
        if (tabForecastView) {
            tabForecastView.className = "crm-btn crm-btn-secondary";
        }
        if (pipelineFilterSection) pipelineFilterSection.style.display = "flex";
        if (pipelineBoard) pipelineBoard.style.display = "grid";
        if (forecastSection) forecastSection.style.display = "none";
    } else {
        if (tabKanbanView) {
            tabKanbanView.className = "crm-btn crm-btn-secondary";
        }
        if (tabForecastView) {
            tabForecastView.className = "crm-btn crm-btn-primary";
        }
        if (pipelineFilterSection) pipelineFilterSection.style.display = "none";
        if (pipelineBoard) pipelineBoard.style.display = "none";
        if (forecastSection) forecastSection.style.display = "block";
        loadForecastData();
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

function setupStoryEventListeners() {
    // Tab switching
    tabKanbanView?.addEventListener("click", () => setPipelineTab("KANBAN"));
    tabForecastView?.addEventListener("click", () => setPipelineTab("FORECAST"));

    // Stagnation filter & scan
    btnStagnantFilter?.addEventListener("click", () => {
        stagnantFilterActive = !stagnantFilterActive;
        if (stagnantFilterActive) {
            btnStagnantFilter.classList.add("crm-btn-primary");
            btnStagnantFilter.classList.remove("crm-btn-secondary");
            btnStagnantFilter.style.background = "#ef4444";
            btnStagnantFilter.style.borderColor = "#ef4444";
            btnStagnantFilter.style.color = "#ffffff";
        } else {
            btnStagnantFilter.classList.remove("crm-btn-primary");
            btnStagnantFilter.classList.add("crm-btn-secondary");
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
}

// Start
initPipeline();

