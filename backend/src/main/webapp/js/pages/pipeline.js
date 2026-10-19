"use strict";

const API_BASE = "http://localhost:8080/crm";

let stages = [];
let opportunities = [];
let customers = [];
let winReasons = [];
let lossReasons = [];
let competitors = [];
let catalogProducts = [];
let currentOppItems = [];

let draggedOppId = null;
let closingOppId = null;
let editingOppId = null;

const pipelineBoard = document.getElementById("pipelineBoard");
const opportunityDrawer = document.getElementById("opportunityDrawer");
const opportunityOverlay = document.getElementById("opportunityOverlay");
const opportunityForm = document.getElementById("opportunityForm");
const searchInput = document.getElementById("pipelineSearch");
const ownerFilter = document.getElementById("ownerFilter");

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
            loadOpportunities(),
            loadCatalogProducts()
        ]);
        setupProductItemEventListeners();
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
    try {
        const list = await api("/api/opportunities");
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

async function loadCatalogProducts() {
    try {
        const list = await api("/api/products?active=true");
        if (Array.isArray(list) && list.length > 0) {
            catalogProducts = list;
        }
    } catch (err) {
        console.warn("Could not load products from API:", err);
    }

    if (!catalogProducts || catalogProducts.length === 0) {
        catalogProducts = [
            { id: 1, code: "CRM-CLOUD-ENT", name: "Phần mềm CRM Cloud Doanh Nghiệp", type: "RECURRING", listPrice: 2500000, unit: "tháng", active: true },
            { id: 2, code: "CRM-IMPL", name: "Dịch vụ Triển khai & Đào tạo CRM", type: "SERVICE", listPrice: 15000000, unit: "gói", active: true },
            { id: 3, code: "CRM-USER-LIC", name: "Gói người dùng bổ sung CRM", type: "RECURRING", listPrice: 150000, unit: "user/tháng", active: true },
            { id: 4, code: "HW-SERVER", name: "Máy chủ lưu trữ Dedicated", type: "STANDARD", listPrice: 45000000, unit: "chiếc", active: true }
        ];
    }

    populateProductSelect();
}

function populateProductSelect() {
    const select = document.getElementById("oppProductSelect");
    if (!select) return;
    select.innerHTML = '<option value="">-- Chọn sản phẩm / dịch vụ --</option>';
    catalogProducts.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        const typeLabel = p.type === "RECURRING" ? "[Thuê bao] " : (p.type === "SERVICE" ? "[Dịch vụ] " : "");
        opt.textContent = `${typeLabel}${p.name} (${p.code || ""}) - ${formatMoney(p.listPrice || 0)}`;
        select.appendChild(opt);
    });
}

function resetProductInputControls() {
    const select = document.getElementById("oppProductSelect");
    if (select) select.value = "";
    const qty = document.getElementById("oppItemQuantity");
    if (qty) qty.value = "1";
    const unitPrice = document.getElementById("oppItemUnitPrice");
    if (unitPrice) unitPrice.value = "";
    const hint = document.getElementById("oppItemListPriceHint");
    if (hint) hint.textContent = "";
    const recurringBox = document.getElementById("oppRecurringOptions");
    if (recurringBox) recurringBox.style.display = "none";
    const cycle = document.getElementById("oppItemBillingCycle");
    if (cycle) cycle.value = "MONTHLY";
    const term = document.getElementById("oppItemTermCount");
    if (term) term.value = "12";
    const acv = document.getElementById("oppItemAnnualAmount");
    if (acv) {
        acv.value = "";
        delete acv.dataset.userEdited;
    }
}

function calculateAnnualAmount(qty, unitPrice, billingCycle) {
    let multiplier = 12;
    if (billingCycle === "QUARTERLY") multiplier = 4;
    else if (billingCycle === "SEMI_ANNUAL") multiplier = 2;
    else if (billingCycle === "ANNUAL") multiplier = 1;
    return Math.max(0, qty * unitPrice * multiplier);
}

