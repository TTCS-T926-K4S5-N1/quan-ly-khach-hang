"use strict";

const API_BASE = "http://localhost:8080/crm";

let stages = [];
let opportunities = [];
let customers = [];
let products = [];
let winReasons = [];
let lossReasons = [];
let competitors = [];
let savedFilters = [];
let activeSavedFilterId = null;

let draggedOppId = null;
let closingOppId = null;
let editingOppId = null;

const pipelineBoard = document.getElementById("pipelineBoard");
const opportunityDrawer = document.getElementById("opportunityDrawer");
const opportunityOverlay = document.getElementById("opportunityOverlay");
const opportunityForm = document.getElementById("opportunityForm");
const searchInput = document.getElementById("pipelineSearch");
const stageFilter = document.getElementById("stageFilter");
const productFilter = document.getElementById("productFilter");
const ownerFilter = document.getElementById("ownerFilter");
const minAmountFilter = document.getElementById("minAmountFilter");
const maxAmountFilter = document.getElementById("maxAmountFilter");
const closeDateFromFilter = document.getElementById("closeDateFromFilter");
const closeDateToFilter = document.getElementById("closeDateToFilter");
const savedFilterChips = document.getElementById("savedFilterChips");
const saveFilterModal = document.getElementById("saveFilterModal");
const saveFilterForm = document.getElementById("saveFilterForm");

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
        await Promise.all([
            loadStages(),
            loadWinLossAndCompetitors(),
            loadCustomers(),
            loadProducts(),
            loadSavedFilters(),
            loadOpportunities()
        ]);
        setupFilterEventListeners();
    } catch (err) {
        console.error("Initialization error:", err);
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

async function loadOpportunities() {
    const params = new URLSearchParams();

    const kw = (searchInput?.value || "").trim();
    if (kw) params.append("keyword", kw);

    const stId = stageFilter?.value;
    if (stId) params.append("stageId", stId);

    const pId = productFilter?.value;
    if (pId) params.append("productId", pId);

    const ow = ownerFilter?.value;
    if (ow) {
        if (ow === "MINE" || ow === "Tôi") params.append("ownerFilter", "MINE");
        else params.append("ownerId", ow);
    }

    const minA = minAmountFilter?.value;
    if (minA) params.append("minAmount", minA);

    const maxA = maxAmountFilter?.value;
    if (maxA) params.append("maxAmount", maxA);

    const fromDate = closeDateFromFilter?.value;
    if (fromDate) params.append("closeDateFrom", fromDate);

    const toDate = closeDateToFilter?.value;
    if (toDate) params.append("closeDateTo", toDate);

    const queryString = params.toString() ? `?${params.toString()}` : "";

    try {
        const list = await api(`/api/opportunities${queryString}`);
        if (Array.isArray(list)) {
            opportunities = list;
            // Sync with localStorage for offline / dashboard view
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

/* =========================================================
   POPULATE DROPDOWNS
========================================================= */
function populateStageSelect() {
    const stageSelect = document.getElementById("opportunityStage");
    if (stageSelect) {
        stageSelect.innerHTML = "";
        stages.forEach(st => {
            const opt = document.createElement("option");
            opt.value = st.id;
            opt.textContent = `${st.name} (${st.probability}%)`;
            stageSelect.appendChild(opt);
        });
    }

    if (stageFilter) {
        stageFilter.innerHTML = '<option value="">-- Tất cả giai đoạn --</option>';
        stages.forEach(st => {
            const opt = document.createElement("option");
            opt.value = st.id;
            opt.textContent = st.name;
            stageFilter.appendChild(opt);
        });
    }
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
   PRODUCTS & SAVED FILTERS (SCRUM-81)
========================================================= */
async function loadProducts() {
    try {
        const list = await api("/api/products?active=true");
        if (Array.isArray(list) && list.length > 0) {
            products = list;
        }
    } catch (err) {
        console.warn("Could not load products:", err);
    }

    if (!products || products.length === 0) {
        products = [
            { id: 1, code: "CRM-CLOUD-ENT", name: "Phần mềm CRM Cloud Doanh Nghiệp" },
            { id: 2, code: "CRM-IMPL", name: "Dịch vụ Triển khai & Đào tạo CRM" },
            { id: 3, code: "CRM-USER-LIC", name: "Gói người dùng bổ sung CRM" },
            { id: 4, code: "HW-SERVER", name: "Máy chủ lưu trữ Dedicated" }
        ];
    }

    populateProductFilter();
}

function populateProductFilter() {
    if (!productFilter) return;
    productFilter.innerHTML = '<option value="">-- Lọc theo sản phẩm --</option>';
    products.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.code || ""})`;
        productFilter.appendChild(opt);
    });
}

async function loadSavedFilters() {
    try {
        const data = await api("/api/saved-filters?module=OPPORTUNITY");
        savedFilters = Array.isArray(data) ? data : [];
    } catch (err) {
        console.warn("Không thể tải danh sách bộ lọc đã lưu:", err);
    }

    if (!savedFilters || savedFilters.length === 0) {
        savedFilters = [
            { id: "preset_week", name: "Cơ hội chốt trong tuần này", filterCriteria: '{"quickDate":"THIS_WEEK"}', isPreset: true, canDelete: false },
            { id: "preset_100m", name: "Thương vụ lớn (> 100tr)", filterCriteria: '{"minAmount":100000000}', isPreset: true, canDelete: false },
            { id: "preset_mine", name: "Cơ hội do tôi phụ trách", filterCriteria: '{"ownerFilter":"MINE"}', isPreset: true, canDelete: false },
            { id: "preset_month", name: "Cơ hội chốt trong tháng này", filterCriteria: '{"quickDate":"THIS_MONTH"}', isPreset: true, canDelete: false }
        ];
    }

    renderSavedFilterChips();
}

function renderSavedFilterChips() {
    if (!savedFilterChips) return;
    savedFilterChips.innerHTML = "";

    // 1. Chip "Tất cả cơ hội"
    const allChip = document.createElement("button");
    allChip.type = "button";
    allChip.className = `saved-filter-chip ${activeSavedFilterId === null ? "active" : ""}`;
    allChip.innerHTML = `⭐ Tất cả cơ hội`;
    allChip.addEventListener("click", () => {
        resetAllFilters();
    });
    savedFilterChips.appendChild(allChip);

    // 2. Render các chip từ database
    savedFilters.forEach(f => {
        const chip = document.createElement("button");
        chip.type = "button";
        const isActive = activeSavedFilterId === f.id;
        chip.className = `saved-filter-chip ${isActive ? "active" : ""}`;

        let icon = "🔖";
        if (f.name.includes("tuần")) icon = "📅";
        else if (f.name.includes("100tr") || f.name.includes("lớn") || f.name.includes("giá trị")) icon = "💰";
        else if (f.name.includes("tôi") || f.name.includes("phụ trách")) icon = "👤";
        else if (f.name.includes("tháng")) icon = "🗓️";

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

    document.querySelectorAll(".quick-date-btn").forEach(btn => btn.classList.remove("active"));

    if (searchInput) searchInput.value = crit.keyword || "";
    if (stageFilter) stageFilter.value = crit.stageId ? String(crit.stageId) : "";
    if (productFilter) productFilter.value = crit.productId ? String(crit.productId) : "";
    if (ownerFilter) {
        if (crit.ownerFilter) ownerFilter.value = crit.ownerFilter;
        else if (crit.ownerId) ownerFilter.value = String(crit.ownerId);
        else ownerFilter.value = "";
    }
    if (minAmountFilter) minAmountFilter.value = crit.minAmount || "";
    if (maxAmountFilter) maxAmountFilter.value = crit.maxAmount || "";

    if (crit.quickDate) {
        applyQuickDate(crit.quickDate);
    } else {
        if (closeDateFromFilter) closeDateFromFilter.value = crit.closeDateFrom || "";
        if (closeDateToFilter) closeDateToFilter.value = crit.closeDateTo || "";
    }

    renderSavedFilterChips();
    loadOpportunities();
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
    if (stageFilter) stageFilter.value = "";
    if (productFilter) productFilter.value = "";
    if (ownerFilter) ownerFilter.value = "";
    if (minAmountFilter) minAmountFilter.value = "";
    if (maxAmountFilter) maxAmountFilter.value = "";
    if (closeDateFromFilter) closeDateFromFilter.value = "";
    if (closeDateToFilter) closeDateToFilter.value = "";
    document.querySelectorAll(".quick-date-btn").forEach(btn => btn.classList.remove("active"));
    renderSavedFilterChips();
    loadOpportunities();
}

function applyQuickDate(type) {
    const d = new Date();
    document.querySelectorAll(".quick-date-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.quickDate === type);
    });

    if (type === "THIS_WEEK") {
        const day = d.getDay();
        const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diffToMon));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        if (closeDateFromFilter) closeDateFromFilter.value = formatDateYmd(monday);
        if (closeDateToFilter) closeDateToFilter.value = formatDateYmd(sunday);
    } else if (type === "THIS_MONTH") {
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);

        if (closeDateFromFilter) closeDateFromFilter.value = formatDateYmd(firstDay);
        if (closeDateToFilter) closeDateToFilter.value = formatDateYmd(lastDay);
    }
}

function formatDateYmd(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function setupSaveFilterModal() {
    const btnOpen = document.getElementById("btnOpenSaveFilterModal");
    const modal = document.getElementById("saveFilterModal");
    const btnClose = document.getElementById("closeSaveFilterModal");
    const btnCancel = document.getElementById("cancelSaveFilter");
    const form = document.getElementById("saveFilterForm");
    const summaryEl = document.getElementById("saveFilterSummary");

    btnOpen?.addEventListener("click", () => {
        const conditions = [];
        if (searchInput?.value) conditions.push(`Từ khóa: "${searchInput.value}"`);
        if (stageFilter?.value) {
            const st = stages.find(s => String(s.id) === stageFilter.value);
            conditions.push(`Giai đoạn: ${st ? st.name : stageFilter.value}`);
        }
        if (productFilter?.value) {
            const pr = products.find(p => String(p.id) === productFilter.value);
            conditions.push(`Sản phẩm: ${pr ? pr.name : productFilter.value}`);
        }
        if (ownerFilter?.value) conditions.push(`Người sở hữu: ${ownerFilter.value === "MINE" ? "Tôi phụ trách" : ownerFilter.value}`);
        if (minAmountFilter?.value) conditions.push(`Giá từ: ${formatMoney(minAmountFilter.value)}`);
        if (maxAmountFilter?.value) conditions.push(`Giá đến: ${formatMoney(maxAmountFilter.value)}`);
        if (closeDateFromFilter?.value) conditions.push(`Từ ngày: ${closeDateFromFilter.value}`);
        if (closeDateToFilter?.value) conditions.push(`Đến ngày: ${closeDateToFilter.value}`);

        if (summaryEl) {
            summaryEl.innerHTML = conditions.length > 0
                ? `<strong>Điều kiện lưu:</strong><br>• ${conditions.join("<br>• ")}`
                : `<em>Chưa chọn điều kiện lọc nào (lưu toàn bộ cơ hội).</em>`;
        }

        if (modal) modal.style.display = "flex";
    });

    const closeModal = () => {
        if (modal) modal.style.display = "none";
        if (form) form.reset();
    };

    btnClose?.addEventListener("click", closeModal);
    btnCancel?.addEventListener("click", closeModal);

    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = (document.getElementById("saveFilterName")?.value || "").trim();
        if (!name) return;

        const criteria = {};
        if (searchInput?.value) criteria.keyword = searchInput.value.trim();
        if (stageFilter?.value) criteria.stageId = Number(stageFilter.value);
        if (productFilter?.value) criteria.productId = Number(productFilter.value);
        if (ownerFilter?.value) criteria.ownerFilter = ownerFilter.value;
        if (minAmountFilter?.value) criteria.minAmount = Number(minAmountFilter.value);
        if (maxAmountFilter?.value) criteria.maxAmount = Number(maxAmountFilter.value);
        if (closeDateFromFilter?.value) criteria.closeDateFrom = closeDateFromFilter.value;
        if (closeDateToFilter?.value) criteria.closeDateTo = closeDateToFilter.value;

        try {
            await api("/api/saved-filters", {
                method: "POST",
                body: JSON.stringify({
                    name: name,
                    module: "OPPORTUNITY",
                    filterCriteria: criteria
                })
            });
            closeModal();
            await loadSavedFilters();
        } catch (err) {
            alert("Lỗi khi lưu bộ lọc: " + err.message);
        }
    });
}

function setupFilterEventListeners() {
    document.getElementById("btnApplyPipelineFilter")?.addEventListener("click", () => {
        loadOpportunities();
    });

    searchInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            loadOpportunities();
        }
    });

    stageFilter?.addEventListener("change", () => loadOpportunities());
    productFilter?.addEventListener("change", () => loadOpportunities());
    ownerFilter?.addEventListener("change", () => loadOpportunities());

    document.querySelectorAll(".quick-date-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            applyQuickDate(btn.dataset.quickDate);
            loadOpportunities();
        });
    });

    document.getElementById("resetPipelineFilter")?.addEventListener("click", () => {
        resetAllFilters();
    });

    setupSaveFilterModal();
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

document.getElementById("opportunityStage")?.addEventListener("change", event => {
    const stageId = Number(event.target.value);
    const selected = stages.find(s => s.id === stageId);
    if (selected) {
        document.getElementById("opportunityProbability").value = selected.probability;
    }
});

searchInput?.addEventListener("input", render);
ownerFilter?.addEventListener("change", render);

document.getElementById("resetPipelineFilter")?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (ownerFilter) ownerFilter.value = "";
    render();
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
    const stageId = Number(document.getElementById("opportunityStage").value) || stages[0]?.id;
    const probability = clamp(Number(document.getElementById("opportunityProbability").value) || 0, 0, 100);
    const amount = Math.max(0, Number(document.getElementById("opportunityValue").value) || 0);
    const expectedCloseDate = fieldValue("opportunityCloseDate") || null;

    const payload = {
        name,
        customerId,
        stageId,
        probability,
        amount,
        expectedCloseDate
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
                amount: value
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
    if (!compIdVal) {
        if (error) error.textContent = "Vui lòng chọn đối thủ cạnh tranh thắng thầu.";
        return;
    }
    if (error) error.textContent = "";

    try {
        await api(`/api/opportunities/${closingOppId}/close`, {
            method: "POST",
            body: JSON.stringify({
                status: "LOST",
                lossReasonId: Number(reasonIdVal),
                competitorId: Number(compIdVal)
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
        alert("Không thể chuyển giai đoạn: " + err.message);
    }
}

async function moveStageTo(oppId, targetStageId) {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp || opp.stageId === targetStageId) return;

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
        alert("Không thể chuyển giai đoạn: " + err.message);
        render(); // Rollback UI
    }
}

/* =========================================================
   RENDER BOARD & CARDS
========================================================= */
const STAGE_THEME_COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444"];

function render() {
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
    card.draggable = window.innerWidth > 768;
    card.dataset.id = String(record.id);

    const currentStageIndex = stages.findIndex(s => s.id === record.stageId);
    const canPrev = currentStageIndex > 0;
    const canNext = currentStageIndex < stages.length - 1;

    card.innerHTML = `
        <button class="card-menu-btn" type="button" data-card-menu="${record.id}">⋮</button>

        <div class="card-menu" data-menu="${record.id}">
            <button type="button" data-edit-opportunity="${record.id}">Sửa</button>
            ${canPrev ? `<button type="button" data-prev-stage="${record.id}">← Giai đoạn trước</button>` : ""}
            ${canNext ? `<button type="button" data-next-stage="${record.id}">Giai đoạn tiếp →</button>` : ""}
            <button type="button" class="won" data-close-won="${record.id}">✓ Đóng Thắng</button>
            <button type="button" class="lost" data-close-lost="${record.id}">✕ Đóng Thua</button>
            <button type="button" style="color:#ef4444;" data-delete-opportunity="${record.id}">🗑 Xóa</button>
        </div>

        <h3>${escapeHtml(record.name)}</h3>

        <div class="opportunity-customer">
            ${escapeHtml(record.customerName || "Chưa chọn khách hàng")}
        </div>

        <strong class="opportunity-value">
            ${formatMoney(record.amount || 0)}
        </strong>

        <div class="opportunity-meta">
            <span>${record.probability ?? 0}% xác suất</span>
            <span>${escapeHtml(record.expectedCloseDate || "—")}</span>
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

/* =========================================================
   DRAWER OPEN / CLOSE
========================================================= */
function openOpportunityDrawer(id = null) {
    editingOppId = id;
    const titleEl = document.getElementById("opportunityDrawerTitle");
    const nameErr = document.getElementById("opportunityNameError");
    const custErr = document.getElementById("opportunityCustomerError");
    if (nameErr) nameErr.textContent = "";
    if (custErr) custErr.textContent = "";

    if (id !== null) {
        const opp = opportunities.find(o => o.id === id);
        if (opp) {
            if (titleEl) titleEl.textContent = "Sửa cơ hội";
            setField("opportunityName", opp.name);
            setField("opportunityCustomer", opp.customerId);
            setField("opportunityValue", opp.amount);
            setField("opportunityCloseDate", opp.expectedCloseDate);
            setField("opportunityStage", opp.stageId);
            setField("opportunityProbability", opp.probability);
            setField("opportunityOwner", opp.ownerName);
        }
    } else {
        if (titleEl) titleEl.textContent = "Thêm cơ hội";
        opportunityForm.reset();
        if (stages.length > 0) {
            setField("opportunityStage", stages[0].id);
            setField("opportunityProbability", stages[0].probability);
        }
    }

    opportunityDrawer?.classList.add("open");
    opportunityOverlay?.classList.add("open");
}

function closeOpportunityDrawer() {
    opportunityDrawer?.classList.remove("open");
    opportunityOverlay?.classList.remove("open");
    editingOppId = null;
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

// Start
initPipeline();