function updateRecurringPreview() {
    const recurringBox = document.getElementById("oppRecurringOptions");
    if (!recurringBox || recurringBox.style.display === "none") return;

    const qty = Math.max(1, Number(document.getElementById("oppItemQuantity")?.value) || 1);
    const unitPrice = Math.max(0, Number(document.getElementById("oppItemUnitPrice")?.value) || 0);
    const cycle = document.getElementById("oppItemBillingCycle")?.value || "MONTHLY";
    const acvInput = document.getElementById("oppItemAnnualAmount");

    if (acvInput && !acvInput.dataset.userEdited) {
        acvInput.value = calculateAnnualAmount(qty, unitPrice, cycle);
    }
}

function setupProductItemEventListeners() {
    const select = document.getElementById("oppProductSelect");
    select?.addEventListener("change", () => {
        const prod = catalogProducts.find(p => String(p.id) === String(select.value));
        const unitPriceInput = document.getElementById("oppItemUnitPrice");
        const hintEl = document.getElementById("oppItemListPriceHint");
        const recurringBox = document.getElementById("oppRecurringOptions");
        const acvInput = document.getElementById("oppItemAnnualAmount");

        if (acvInput) delete acvInput.dataset.userEdited;

        if (!prod) {
            if (unitPriceInput) unitPriceInput.value = "";
            if (hintEl) hintEl.textContent = "";
            if (recurringBox) recurringBox.style.display = "none";
            return;
        }

        const listPrice = Number(prod.listPrice) || 0;
        if (unitPriceInput) unitPriceInput.value = listPrice;
        if (hintEl) hintEl.textContent = `Giá niêm yết: ${formatMoney(listPrice)}`;

        if (prod.type === "RECURRING") {
            if (recurringBox) recurringBox.style.display = "block";
            const cycleSelect = document.getElementById("oppItemBillingCycle");
            if (cycleSelect) cycleSelect.value = "MONTHLY";
            const termInput = document.getElementById("oppItemTermCount");
            if (termInput) termInput.value = "12";
            updateRecurringPreview();
        } else {
            if (recurringBox) recurringBox.style.display = "none";
            if (acvInput) acvInput.value = "";
        }
    });

    document.getElementById("oppItemQuantity")?.addEventListener("input", updateRecurringPreview);
    document.getElementById("oppItemUnitPrice")?.addEventListener("input", updateRecurringPreview);
    document.getElementById("oppItemBillingCycle")?.addEventListener("change", updateRecurringPreview);

    document.getElementById("oppItemAnnualAmount")?.addEventListener("input", event => {
        event.target.dataset.userEdited = "true";
    });

    document.getElementById("oppAddItemBtn")?.addEventListener("click", () => {
        const select = document.getElementById("oppProductSelect");
        const prod = catalogProducts.find(p => String(p.id) === String(select?.value));
        if (!prod) {
            alert("Vui lòng chọn sản phẩm / dịch vụ từ danh mục.");
            return;
        }

        const qty = Math.max(1, parseInt(document.getElementById("oppItemQuantity")?.value, 10) || 1);
        const unitPriceVal = document.getElementById("oppItemUnitPrice")?.value;
        const unitPrice = (unitPriceVal !== "" && !isNaN(Number(unitPriceVal)))
            ? Math.max(0, Number(unitPriceVal))
            : (Number(prod.listPrice) || 0);

        const isRecurring = (prod.type === "RECURRING");
        let billingCycle = null;
        let termCount = 1;
        let annualAmount = 0;
        let totalAmount = 0;

        if (isRecurring) {
            billingCycle = document.getElementById("oppItemBillingCycle")?.value || "MONTHLY";
            termCount = Math.max(1, parseInt(document.getElementById("oppItemTermCount")?.value, 10) || 12);

            const userAcvVal = document.getElementById("oppItemAnnualAmount")?.value;
            if (userAcvVal !== "" && !isNaN(Number(userAcvVal))) {
                annualAmount = Math.max(0, Number(userAcvVal));
            } else {
                annualAmount = calculateAnnualAmount(qty, unitPrice, billingCycle);
            }
            totalAmount = qty * unitPrice * termCount;
        } else {
            termCount = 1;
            annualAmount = 0;
            totalAmount = qty * unitPrice;
        }

        currentOppItems.push({
            productId: prod.id,
            productCode: prod.code || "",
            productName: prod.name || "",
            productType: prod.type || "STANDARD",
            quantity: qty,
            unitPrice: unitPrice,
            listPrice: Number(prod.listPrice) || 0,
            discountPercent: 0,
            billingCycle: billingCycle,
            termCount: termCount,
            annualAmount: annualAmount,
            totalAmount: totalAmount
        });

        resetProductInputControls();
        renderOppItemsTable();
    });
}

function billingCycleLabel(cycle) {
    switch (cycle) {
        case "MONTHLY": return "Tháng";
        case "QUARTERLY": return "Quý";
        case "SEMI_ANNUAL": return "6 tháng";
        case "ANNUAL": return "Năm";
        default: return cycle || "";
    }
}

function renderOppItemsTable() {
    const tbody = document.getElementById("oppItemsBody");
    const summaryTotal = document.getElementById("oppSummaryTotal");
    const summaryAnnual = document.getElementById("oppSummaryAnnual");
    const summaryAnnualBox = document.getElementById("oppSummaryAnnualBox");
    const oppValueInput = document.getElementById("opportunityValue");

    if (!tbody) return;

    if (!currentOppItems || currentOppItems.length === 0) {
        tbody.innerHTML = `
            <tr id="emptyItemsRow">
                <td colspan="7" style="text-align: center; color: var(--crm-muted); padding: 12px;">
                    Chưa có dòng sản phẩm nào. Chọn sản phẩm phía trên để tính giá trị hợp đồng.
                </td>
            </tr>
        `;
        if (summaryTotal) summaryTotal.textContent = "0 ₫";
        if (summaryAnnualBox) summaryAnnualBox.style.display = "none";
        if (oppValueInput) oppValueInput.value = "0";
        return;
    }

    tbody.innerHTML = "";
    let totalOppAmount = 0;
    let totalAnnualAmount = 0;

    currentOppItems.forEach((item, index) => {
        totalOppAmount += Number(item.totalAmount) || 0;
        totalAnnualAmount += Number(item.annualAmount) || 0;

        const isRec = (item.productType === "RECURRING");
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <strong>${escapeHtml(item.productName)}</strong>
                <small style="display:block;color:#64748b;">${escapeHtml(item.productCode || "")}</small>
                ${isRec ? '<span class="opp-badge-recurring">Thuê bao</span>' : ''}
            </td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${formatMoney(item.unitPrice)}</td>
            <td style="text-align: center;">${isRec ? `${item.termCount} kỳ (${billingCycleLabel(item.billingCycle)})` : '—'}</td>
            <td style="text-align: right;">${isRec ? formatMoney(item.annualAmount) : '—'}</td>
            <td style="text-align: right; font-weight: 600;">${formatMoney(item.totalAmount)}</td>
            <td style="text-align: center;">
                <button type="button" class="crm-btn-link" data-remove-item="${index}" style="color:#ef4444;font-size:14px;cursor:pointer;" title="Xóa dòng">✕</button>
            </td>
        `;

        tr.querySelector("[data-remove-item]")?.addEventListener("click", () => {
            currentOppItems.splice(index, 1);
            renderOppItemsTable();
        });

        tbody.appendChild(tr);
    });

    if (oppValueInput) oppValueInput.value = totalOppAmount;
    if (summaryTotal) summaryTotal.textContent = formatMoney(totalOppAmount);
    if (summaryAnnualBox) {
        if (totalAnnualAmount > 0) {
            summaryAnnualBox.style.display = "block";
            if (summaryAnnual) summaryAnnual.textContent = formatMoney(totalAnnualAmount);
        } else {
            summaryAnnualBox.style.display = "none";
        }
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
    const sumTotal = currentOppItems.reduce((sum, it) => sum + (Number(it.totalAmount) || 0), 0);
    const sumAnnual = currentOppItems.reduce((sum, it) => sum + (Number(it.annualAmount) || 0), 0);
    const amount = currentOppItems.length > 0 ? sumTotal : Math.max(0, Number(document.getElementById("opportunityValue").value) || 0);
    const expectedCloseDate = fieldValue("opportunityCloseDate") || null;

    const payload = {
        name,
        customerId,
        stageId,
        probability,
        amount,
        annualAmount: sumAnnual,
        expectedCloseDate,
        items: currentOppItems
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
    if (!pipelineBoard) return;
    pipelineBoard.innerHTML = "";

    const query = (searchInput?.value || "").trim().toLowerCase();
    const owner = (ownerFilter?.value || "").trim();

    const filtered = opportunities.filter(opp => {
        const text = `${opp.name || ""} ${opp.customerName || ""}`.toLowerCase();
        const searchOk = !query || text.includes(query);
        const ownerOk = !owner || (opp.ownerName || "").includes(owner) || (owner === "Tôi");
        return searchOk && ownerOk;
    });

    stages.forEach((st, idx) => {
        const themeColor = STAGE_THEME_COLORS[idx % STAGE_THEME_COLORS.length];

        const col = document.createElement("article");
        col.className = "pipeline-column";
        col.dataset.stage = String(st.id);

        const stageOpps = filtered.filter(o => o.stageId === st.id);
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
async function openOpportunityDrawer(id = null) {
    editingOppId = id;
    const titleEl = document.getElementById("opportunityDrawerTitle");
    const nameErr = document.getElementById("opportunityNameError");
    const custErr = document.getElementById("opportunityCustomerError");
    if (nameErr) nameErr.textContent = "";
    if (custErr) custErr.textContent = "";

    resetProductInputControls();
    currentOppItems = [];
    renderOppItemsTable();

    if (id !== null) {
        if (titleEl) titleEl.textContent = "Sửa cơ hội";
        const opp = opportunities.find(o => o.id === id);
        if (opp) {
            setField("opportunityName", opp.name);
            setField("opportunityCustomer", opp.customerId);
            setField("opportunityValue", opp.amount);
            setField("opportunityCloseDate", opp.expectedCloseDate);
            setField("opportunityStage", opp.stageId);
            setField("opportunityProbability", opp.probability);
            setField("opportunityOwner", opp.ownerName);
        }

        try {
            const fullOpp = await api(`/api/opportunities/${id}`);
            if (fullOpp) {
                if (fullOpp.name) setField("opportunityName", fullOpp.name);
                if (fullOpp.customerId) setField("opportunityCustomer", fullOpp.customerId);
                if (fullOpp.amount !== undefined) setField("opportunityValue", fullOpp.amount);
                if (fullOpp.expectedCloseDate) setField("opportunityCloseDate", fullOpp.expectedCloseDate);
                if (fullOpp.stageId) setField("opportunityStage", fullOpp.stageId);
                if (fullOpp.probability !== undefined) setField("opportunityProbability", fullOpp.probability);
                if (fullOpp.ownerName) setField("opportunityOwner", fullOpp.ownerName);

                if (Array.isArray(fullOpp.items) && fullOpp.items.length > 0) {
                    currentOppItems = fullOpp.items.map(it => ({
                        id: it.id,
                        opportunityId: it.opportunityId,
                        productId: it.productId,
                        productCode: it.productCode || "",
                        productName: it.productName || ("Sản phẩm #" + it.productId),
                        productType: it.productType || "STANDARD",
                        quantity: Number(it.quantity) || 1,
                        unitPrice: Number(it.unitPrice) || 0,
                        listPrice: Number(it.listPrice) || 0,
                        discountPercent: Number(it.discountPercent) || 0,
                        billingCycle: it.billingCycle || null,
                        termCount: Number(it.termCount) || 1,
                        annualAmount: Number(it.annualAmount) || 0,
                        totalAmount: Number(it.totalAmount) || 0,
                        notes: it.notes || ""
                    }));
                }
                renderOppItemsTable();
            }
        } catch (err) {
            console.warn("Could not load opportunity details:", err);
        }
    } else {
        if (titleEl) titleEl.textContent = "Thêm cơ hội";
        opportunityForm.reset();
        currentOppItems = [];
        renderOppItemsTable();
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
